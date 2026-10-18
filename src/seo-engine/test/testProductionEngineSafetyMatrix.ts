/**
 * Production Safety Test Suite - Higgsfield Budget, 9-Request Cap & State Recovery Matrix
 * 
 * Tests:
 * 1. State Cleanup & Invariants (failed/stuck jobs purged, valid work preserved)
 * 2. Strict $1.70 Daily Higgsfield Spend Cap
 * 3. Strict 9 Unique Paid Requests Limit per production day
 * 4. Zero/Invalid Cost Protection (rejects estimatedImageCostUsd <= 0)
 * 5. Concurrent In-Flight Reservations (prevents parallel requests from bypassing limits)
 * 6. Task ID Polling & Idempotency (polling existing tasks = $0 new spend, no double-billing)
 * 7. Ambiguous Timeout Protection (preserves reservation to prevent budget overflow)
 * 8. Server Restart & Crash Recovery (preserves task IDs and settled count across restarts)
 */

import fs from 'fs';
import path from 'path';
import {
  reserveHiggsfieldPaidSlot,
  releaseHiggsfieldReservation,
  clearAllHiggsfieldReservations,
  markHiggsfieldReservationAmbiguous,
  getDailyHiggsfieldSpendUsd,
  getDailyHiggsfieldGenerationsCount,
  getActiveHiggsfieldReservations,
  HIGGSFIELD_DAILY_SPEND_CAP_USD,
  MAX_DAILY_HIGGSFIELD_PAID_REQUESTS,
} from '../cost/costTracker';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { recoverInterruptedJobs } from '../queue/jobQueueManager';
import { generateHiggsfieldImage } from '../generation/higgsfieldClient';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runProductionEngineSafetyMatrix() {
  console.log('🧪 Starting Production Engine Safety Test Matrix...\n');

  // =========================================================================
  // TEST 1: State Cleanup & Job Preservation Invariants
  // =========================================================================
  console.log('1️⃣ Testing State Cleanup & Job Preservation Invariants...');
  const state = readEngineState();

  // Invariant 1.1: Zero failed jobs in activeJobs
  const failedJobs = state.activeJobs.filter(j => j.stage === 'failed');
  assert(failedJobs.length === 0, `Expected 0 failed jobs in activeJobs, found ${failedJobs.length}`);

  // Invariant 1.2: Zero permanently stuck unstarted jobs from past dates
  const stuckPastJobs = state.activeJobs.filter(j => j.stage === 'selected' && j.dateScheduled < '2026-10-17');
  assert(stuckPastJobs.length === 0, `Expected 0 stuck past jobs, found ${stuckPastJobs.length}`);

  // Invariant 1.3: Completed work is preserved
  assert(state.completedJobsHistory.length >= 10, `Expected at least 10 completed jobs in history, found ${state.completedJobsHistory.length}`);

  // Invariant 1.4: Config settings
  assert(state.config.engineActive === false, 'engineActive should remain false until deployment confirmation');
  assert(state.config.reuseOnlyMode === false, 'reuseOnlyMode should be false to restore normal production');
  assert(state.config.higgsfieldEnabled === true, 'higgsfieldEnabled should be true');
  assert(state.config.articlesPerDay === 3, 'articlesPerDay should be 3');
  assert(state.config.pinsPerDay === 6, 'pinsPerDay should be 6');
  assert(state.config.pinsPerArticle === 2, 'pinsPerArticle should be 2');
  assert(state.config.estimatedImageCostUsd === 0.03, 'estimatedImageCostUsd should be 0.03');
  assert(state.config.higgsfieldDailyCostLimitUsd === 1.70, 'higgsfieldDailyCostLimitUsd should be 1.70');
  assert(state.config.higgsfieldDailyRequestsLimit === 9, 'higgsfieldDailyRequestsLimit should be 9');
  console.log('   ✅ State cleanup and config invariants verified.');

  // =========================================================================
  // TEST 2: Strict $1.70 Spending Cap Enforcement
  // =========================================================================
  console.log('2️⃣ Testing Strict $1.70 Daily Higgsfield Spending Cap...');
  clearAllHiggsfieldReservations();

  // Test cap with custom high cost
  const normalReservation = reserveHiggsfieldPaidSlot({
    estimatedCostUsd: 0.15,
    jobId: 'test_job_1',
  });
  assert(normalReservation.permitted === true, 'Normal request ($0.15) within $1.70 cap must be permitted');
  assert(typeof normalReservation.reservationId === 'string', 'Must return a valid reservationId');

  // Attempting request that exceeds remaining cap ($1.60 + $0.15 = $1.75 > $1.70)
  const excessiveReservation = reserveHiggsfieldPaidSlot({
    estimatedCostUsd: 1.60,
    jobId: 'test_job_excess',
  });
  assert(excessiveReservation.permitted === false, 'Request that pushes projected spend past $1.70 must be rejected');
  assert(excessiveReservation.reason?.includes('Higgsfield daily spend limit reached'), 'Should provide clear limit reason');

  releaseHiggsfieldReservation(normalReservation.reservationId);
  clearAllHiggsfieldReservations();
  console.log('   ✅ $1.70 spending cap enforcement verified.');

  // =========================================================================
  // TEST 3: Strict 9 Unique Paid Requests Limit per Day
  // =========================================================================
  console.log('3️⃣ Testing Strict 9 Unique Paid Requests Limit...');
  clearAllHiggsfieldReservations();

  const reservations: string[] = [];
  // Reserve 9 slots of $0.05 each (total $0.45 <= $1.70)
  for (let i = 1; i <= 9; i++) {
    const res = reserveHiggsfieldPaidSlot({
      estimatedCostUsd: 0.05,
      jobId: `test_job_slot_${i}`,
    });
    assert(res.permitted === true, `Slot ${i} must be permitted`);
    reservations.push(res.reservationId!);
  }

  // 10th request must be strictly rejected
  const tenthReservation = reserveHiggsfieldPaidSlot({
    estimatedCostUsd: 0.05,
    jobId: 'test_job_slot_10',
  });
  assert(tenthReservation.permitted === false, '10th request must be strictly rejected under 9-request limit');
  assert(tenthReservation.reason?.includes('Higgsfield daily paid requests limit reached'), 'Must cite 9-request limit');

  // Clean up reservations
  for (const rId of reservations) {
    releaseHiggsfieldReservation(rId);
  }
  clearAllHiggsfieldReservations();
  console.log('   ✅ 9-request daily limit enforcement verified.');

  // =========================================================================
  // TEST 4: Zero and Invalid Cost Estimate Rejection
  // =========================================================================
  console.log('4️⃣ Testing Zero and Invalid Cost Rejection...');
  clearAllHiggsfieldReservations();

  const zeroCostRes = reserveHiggsfieldPaidSlot({ estimatedCostUsd: 0, jobId: 'test_zero' });
  assert(zeroCostRes.permitted === false, 'Cost of 0 must be rejected');

  const negCostRes = reserveHiggsfieldPaidSlot({ estimatedCostUsd: -0.05, jobId: 'test_neg' });
  assert(negCostRes.permitted === false, 'Negative cost must be rejected');

  const nanCostRes = reserveHiggsfieldPaidSlot({ estimatedCostUsd: NaN, jobId: 'test_nan' });
  assert(nanCostRes.permitted === false, 'NaN cost must be rejected');
  console.log('   ✅ Zero and invalid cost rejection verified.');

  // =========================================================================
  // TEST 5: Concurrent Reservations Protection
  // =========================================================================
  console.log('5️⃣ Testing Concurrent Reservations Protection...');
  clearAllHiggsfieldReservations();

  // Simulate 15 parallel requests trying to reserve simultaneously
  const attempts = Array.from({ length: 15 }, (_, idx) => 
    reserveHiggsfieldPaidSlot({ estimatedCostUsd: 0.10, jobId: `concurrent_job_${idx}` })
  );

  const successfulAttempts = attempts.filter(a => a.permitted);
  const rejectedAttempts = attempts.filter(a => !a.permitted);

  assert(successfulAttempts.length === 9, `Expected exactly 9 reservations to succeed, got ${successfulAttempts.length}`);
  assert(rejectedAttempts.length === 6, `Expected exactly 6 reservations to be rejected, got ${rejectedAttempts.length}`);

  for (const succ of successfulAttempts) {
    releaseHiggsfieldReservation(succ.reservationId);
  }
  clearAllHiggsfieldReservations();
  console.log('   ✅ Concurrent reservations correctly bounded to exactly 9.');

  // =========================================================================
  // TEST 6: Task Polling Zero-Cost and Deduplication
  // =========================================================================
  console.log('6️⃣ Testing Task Polling Deduplication & Zero Additional Cost...');
  clearAllHiggsfieldReservations();

  // If existingTaskId is provided, generateHiggsfieldImage must NEVER call reserveHiggsfieldPaidSlot
  // or create a new paid request.
  const taskGenResult = await generateHiggsfieldImage({
    prompt: 'test prompt',
    aspectRatio: '16:9',
    slug: 'test-slug',
    existingTaskId: 'test_existing_task_id_123',
    timeoutMs: 200, // rapid timeout for test
  });

  // Polling failed on mock task, but verify no reservation was leaked
  const activeRes = getActiveHiggsfieldReservations();
  assert(activeRes.reservedRequestsCount === 0, 'Polling existing task must not create any paid reservations');
  assert(activeRes.reservedSpendUsd === 0, 'Polling existing task must not reserve any budget');
  console.log('   ✅ Task polling zero-cost verified.');

  // =========================================================================
  // TEST 7: Ambiguous Timeout Protection
  // =========================================================================
  console.log('7️⃣ Testing Ambiguous Timeout Reservation Hold...');
  clearAllHiggsfieldReservations();

  const timedOutRes = reserveHiggsfieldPaidSlot({ estimatedCostUsd: 0.18, jobId: 'job_timeout_1' });
  assert(timedOutRes.permitted === true);
  
  // Mark reservation as ambiguous (as happens when initial POST times out before response)
  markHiggsfieldReservationAmbiguous(timedOutRes.reservationId!);

  // The ambiguous reservation MUST still count against active reservations
  const resState = getActiveHiggsfieldReservations();
  assert(resState.reservedRequestsCount === 1, 'Ambiguous timed-out request must count against request limit');
  assert(resState.reservedSpendUsd >= 0.18, 'Ambiguous timed-out request must count against spend cap');

  releaseHiggsfieldReservation(timedOutRes.reservationId);
  clearAllHiggsfieldReservations();
  console.log('   ✅ Ambiguous timeout reservation hold verified.');

  // =========================================================================
  // TEST 8: Server Restart and Interrupted Job Recovery
  // =========================================================================
  console.log('8️⃣ Testing Server Restart and Interrupted Job Recovery...');
  
  // Create a simulated interrupted in-flight job with an existing task ID
  const testState = readEngineState();
  const testJobId = `job_test_restart_${Date.now()}`;
  testState.activeJobs.push({
    id: testJobId,
    dateScheduled: '2026-10-17',
    contentType: 'trending_crochet',
    category: 'crochet',
    topic: { id: 'test_top', keyword: 'test restart topic', contentType: 'trending_crochet', category: 'crochet', opportunityScore: 80, status: 'researching' },
    stage: 'generating_images',
    requiresApproval: false,
    indexNowNotified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
    pinterestPins: [],
    articleHeroImage: {
      prompt: 'hero prompt',
      compactPrompt: 'hero prompt',
      status: 'pending',
      higgsfieldRequestId: 'req_saved_before_crash_789',
    },
  });
  writeEngineState(testJobId ? testState : testState);

  // Run crash recovery
  recoverInterruptedJobs();

  const refreshedState = readEngineState();
  const recoveredJob = refreshedState.activeJobs.find(j => j.id === testJobId);
  assert(Boolean(recoveredJob), 'Interrupted job must be preserved');
  assert(recoveredJob!.stage === 'selected', 'Interrupted job must be safely reset to selected');
  assert(
    recoveredJob!.articleHeroImage?.higgsfieldRequestId === 'req_saved_before_crash_789',
    'Pre-crash Higgsfield task ID must be completely preserved for polling on retry'
  );

  // Clean up test job
  refreshedState.activeJobs = refreshedState.activeJobs.filter(j => j.id !== testJobId);
  writeEngineState(refreshedState);
  console.log('   ✅ Server restart and crash recovery verified.');

  console.log('\n🎉 ALL 8 PRODUCTION SAFETY TESTS PASSED SUCCESSFULLY!');
  return true;
}

if (process.argv[1]?.endsWith('testProductionEngineSafetyMatrix.ts')) {
  runProductionEngineSafetyMatrix().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
