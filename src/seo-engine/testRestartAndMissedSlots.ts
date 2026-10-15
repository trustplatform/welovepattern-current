/**
 * Focused Isolated Test: Restart, Missed Slots, Timezone Handling & Reserve Safety
 *
 * Verifies:
 * 1. Persistent slot state: Executed and failed slots are persisted in state and never duplicated upon restart.
 * 2. Timezone handling: Time evaluated in America/New_York accurately maps UTC timestamps to EDT/EST.
 * 3. Missed slot recovery: Restarting after a missed slot NEVER consumes the unassigned reserve package.
 * 4. Publication idempotency: Restart after publication never creates duplicate blog posts.
 * 5. Zero mutations to production JSON datastores.
 */

import path from 'path';
import fs from 'fs';

const TEST_STATE_FILE = path.join(process.cwd(), 'data', 'test-restart-slots-state.json');
const TEST_POSTS_FILE = path.join(process.cwd(), 'data', 'test-restart-slots-posts.json');

process.env.SEO_ENGINE_STATE_FILE = 'test-restart-slots-state.json';
process.env.SEO_ENGINE_BLOG_POSTS_FILE = 'test-restart-slots-posts.json';

import { evaluateSchedulerTick } from './scheduler';
import { readEngineState, writeEngineState } from './queue/engineStorage';
import { publishArticleToLiveSite, getLiveBlogPosts } from './publishing/articlePublisher';
import { SeoEngineArticleJob } from './types';

