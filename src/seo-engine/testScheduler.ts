/**
 * Production Scheduler Deterministic Unit & Integration Test Suite
 * 
 * Tests:
 * 1. Timezone conversion and slot matching (America/New_York, UTC, Europe/London).
 * 2. America/New_York around Daylight Saving Time (DST) transitions.
 * 3. Article production slot triggers createDailyProductionBatch().
 * 4. Duplicate execution prevention for the same date + slot.
 * 5. engineActive = false prevents execution.
 * 6. Server restart / state reload does not duplicate the same slot.
 * 7. Daily quota (articlesPerDay = 2) prevents a 3rd article batch on the same date.
 * 8. Pinterest slots do not create new article jobs.
 */

import fs from 'fs';
import path from 'path';
import {
  getTimeInTimezone,
  evaluateSchedulerTick,
  stopSeoEngineScheduler,
} from './scheduler';
import {
  readEngineState,
  writeEngineState,
  getEngineStateFilePath,
} from './queue/engineStorage';
import { DiscoveredTopic } from './types';

async function runSchedulerTests() {
  console.log('=== STARTING PRODUCTION SCHEDULER TESTS ===');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string, details?: any) {
    if (cond) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  // Backup existing real state before running tests
  const statePath = getEngineStateFilePath();
  const originalStateContent = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Timezone conversion and slot matching
    // -----------------------------------------------------------------
    // 2026-09-27 12:00:00 UTC -> 2026-09-27 08:00:00 EDT (America/New_York is UTC-4 in September)
    const testDateUtc = new Date('2026-09-27T12:00:00.000Z');
    const nyInfo = getTimeInTimezone(testDateUtc, 'America/New_York');
    assert(nyInfo.dateStr === '2026-09-27', '1a. Timezone correctly computes NY date (2026-09-27)');
    assert(nyInfo.timeStr === '08:00', `1b. Timezone correctly converts 12:00 UTC to 08:00 EDT (Got: ${nyInfo.timeStr})`);
    assert(nyInfo.dayOfWeek === 7, '1c. Timezone computes correct weekday (Sun = 7)');

    // -----------------------------------------------------------------
    // TEST 2: DST Transition handling for America/New_York
    // -----------------------------------------------------------------
    // Summer (EDT - UTC-4): 2026-07-15 12:00 UTC -> 08:00 NY
    const summerDate = new Date('2026-07-15T12:00:00.000Z');
    const summerNy = getTimeInTimezone(summerDate, 'America/New_York');
    assert(summerNy.timeStr === '08:00', `2a. DST Summer EDT: 12:00 UTC -> 08:00 NY (Got: ${summerNy.timeStr})`);

    // Winter (EST - UTC-5): 2026-01-15 13:00 UTC -> 08:00 NY
    const winterDate = new Date('2026-01-15T13:00:00.000Z');
    const winterNy = getTimeInTimezone(winterDate, 'America/New_York');
    assert(winterNy.timeStr === '08:00', `2b. DST Winter EST: 13:00 UTC -> 08:00 NY (Got: ${winterNy.timeStr})`);

    // -----------------------------------------------------------------
    // SETUP MOCK STATE FOR PIPELINE TESTS
    // -----------------------------------------------------------------
    const testState = readEngineState();
    testState.config.engineActive = true;
    testState.config.timezone = 'America/New_York';
    testState.config.articlePublishTimes = ['08:00', '12:00', '16:00', '20:00'];
    testState.config.pinterestPublishTimes = ['09:00', '13:00', '17:00', '21:00'];
    testState.config.articlesPerDay = 2;
    testState.lastExecutedArticleSlot = undefined;
    testState.lastExecutedPinterestSlot = undefined;
    testState.activeJobs = [];
    testState.completedJobsHistory = [];
    testState.todayDiscoveredTopics = [];
    writeEngineState(testState);

    // -----------------------------------------------------------------
    // TEST 3: Article slot triggers createDailyProductionBatch
    // -----------------------------------------------------------------
    // Date corresponds to 08:00 EDT in NY
    const slot0800Utc = new Date('2026-09-27T12:00:00.000Z');
    const tickResult1 = await evaluateSchedulerTick(slot0800Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });

    assert(tickResult1.triggered === true, '3a. Article slot 08:00 triggered execution');
    assert(tickResult1.action === 'article_batch', '3b. Action is article_batch');
    assert(tickResult1.slotKey === '2026-09-27_08:00', '3c. slotKey is 2026-09-27_08:00');

    const stateAfterTick1 = readEngineState();
    assert(stateAfterTick1.lastExecutedArticleSlot === '2026-09-27_08:00', '3d. State recorded lastExecutedArticleSlot');
    assert(stateAfterTick1.activeJobs.length === 2, `3e. Exactly 2 active jobs created (Got: ${stateAfterTick1.activeJobs.length})`);
    assert(stateAfterTick1.activeJobs[0].contentType === 'trending_crochet', '3f. Job 1 is trending_crochet');
    assert(stateAfterTick1.activeJobs[1].contentType === 'tool_guide', '3g. Job 2 is tool_guide');

    // -----------------------------------------------------------------
    // TEST 4: Duplicate execution prevention for the same date + slot
    // -----------------------------------------------------------------
    // Same slot called immediately again (e.g. 1 minute later during the same 08:00 window)
    const tickResult2 = await evaluateSchedulerTick(slot0800Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(tickResult2.triggered === false, '4a. Duplicate slot execution was prevented');
    assert(tickResult2.action === 'skipped_already_executed', '4b. Skipped reason is skipped_already_executed');

    const stateAfterTick2 = readEngineState();
    assert(stateAfterTick2.activeJobs.length === 2, '4c. No duplicate jobs added to queue');

    // -----------------------------------------------------------------
    // TEST 5: engineActive = false prevents execution
    // -----------------------------------------------------------------
    stateAfterTick2.config.engineActive = false;
    writeEngineState(stateAfterTick2);

    const slot1200Utc = new Date('2026-09-27T16:00:00.000Z'); // 12:00 EDT
    const tickResultDisabled = await evaluateSchedulerTick(slot1200Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(tickResultDisabled.triggered === false, '5a. Inactive engine prevents execution');
    assert(tickResultDisabled.action === 'skipped_disabled', '5b. Action is skipped_disabled');

    // Re-enable engine
    const stateReenabled = readEngineState();
    stateReenabled.config.engineActive = true;
    writeEngineState(stateReenabled);

    // -----------------------------------------------------------------
    // TEST 6: Server restart does not duplicate the same slot
    // -----------------------------------------------------------------
    // Simulate process restart by reloading from disk with recorded slot
    const freshStateFromDisk = readEngineState();
    assert(freshStateFromDisk.lastExecutedArticleSlot === '2026-09-27_08:00', '6a. State persistence survives restart');
    const restartTick = await evaluateSchedulerTick(slot0800Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(restartTick.triggered === false, '6b. Post-restart tick for same slot is skipped');

    // -----------------------------------------------------------------
    // TEST 7: Daily quota (articlesPerDay = 2) prevents 3rd article batch
    // -----------------------------------------------------------------
    // Slot 12:00 EDT is reached on the same day, but 2 jobs already exist for today
    const tickResultQuota = await evaluateSchedulerTick(slot1200Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(tickResultQuota.triggered === false, '7a. Daily quota prevented 3rd article creation');
    assert(tickResultQuota.action === 'skipped_quota_reached', '7b. Action is skipped_quota_reached');

    // -----------------------------------------------------------------
    // TEST 8: Pinterest slots do not create new article jobs
    // -----------------------------------------------------------------
    // 09:00 EDT in NY (13:00 UTC)
    const slotPinterest0900Utc = new Date('2026-09-27T13:00:00.000Z');
    const initialJobCount = readEngineState().activeJobs.length;

    const tickResultPinterest = await evaluateSchedulerTick(slotPinterest0900Utc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(tickResultPinterest.triggered === true, '8a. Pinterest slot 09:00 triggered');
    assert(tickResultPinterest.action === 'pinterest_publish', '8b. Action is pinterest_publish');

    const stateAfterPinterest = readEngineState();
    assert(stateAfterPinterest.lastExecutedPinterestSlot === '2026-09-27_09:00', '8c. Recorded lastExecutedPinterestSlot');
    assert(stateAfterPinterest.activeJobs.length === initialJobCount, `8d. No new article jobs created by Pinterest slot (${stateAfterPinterest.activeJobs.length} === ${initialJobCount})`);

    // Non-slot time returns no_slot_match (when no pending jobs in queue)
    const stateClean = readEngineState();
    stateClean.activeJobs = [];
    writeEngineState(stateClean);

    const slotNonMatchingUtc = new Date('2026-09-27T14:23:00.000Z'); // 10:23 EDT
    const tickResultNoMatch = await evaluateSchedulerTick(slotNonMatchingUtc, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(tickResultNoMatch.action === 'no_slot_match', '8e. Non-slot minute returns no_slot_match');

  } finally {
    stopSeoEngineScheduler();

    // Restore original pristine state file
    if (originalStateContent !== null) {
      fs.writeFileSync(statePath, originalStateContent, 'utf8');
      console.log('Restored original pristine state file.');
    }
  }

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSchedulerTests().catch((err) => {
  console.error('Scheduler test suite failed:', err);
  process.exit(1);
});
