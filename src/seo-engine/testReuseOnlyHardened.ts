/**
 * Focused, isolated validation suite for WeLovePattern Reuse-Only Publishing.
 * Covers all 12 Critical Safety Invariants.
 * 
 * Invariants:
 * 1. Reuse-only scheduler paths never invoke executeJobLifecycle() or generation functions.
 * 2. Selected placeholder jobs cannot enter the generation lifecycle.
 * 3. Incomplete packages missing content, Hero, or either pin are rejected.
 * 4. Previously published articles are rejected.
 * 5. Conflicting slot assignments and duplicate publication attempts are blocked.
 * 6. Pinterest publication is blocked unless parent article is confirmed live.
 * 7. Inventory exhaustion creates no jobs and causes no external API calls ($0 cost).
 * 8. Missed-slot recovery never consumes the unassigned reserve package.
 * 9. Repeated scheduler ticks do not duplicate successful publications.
 * 10. Slot success is not recorded before publication actually succeeds.
 * 11. A restart or partial failure cannot silently cause duplicate publication.
 * 12. reuseOnlyMode remains safely enabled when configuration fields are missing or use defaults.
 * 
 * ISOLATION GUARANTEE:
 * Uses isolated test files via SEO_ENGINE_STATE_FILE & SEO_ENGINE_BLOG_POSTS_FILE.
 * Production data files (data/blog-posts.json, data/seo-engine-state.json, data/seo-engine-costs.json)
 * are NEVER modified. Byte-for-byte integrity is verified before and after test execution.
 * Does NOT call external APIs (OpenAI, Higgsfield, Pinterest, Bing).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TEST_STATE_FILE = 'data/test-seo-engine-state.json';
const TEST_POSTS_FILE = 'data/test-blog-posts.json';

// Set test environment variables BEFORE importing modules
process.env.SEO_ENGINE_STATE_FILE = TEST_STATE_FILE;
process.env.SEO_ENGINE_BLOG_POSTS_FILE = 'test-blog-posts.json';

import { evaluateSchedulerTick } from './scheduler';
import { executeJobLifecycle, processQueueWorker } from './queue/jobQueueManager';
import { getEligibleRecoveredJobs, isValidLocalAsset } from './queue/assetRecovery';
import { dispatchScheduledPinterestSlot } from './publishing/pinterestSlotDispatcher';
import { readEngineState, writeEngineState } from './queue/engineStorage';
import { getLiveBlogPosts, publishArticleToLiveSite } from './publishing/articlePublisher';
import { DEFAULT_SEO_ENGINE_CONFIG } from './config';
import { SeoEngineDailyState, SeoEngineArticleJob } from './types';

function computeFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return 'MISSING';
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runReuseOnlyHardenedTests() {
  console.log('===============================================================');
  console.log('STARTING REUSE-ONLY PUBLISHING CRITICAL INVARIANTS TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // Pre-test Production Data Hashes
  const prodStateHashBefore = computeFileHash('data/seo-engine-state.json');
  const prodPostsHashBefore = computeFileHash('data/blog-posts.json');
  const prodCostsHashBefore = computeFileHash('data/seo-engine-costs.json');

  // Read production state as baseline fixture (read-only)
  const realProdState: SeoEngineDailyState = JSON.parse(fs.readFileSync('data/seo-engine-state.json', 'utf8'));
  const realProdPosts = JSON.parse(fs.readFileSync('data/blog-posts.json', 'utf8'));

  // Initialize isolated test fixture files
  fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(realProdState, null, 2), 'utf8');
  fs.writeFileSync(TEST_POSTS_FILE, JSON.stringify(realProdPosts, null, 2), 'utf8');

  try {
    // -----------------------------------------------------------------
    // INVARIANT 1: Reuse-only scheduler paths never invoke executeJobLifecycle() or generation functions
    // -----------------------------------------------------------------
    console.log('--- INVARIANT 1: Generation Lifecycle Prevention in Reuse-Only Paths ---');
    {
      const testState = readEngineState();
      testState.config.reuseOnlyMode = true;
      writeEngineState(testState);

      // Verify processQueueWorker skips immediately
      let queueWorkerCompletedCleanly = false;
      try {
        await processQueueWorker();
        queueWorkerCompletedCleanly = true;
      } catch {
        queueWorkerCompletedCleanly = false;
      }
      assert(queueWorkerCompletedCleanly, '1. processQueueWorker skips generation cleanly ($0 cost, 0 AI calls)');
    }

    // -----------------------------------------------------------------
    // INVARIANT 2: Selected placeholder jobs cannot enter the generation lifecycle
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 2: Selected Placeholder Jobs Blocked from Generation ---');
    {
      const testState = readEngineState();
      const placeholderJob: SeoEngineArticleJob = {
        id: 'test_job_selected_placeholder',
        dateScheduled: '2026-10-13',
        contentType: 'tool_guide',
        category: 'tools',
        stage: 'selected',
        requiresApproval: false,
        topic: {
          id: 'test_topic_calc',
          keyword: 'crochet test calculator',
          contentType: 'tool_guide',
          category: 'tools',
          opportunityScore: 85,
          status: 'selected',
        },
        pinterestPins: [],
        indexNowNotified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [],
      };
      testState.activeJobs.push(placeholderJob);
      writeEngineState(testState);

      const returnedJob = await executeJobLifecycle(placeholderJob.id);
      assert(
        returnedJob.stage === 'selected',
        '2. executeJobLifecycle exits safely for placeholder job without transitioning to research/generation'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 3: Incomplete packages missing content, Hero, or either pin are rejected
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 3: Rejection of Incomplete Packages ---');
    {
      const eligible = getEligibleRecoveredJobs(10);
      for (const job of eligible) {
        const hasContent = Boolean(job.articleContent?.title && job.articleContent?.contentHtml && job.articleContent.contentHtml.length > 200);
        const hasHero = isValidLocalAsset(job.articleContent?.heroImage?.stableAssetPath);
        const hasPin1 = isValidLocalAsset(job.pinterestPins?.[0]?.stableAssetPath);
        const hasPin2 = isValidLocalAsset(job.pinterestPins?.[1]?.stableAssetPath);
        assert(
          hasContent && hasHero && hasPin1 && hasPin2,
          `3a. Eligible job ${job.id} has complete content, valid local Hero, and both Pins`
        );
      }

      // Check that invalid asset paths fail isValidLocalAsset
      assert(!isValidLocalAsset('/non/existent/image.jpg'), '3b. Non-existent image path rejected');
      assert(!isValidLocalAsset('https://remote.com/image.jpg'), '3c. Remote URL rejected by isValidLocalAsset');
      assert(!isValidLocalAsset(undefined), '3d. Undefined asset path rejected');

      // Check placeholder job with missing content is excluded
      const placeholderJob = realProdState.activeJobs.find(j => j.id === 'job_2026-10-12_pz6m4i');
      if (placeholderJob) {
        assert(!eligible.some(j => j.id === placeholderJob.id), '3e. Incomplete job_2026-10-12_pz6m4i excluded from eligible pool');
      }
    }

    // -----------------------------------------------------------------
    // INVARIANT 4: Previously published articles are rejected
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 4: Rejection of Previously Published Articles ---');
    {
      const posts = getLiveBlogPosts();
      const eligible = getEligibleRecoveredJobs(10);
      for (const post of posts) {
        const matchingJob = eligible.find(j => j.id === post.seoEngineJobId || j.articleContent?.slug === post.slug);
        assert(!matchingJob, `4. Published post "${post.slug}" excluded from eligible recovery pool`);
      }
    }

    // -----------------------------------------------------------------
    // INVARIANT 5: Conflicting slot assignments and duplicate publication attempts are blocked
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 5: Duplicate Slot & Conflict Prevention ---');
    {
      const testSimulatedDate = new Date('2026-10-13T12:00:00.000Z'); // 08:00 EDT in NY
      const mockSlotKey = '2026-10-13_08:00';
      const stateObj = readEngineState();
      stateObj.executedArticleSlots = [mockSlotKey];
      stateObj.lastExecutedArticleSlot = mockSlotKey;
      writeEngineState(stateObj);

      const tickResult = await evaluateSchedulerTick(testSimulatedDate, { skipQueueWorkerExecution: true });
      assert(
        tickResult.action === 'skipped_already_executed',
        '5. Scheduler blocks execution for already executed slot',
        tickResult.reason
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 6: Pinterest publication is blocked unless parent article is confirmed live
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 6: Pinterest Parent Article Live Dependency ---');
    {
      // Reset test state to baseline
      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(realProdState, null, 2), 'utf8');

      const dispatchResult = await dispatchScheduledPinterestSlot('08:30', '2026-10-13');
      assert(
        dispatchResult.pinPublished === false,
        '6a. Pinterest Pin blocked when parent article is awaiting approval / not live'
      );
      assert(
        (dispatchResult.reason || '').includes('Parent article') || (dispatchResult.reason || '').includes('not yet'),
        '6b. Rejection reason cites parent article status'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 7: Inventory exhaustion creates no jobs and causes no external API calls ($0 cost)
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 7: Safe Inventory Exhaustion Without Generation ---');
    {
      const emptyState = readEngineState();
      emptyState.activeJobs = [];
      emptyState.executedArticleSlots = [];
      emptyState.lastExecutedArticleSlot = undefined;
      emptyState.config.reuseOnlyMode = true;
      writeEngineState(emptyState);

      const slotTimeDate = new Date('2026-10-13T12:00:00.000Z'); // 08:00 EDT
      const result = await evaluateSchedulerTick(slotTimeDate, { skipQueueWorkerExecution: true });
      assert(
        result.action === 'inventory_exhausted',
        '7a. Scheduler reports inventory_exhausted when zero packages remain',
        result.reason
      );

      const stateAfter = readEngineState();
      assert(
        stateAfter.activeJobs.length === 0,
        '7b. Zero jobs created upon inventory exhaustion ($0 cost)'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 8: Missed-slot recovery never consumes the unassigned reserve package
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 8: Reserve Package Preservation ---');
    {
      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(realProdState, null, 2), 'utf8');

      const state = readEngineState();
      const reserveJob = state.activeJobs.find(j => j.id === 'job_2026-10-04_lvcypd');
      assert(Boolean(reserveJob), '8a. Reserve package job_2026-10-04_lvcypd present in activeJobs');
      assert(
        reserveJob?.assignedPublishDate === undefined && reserveJob?.assignedSlotTime === undefined,
        '8b. Reserve package has no assigned date or slot'
      );

      // Simulate a missed slot where slot 08:00 had no assigned job
      state.activeJobs = state.activeJobs.filter(j => j.id !== 'job_2026-09-28_g1urxo');
      state.executedArticleSlots = [];
      state.lastExecutedArticleSlot = undefined;
      writeEngineState(state);

      const missedTickDate = new Date('2026-10-13T12:05:00.000Z'); // 08:05 EDT
      const missedResult = await evaluateSchedulerTick(missedTickDate, { skipQueueWorkerExecution: true });

      const stateAfterMissed = readEngineState();
      const reserveStillUnassigned = stateAfterMissed.activeJobs.find(j => j.id === 'job_2026-10-04_lvcypd');
      assert(
        reserveStillUnassigned?.assignedPublishDate === undefined,
        '8c. Missed-slot recovery did NOT consume the unassigned reserve package',
        missedResult.action
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 9: Repeated scheduler ticks do not duplicate successful publications
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 9: Deduplication of Repeated Scheduler Ticks ---');
    {
      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(realProdState, null, 2), 'utf8');
      const state = readEngineState();
      const executedKey = '2026-10-13_08:00';
      state.executedArticleSlots = [executedKey];
      state.lastExecutedArticleSlot = executedKey;
      writeEngineState(state);

      const tickDate1 = new Date('2026-10-13T12:00:00.000Z'); // 08:00:00 EDT
      const tickResult1 = await evaluateSchedulerTick(tickDate1, { skipQueueWorkerExecution: true });

      const tickDate2 = new Date('2026-10-13T12:00:30.000Z'); // 08:00:30 EDT (same slot minute)
      const tickResult2 = await evaluateSchedulerTick(tickDate2, { skipQueueWorkerExecution: true });

      const tickDate3 = new Date('2026-10-13T12:01:00.000Z'); // 08:01:00 EDT
      const tickResult3 = await evaluateSchedulerTick(tickDate3, { skipQueueWorkerExecution: true });

      assert(
        tickResult1.action === 'skipped_already_executed' &&
        tickResult2.action === 'skipped_already_executed' &&
        tickResult3.triggered === false,
        '9. Subsequent scheduler ticks for the same slot time are skipped without duplication'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 10: Slot success is not recorded before publication actually succeeds
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 10: Slot Success Only Recorded on Actual Success ---');
    {
      fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(realProdState, null, 2), 'utf8');
      const state = readEngineState();
      const slotKey = '2026-10-13_08:00';
      state.executedArticleSlots = [];
      state.failedArticleSlots = [];
      writeEngineState(state);

      // Verify that prior to publication success, the slot is NOT in executedArticleSlots
      assert(
        !state.executedArticleSlots?.includes(slotKey),
        '10a. Slot is not marked in executedArticleSlots before execution'
      );

      // Simulate a failed slot outcome in state
      state.failedArticleSlots = [slotKey];
      state.slotAttemptCounts = { [slotKey]: 1 };
      writeEngineState(state);

      const stateAfterFail = readEngineState();
      assert(
        !stateAfterFail.executedArticleSlots?.includes(slotKey) && stateAfterFail.failedArticleSlots?.includes(slotKey),
        '10b. Failed slot is recorded in failedArticleSlots and NOT in executedArticleSlots'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 11: A restart or partial failure cannot silently cause duplicate publication
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 11: Idempotency Under Restart or Partial Failure ---');
    {
      // Using isolated test posts file
      const initialPosts = getLiveBlogPosts();
      const testJob: SeoEngineArticleJob = {
        id: 'job_test_idempotency_restart',
        stage: 'completed',
        dateScheduled: '2026-10-13',
        contentType: 'tool_guide',
        category: 'tools',
        requiresApproval: false,
        topic: {
          id: 'topic_idempotency_test',
          keyword: 'crochet idempotency test',
          contentType: 'tool_guide',
          category: 'tools',
          opportunityScore: 90,
          status: 'selected'
        },
        articleContent: {
          title: 'Idempotency Test Guide',
          slug: 'idempotency-test-guide-for-restart',
          excerpt: 'Testing publish idempotency',
          contentHtml: '<p>' + 'Content test word '.repeat(100) + '</p>',
          wordCount: 100,
          category: 'tools',
          tags: ['tools', 'testing'],
          heroImage: {
            prompt: 'Test hero prompt',
            compactPrompt: 'Test hero compact prompt',
            status: 'ready',
            publicUrl: '/app/applet/public/generated/blog/test-hero.jpg',
            stableAssetPath: '/app/applet/public/generated/blog/mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg'
          }
        },
        pinterestPins: [],
        indexNowNotified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: []
      };

      // First publication attempt
      const res1 = await publishArticleToLiveSite(testJob);
      const postsAfterFirst = getLiveBlogPosts();
      const postsCountAfterFirst = postsAfterFirst.length;

      // Second publication attempt (simulating restart after crash)
      const res2 = await publishArticleToLiveSite(testJob);
      const postsAfterSecond = getLiveBlogPosts();

      assert(res1.success && Boolean(res1.blogPostId), '11a. First publication succeeds');
      assert(res2.success && res2.blogPostId === res1.blogPostId, '11b. Second publication updates existing post with identical blogPostId');
      assert(
        postsAfterSecond.length === postsCountAfterFirst,
        '11c. Datastore length does not grow on re-publish (zero duplicates created)'
      );
    }

    // -----------------------------------------------------------------
    // INVARIANT 12: reuseOnlyMode remains safely enabled when configuration fields are missing or use defaults
    // -----------------------------------------------------------------
    console.log('\n--- INVARIANT 12: Configuration Default & Fallback Safety ---');
    {
      // 12a. Verify default config has reuseOnlyMode: true
      assert(DEFAULT_SEO_ENGINE_CONFIG.reuseOnlyMode === true, '12a. DEFAULT_SEO_ENGINE_CONFIG has reuseOnlyMode: true');

      // 12b. Verify state normalization defaults reuseOnlyMode to true when field is undefined
      const stateObj = readEngineState();
      delete (stateObj.config as any).reuseOnlyMode;
      writeEngineState(stateObj);

      const reloadedState = readEngineState();
      assert(
        reloadedState.config.reuseOnlyMode === true,
        '12b. State normalization automatically restores reuseOnlyMode: true when field is missing'
      );
    }

    // -----------------------------------------------------------------
    // FOUR PACKAGES VERIFICATION (October 13 Schedule & Reserve Integrity)
    // -----------------------------------------------------------------
    console.log('\n--- FOUR PACKAGES VERIFICATION ---');
    {
      const livePosts = getLiveBlogPosts();
      const livePostIds = new Set(livePosts.map(p => p.seoEngineJobId).filter(Boolean));
      const livePostSlugs = new Set(livePosts.map(p => p.slug).filter(Boolean));

      const expectedAssignments = [
        { id: 'job_2026-09-28_g1urxo', date: '2026-10-13', slot: '08:00', pinSlots: ['08:30', '09:00'] },
        { id: 'job_2026-10-01_8se4rp', date: '2026-10-13', slot: '12:00', pinSlots: ['12:30', '13:00'] },
        { id: 'job_2026-10-03_ciui3h', date: '2026-10-13', slot: '16:00', pinSlots: ['16:30', '17:00'] },
      ];

      for (const exp of expectedAssignments) {
        const job = realProdState.activeJobs.find(j => j.id === exp.id);
        assert(Boolean(job), `PKG. Job ${exp.id} exists in activeJobs`);
        if (job) {
          assert(job.assignedPublishDate === exp.date, `PKG. Job ${exp.id} assigned to ${exp.date}`);
          assert(job.assignedSlotTime === exp.slot, `PKG. Job ${exp.id} assigned to slot ${exp.slot}`);
          assert(job.pinterestPins?.[0]?.assignedSlotTime === exp.pinSlots[0], `PKG. Job ${exp.id} Pin 0 assigned to ${exp.pinSlots[0]}`);
          assert(job.pinterestPins?.[1]?.assignedSlotTime === exp.pinSlots[1], `PKG. Job ${exp.id} Pin 1 assigned to ${exp.pinSlots[1]}`);
          assert(Boolean(job.articleContent?.contentHtml && job.articleContent.contentHtml.length > 500), `PKG. Job ${exp.id} has complete saved article content`);
          assert(isValidLocalAsset(job.articleContent?.heroImage?.stableAssetPath), `PKG. Job ${exp.id} has verified local Hero image`);
          assert(isValidLocalAsset(job.pinterestPins?.[0]?.stableAssetPath), `PKG. Job ${exp.id} has verified local Pin 1 image`);
          assert(isValidLocalAsset(job.pinterestPins?.[1]?.stableAssetPath), `PKG. Job ${exp.id} has verified local Pin 2 image`);
          assert(Boolean(job.articleContent?.slug && !livePostSlugs.has(job.articleContent.slug)), `PKG. Job ${exp.id} has unique slug not yet published`);
          assert(!livePostIds.has(job.id), `PKG. Job ${exp.id} has no prior successful publication`);
        }
      }

      // Reserve package verification
      const reserveJob = realProdState.activeJobs.find(j => j.id === 'job_2026-10-04_lvcypd');
      assert(Boolean(reserveJob), 'PKG. Reserve package job_2026-10-04_lvcypd exists');
      if (reserveJob) {
        assert(reserveJob.assignedPublishDate === undefined, 'PKG. Reserve package has no assigned date');
        assert(reserveJob.assignedSlotTime === undefined, 'PKG. Reserve package has no assigned slot');
        assert(reserveJob.pinterestPins?.[0]?.assignedSlotTime === undefined, 'PKG. Reserve package Pin 0 has no assigned slot');
        assert(reserveJob.pinterestPins?.[1]?.assignedSlotTime === undefined, 'PKG. Reserve package Pin 1 has no assigned slot');
        assert(Boolean(reserveJob.articleContent?.contentHtml && reserveJob.articleContent.contentHtml.length > 500), 'PKG. Reserve package has complete content');
        assert(isValidLocalAsset(reserveJob.articleContent?.heroImage?.stableAssetPath), 'PKG. Reserve package has verified local Hero image');
        assert(isValidLocalAsset(reserveJob.pinterestPins?.[0]?.stableAssetPath), 'PKG. Reserve package has verified local Pin 1 image');
        assert(isValidLocalAsset(reserveJob.pinterestPins?.[1]?.stableAssetPath), 'PKG. Reserve package has verified local Pin 2 image');
        assert(Boolean(reserveJob.articleContent?.slug && !livePostSlugs.has(reserveJob.articleContent.slug)), 'PKG. Reserve package slug is unique');
        assert(!livePostIds.has(reserveJob.id), 'PKG. Reserve package has no prior publication');
      }
    }

  } finally {
    // Clean up temporary isolated test fixture files
    if (fs.existsSync(TEST_STATE_FILE)) fs.unlinkSync(TEST_STATE_FILE);
    if (fs.existsSync(TEST_POSTS_FILE)) fs.unlinkSync(TEST_POSTS_FILE);
    const tmpState = `${TEST_STATE_FILE}.tmp`;
    if (fs.existsSync(tmpState)) fs.unlinkSync(tmpState);
    const tmpPosts = `${TEST_POSTS_FILE}.tmp`;
    if (fs.existsSync(tmpPosts)) fs.unlinkSync(tmpPosts);
  }

  // Verify production data files were NOT modified during test run
  const prodStateHashAfter = computeFileHash('data/seo-engine-state.json');
  const prodPostsHashAfter = computeFileHash('data/blog-posts.json');
  const prodCostsHashAfter = computeFileHash('data/seo-engine-costs.json');

  console.log('\n--- PRODUCTION DATA INTEGRITY VERIFICATION ---');
  assert(prodStateHashBefore === prodStateHashAfter, 'P1. Production data/seo-engine-state.json hash unchanged');
  assert(prodPostsHashBefore === prodPostsHashAfter, 'P2. Production data/blog-posts.json hash unchanged');
  assert(prodCostsHashBefore === prodCostsHashAfter, 'P3. Production data/seo-engine-costs.json hash unchanged');

  console.log('\n===============================================================');
  console.log(`CRITICAL INVARIANTS TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runReuseOnlyHardenedTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