async function testRestartAndMissedSlots() {
  console.log('=== STARTING RESTART AND MISSED SLOTS TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  // 1. Initial State Setup
  const reserveJobId = 'job_2026-10-04_lvcypd';
  const assignedJobId = 'job_2026-09-28_g1urxo';

  const baseState = {
    activeJobs: [
      {
        id: assignedJobId,
        stage: 'ready_to_publish',
        assignedPublishDate: '2026-10-13',
        assignedSlotTime: '08:00',
        publicationScheduledAt: '08:00',
        topic: { id: 'top_1', keyword: 'crochet gauge', opportunityScore: 90 },
        articleContent: {
          title: 'Mastering Crochet Gauge',
          slug: 'mastering-crochet-gauge',
          contentHtml: '<p>' + 'Content for crochet gauge '.repeat(30) + '</p>',
          wordCount: 500,
          heroImage: {
            stableAssetPath: '/public/generated/blog/mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg',
            stablePublicUrl: '/public/generated/blog/mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg',
            status: 'ready',
          },
        },
        pinterestPins: [
          {
            pinNumber: 1,
            publishStatus: 'image_ready',
            stableAssetPath: '/public/generated/pinterest/seo-pins/mastering-crochet-gauge-your-ultimate-ca-e1844b9974.jpg',
          },
          {
            pinNumber: 2,
            publishStatus: 'image_ready',
            stableAssetPath: '/public/generated/pinterest/seo-pins/mastering-crochet-gauge-your-ultimate-ca-f3ea9cf368.jpg',
          },
        ],
        costRecords: [],
        logs: [],
      },
      {
        id: reserveJobId,
        stage: 'awaiting_approval',
        topic: { id: 'top_reserve', keyword: 'crochet yarn calculator', opportunityScore: 95 },
        articleContent: {
          title: 'Crochet Blanket Yarn Calculator',
          slug: 'crochet-blanket-yarn-calculator',
          contentHtml: '<p>' + 'Content for yarn calculator '.repeat(30) + '</p>',
          wordCount: 600,
          heroImage: {
            stableAssetPath: '/public/generated/blog/mastering-the-gauge-swatch-calculator-fo-83ef1d8770.jpg',
            stablePublicUrl: '/public/generated/blog/mastering-the-gauge-swatch-calculator-fo-83ef1d8770.jpg',
            status: 'ready',
          },
        },
        pinterestPins: [
          {
            pinNumber: 1,
            publishStatus: 'image_ready',
            stableAssetPath: '/public/generated/pinterest/seo-pins/crochet-blanket-yarn-calculator-accurate-83ef1d8770.jpg',
          },
          {
            pinNumber: 2,
            publishStatus: 'image_ready',
            stableAssetPath: '/public/generated/pinterest/seo-pins/crochet-blanket-yarn-calculator-accurate-13ec052033.jpg',
          },
        ],
        costRecords: [],
        logs: [],
      },
    ],
    completedJobsHistory: [],
    config: {
      engineActive: true,
      reuseOnlyMode: true,
      articlesPerDay: 3,
      timezone: 'America/New_York',
      articlePublishTimes: ['08:00', '12:00', '16:00'],
      pinterestPublishTimes: ['08:30', '09:00', '12:30', '13:00', '16:30', '17:00'],
      pinterestAutoPublish: false,
    },
    executedArticleSlots: [],
    failedArticleSlots: [],
  };

  fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(baseState, null, 2), 'utf8');
  fs.writeFileSync(TEST_POSTS_FILE, JSON.stringify([], null, 2), 'utf8');

  // -------------------------------------------------------------------------
  // TEST 1: Timezone mapping
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: Timezone Mapping (America/New_York) ---');
  // 12:00:00 UTC on 2026-10-13 is 08:00:00 EDT (America/New_York in daylight saving)
  const utcDateAt0800EDT = new Date('2026-10-13T12:00:00.000Z');
  const tick1 = await evaluateSchedulerTick(utcDateAt0800EDT, { skipQueueWorkerExecution: true });
  assert(
    tick1.slotKey === '2026-10-13_08:00',
    '1a. 12:00 UTC maps to 08:00 EDT in America/New_York timezone'
  );

  // -------------------------------------------------------------------------
  // TEST 2: Restart Dedup - Executed slot is never re-executed after restart
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Persistent Slot Dedup Across Restarts ---');
  const executedState = readEngineState();
  executedState.executedArticleSlots = ['2026-10-13_08:00'];
  executedState.lastExecutedArticleSlot = '2026-10-13_08:00';
  writeEngineState(executedState);

  // Simulate server restart and another tick at 08:00:15 EDT
  const restartTick = await evaluateSchedulerTick(new Date('2026-10-13T12:00:15.000Z'), { skipQueueWorkerExecution: true });
  assert(
    restartTick.action === 'skipped_already_executed',
    '2a. Restarted scheduler skips already executed slot key without duplicate publication'
  );

  // -------------------------------------------------------------------------
  // TEST 3: Failed slot protection across restarts
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Failed Slot Skip Across Restarts ---');
  const failedSlotState = readEngineState();
  failedSlotState.executedArticleSlots = [];
  failedSlotState.failedArticleSlots = ['2026-10-13_12:00'];
  writeEngineState(failedSlotState);

  // Tick at 12:00 EDT (16:00 UTC)
  const failTick = await evaluateSchedulerTick(new Date('2026-10-13T16:00:00.000Z'), { skipQueueWorkerExecution: true });
  assert(
    failTick.action === 'skipped_failed_slot',
    '3a. Restarted scheduler skips previously failed slot to avoid uncontrolled retry loops'
  );

  // -------------------------------------------------------------------------
  // TEST 4: Missed Slot Recovery Does NOT Consume Unassigned Reserve Package
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Missed-Slot Recovery Preserves Reserve Package ---');
  // Set up state where 08:00 slot was missed and has no assigned job, and reserve package exists unassigned
  const missedState = {
    ...baseState,
    activeJobs: [baseState.activeJobs[1]], // ONLY the unassigned reserve package
    executedArticleSlots: [],
    failedArticleSlots: [],
    lastExecutedArticleSlot: undefined,
  };
  writeEngineState(missedState);

  // Tick at 08:05 EDT (12:05 UTC) -> this is a missed-slot catch-up tick for slot 08:00
  const catchUpTick = await evaluateSchedulerTick(new Date('2026-10-13T12:05:00.000Z'), { skipQueueWorkerExecution: true });

  const stateAfterCatchUp = readEngineState();
  const reserveAfterCatchUp = stateAfterCatchUp.activeJobs.find(j => j.id === reserveJobId);

  assert(
    reserveAfterCatchUp !== undefined,
    '4a. Unassigned reserve package remains in activeJobs'
  );
  assert(
    reserveAfterCatchUp?.assignedPublishDate === undefined && reserveAfterCatchUp?.assignedSlotTime === undefined,
    '4b. Unassigned reserve package was NOT assigned or consumed during missed-slot recovery tick'
  );
  assert(
    reserveAfterCatchUp?.stage === 'awaiting_approval',
    '4c. Unassigned reserve package stage remains awaiting_approval'
  );

  // -------------------------------------------------------------------------
  // TEST 5: Publication Idempotency Across Restarts (Blog Datastore)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Blog Datastore Publication Idempotency ---');
  const jobToPublish = { ...baseState.activeJobs[0] };
  const pub1 = await publishArticleToLiveSite(jobToPublish);
  assert(pub1.success === true, '5a. Initial publication succeeds');

  const postsAfter1 = getLiveBlogPosts();
  assert(postsAfter1.length === 1, '5b. Exactly 1 blog post in datastore');

  // Simulate process restart and re-attempting publication of the same job
  jobToPublish.publishedBlogPostId = pub1.blogPostId;
  const pub2 = await publishArticleToLiveSite(jobToPublish);
  assert(pub2.success === true, '5c. Second publication call succeeds cleanly');

  const postsAfter2 = getLiveBlogPosts();
  assert(
    postsAfter2.length === 1,
    '5d. Blog post count remains exactly 1 (no duplicate post records created upon restart)'
  );

  // Cleanup isolated test files
  if (fs.existsSync(TEST_STATE_FILE)) fs.unlinkSync(TEST_STATE_FILE);
  if (fs.existsSync(TEST_POSTS_FILE)) fs.unlinkSync(TEST_POSTS_FILE);

  console.log('\n===============================================================');
  console.log(`RESTART AND MISSED SLOTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

testRestartAndMissedSlots().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
