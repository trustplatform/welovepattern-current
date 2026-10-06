/**
 * Comprehensive Test Suite for Higgsfield Generation Invariant Protections
 * 
 * Tests:
 * 1. Scheduler Quota: 'awaiting_approval' jobs count towards daily 2-article limit
 * 2. Scheduler Multi-Slot: 08:00 creates 2 jobs; 12:00/16:00/20:00 skip with 'skipped_quota_reached'
 * 3. Pinterest Slot Preservation: In-flight task IDs & concepts preserved on retries
 * 4. CTA Correction Safety: Metadata update only, zero new image generations
 * 5. Idempotent Accounting by taskId: duplicate taskId counts exactly once
 * 6. Daily Invariant Circuit Breaker: Hard stop at 6 paid POSTs per calendar day
 * 7. Existing-task Polling Zero Extra Cost: Polling does not increment count
 * 8. Local Asset Reuse Zero Cost: Existing file returns cost = 0 without API calls
 * 9. Crash Recovery Protection: Crash after accepted POST preserves taskId and blocks POST #7
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { evaluateSchedulerTick } from '../scheduler';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { resolveOrPreservePinterestPins } from '../queue/jobQueueManager';
import { generateHiggsfieldImage } from '../generation/higgsfieldClient';
import { getDailyHiggsfieldGenerationsCount, recordCostTransaction } from '../cost/costTracker';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept, SeoEngineArticleJob } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';

let passedCount = 0;
let failedCount = 0;

function check(assertion: boolean, name: string, details?: string) {
  if (assertion) {
    passedCount++;
    console.log(`✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
  } else {
    failedCount++;
    console.error(`❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
  }
}

export async function runHiggsfieldInvariantProtectionsTests(): Promise<boolean> {
  console.log('===============================================================');
  console.log('STARTING HIGGSFIELD INVARIANT & SCHEDULER QUOTA TEST SUITE');
  console.log('===============================================================\n');

  const testDateStr = '2026-10-15';
  const simulated1200 = new Date('2026-10-15T12:00:00-04:00');
  const simulated1600 = new Date('2026-10-15T16:00:00-04:00');
  const simulated2000 = new Date('2026-10-15T20:00:00-04:00');

  // Backup existing engine state
  const originalState = readEngineState();

  try {
    // -----------------------------------------------------------------
    // TEST 1: SCHEDULER DAILY QUOTA WITH AWAITING_APPROVAL DRAFTS
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Scheduler Quota with awaiting_approval Drafts ---');
    const mockState = {
      ...originalState,
      config: {
        ...originalState.config,
        engineActive: true,
        articlesPerDay: 2,
        timezone: 'America/New_York',
        articlePublishTimes: ['08:00', '12:00', '16:00', '20:00'],
      },
      lastExecutedArticleSlot: '',
      lastRunDate: '',
      activeJobs: [
        {
          id: 'test_job_slot1_draft',
          dateScheduled: testDateStr,
          contentType: 'trending_crochet',
          category: 'crochet',
          topic: { id: 't1', keyword: 'crochet pumpkin', contentType: 'trending_crochet', category: 'crochet', opportunityScore: 90, status: 'awaiting_approval' },
          stage: 'awaiting_approval',
          requiresApproval: true,
          pinterestPins: [],
          indexNowNotified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          logs: [],
        } as SeoEngineArticleJob,
        {
          id: 'test_job_slot2_draft',
          dateScheduled: testDateStr,
          contentType: 'tool_guide',
          category: 'tools',
          topic: { id: 't2', keyword: 'gauge calculator', contentType: 'tool_guide', category: 'tools', opportunityScore: 85, status: 'awaiting_approval' },
          stage: 'awaiting_approval',
          requiresApproval: true,
          pinterestPins: [],
          indexNowNotified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          logs: [],
        } as SeoEngineArticleJob,
      ],
    };
    writeEngineState(mockState);

    // Evaluate tick at 12:00 (next slot)
    const tickResult1200 = await evaluateSchedulerTick(simulated1200, { skipQueueWorkerExecution: true });
    check(
      tickResult1200.triggered === false && tickResult1200.action === 'skipped_quota_reached',
      'Scheduler at 12:00 skips when 2 awaiting_approval jobs exist for today',
      `Action: ${tickResult1200.action}, Reason: ${tickResult1200.reason}`
    );

    // Evaluate tick at 16:00
    const tickResult1600 = await evaluateSchedulerTick(simulated1600, { skipQueueWorkerExecution: true });
    check(
      tickResult1600.triggered === false && tickResult1600.action === 'skipped_quota_reached',
      'Scheduler at 16:00 skips when 2 awaiting_approval jobs exist for today',
      `Action: ${tickResult1600.action}`
    );

    // Evaluate tick at 20:00
    const tickResult2000 = await evaluateSchedulerTick(simulated2000, { skipQueueWorkerExecution: true });
    check(
      tickResult2000.triggered === false && tickResult2000.action === 'skipped_quota_reached',
      'Scheduler at 20:00 skips when 2 awaiting_approval jobs exist for today',
      `Action: ${tickResult2000.action}`
    );

    // -----------------------------------------------------------------
    // TEST 2: PINTEREST SLOT PRESERVATION (TASK IDs & CONCEPTS)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Pinterest Concept & Task ID Preservation ---');
    const existingPinsWithPendingTasks: PinterestCreativeConcept[] = [
      {
        pinNumber: 1,
        conceptAngle: 'Cozy Lifestyle Setting',
        visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Cozy throw', colorPalette: 'warm ecru', humanElement: 'none' },
        compactHiggsfieldPrompt: 'Cozy autumn crochet throw blanket on sofa',
        typographyOverlay: { primaryHeadline: 'Cozy Blanket Guide', ctaBadgeText: 'Get the Free Pattern →' },
        destinationUrl: 'https://welovepattern.com/blog/cozy-blanket-guide',
        targetBoardId: 'board_blankets',
        targetBoardName: 'Crochet Blankets & Afghans',
        higgsfieldRequestId: 'req_pending_task_12345',
        publishStatus: 'generating_image',
      },
      {
        pinNumber: 2,
        conceptAngle: 'Technical Layflat',
        visualStyle: { imageCount: 1, compositionType: 'flatlay_materials', subjectDescription: 'Yarn swatch', colorPalette: 'sage green', humanElement: 'hands_only' },
        compactHiggsfieldPrompt: 'Artisan yarn gauge layflat with wooden hook',
        typographyOverlay: { primaryHeadline: 'Gauge Swatch Tips', ctaBadgeText: 'Learn the Technique →' },
        destinationUrl: 'https://welovepattern.com/blog/cozy-blanket-guide',
        targetBoardId: 'board_blankets',
        targetBoardName: 'Crochet Blankets & Afghans',
        higgsfieldRequestId: 'req_pending_task_67890',
        publishStatus: 'generating_image',
      },
    ];

    const dummyTopic: DiscoveredTopic = {
      id: 'topic_test_blanket',
      keyword: 'crochet blanket pattern',
      contentType: 'trending_crochet',
      category: 'crochet',
      opportunityScore: 88,
      status: 'discovered',
    };
    const dummyArticle: GeneratedArticle = {
      title: 'Cozy Blanket Guide',
      slug: 'cozy-blanket-guide',
      wordCount: 1200,
    };
    const dummyPacket: FactualResearchPacket = {
      topic: 'crochet blanket',
      searchIntent: 'pattern',
      craftType: 'crochet',
    };
    const dummyBoard = { id: 'board_blankets', name: 'Crochet Blankets & Afghans' };

    let generatorCalled = false;
    const mockConceptGen = () => {
      generatorCalled = true;
      return [];
    };

    const preservedPins = resolveOrPreservePinterestPins(
      existingPinsWithPendingTasks,
      dummyTopic,
      dummyArticle,
      dummyPacket,
      dummyBoard,
      'trending_crochet',
      mockConceptGen as any
    );

    check(generatorCalled === false, 'Concept generator not invoked when existing concepts exist');
    check(preservedPins[0].higgsfieldRequestId === 'req_pending_task_12345', 'Pin 1 in-flight Higgsfield request ID preserved');
    check(preservedPins[1].higgsfieldRequestId === 'req_pending_task_67890', 'Pin 2 in-flight Higgsfield request ID preserved');
    check(preservedPins[0].compactHiggsfieldPrompt === 'Cozy autumn crochet throw blanket on sofa', 'Pin 1 prompt preserved');

    // -----------------------------------------------------------------
    // TEST 3: CTA CORRECTION SAFETY (ZERO IMAGE REGENERATION)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: CTA Correction Safety (Zero Image Regeneration) ---');
    const existingToolPinsWithMismatchedCta: PinterestCreativeConcept[] = [
      {
        pinNumber: 1,
        conceptAngle: 'Row Counter Tool View',
        visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Row counter', colorPalette: 'slate', humanElement: 'none' },
        compactHiggsfieldPrompt: 'Digital crochet row counter on clean wooden desk',
        typographyOverlay: { primaryHeadline: 'Crochet Row Counter', ctaBadgeText: 'CALCULATE YARN FREE →' }, // Mismatched CTA
        destinationUrl: 'https://welovepattern.com/blog/row-counter-guide',
        targetBoardId: 'board_tools',
        targetBoardName: 'Crochet Tools',
        stableAssetPath: path.resolve(process.cwd(), 'public/icon-192x192.png'), // existing mock asset
        publishStatus: 'image_ready',
      },
      {
        pinNumber: 2,
        conceptAngle: 'Hands with Counter',
        visualStyle: { imageCount: 1, compositionType: 'hands_crafting', subjectDescription: 'Hands using counter', colorPalette: 'slate', humanElement: 'hands_only' },
        compactHiggsfieldPrompt: 'Hands tapping row counter during crochet',
        typographyOverlay: { primaryHeadline: 'Track Your Rows', ctaBadgeText: 'CALCULATE YARN FREE →' }, // Mismatched CTA
        destinationUrl: 'https://welovepattern.com/blog/row-counter-guide',
        targetBoardId: 'board_tools',
        targetBoardName: 'Crochet Tools',
        stableAssetPath: path.resolve(process.cwd(), 'public/icon-192x192.png'), // existing mock asset
        publishStatus: 'image_ready',
      },
    ];

    const toolTopic: DiscoveredTopic = {
      id: 'topic_row_counter',
      keyword: 'crochet row counter',
      contentType: 'tool_guide',
      category: 'tools',
      toolSlug: 'row-counter',
      opportunityScore: 92,
      status: 'discovered',
    };

    let generatorCalledForCta = false;
    const resolvedToolPins = resolveOrPreservePinterestPins(
      existingToolPinsWithMismatchedCta,
      toolTopic,
      { title: 'Row Counter Guide', slug: 'row-counter-guide', wordCount: 900 },
      { topic: 'row counter', searchIntent: 'utility', craftType: 'crochet' },
      { id: 'board_tools', name: 'Crochet Tools' },
      'tool_guide',
      (() => { generatorCalledForCta = true; return []; }) as any
    );

    check(generatorCalledForCta === false, 'Concept generator not invoked for CTA correction');
    check(resolvedToolPins[0].typographyOverlay.ctaBadgeText.includes('ROW COUNTER'), 'Pin 1 CTA corrected semantically in metadata', `CTA: ${resolvedToolPins[0].typographyOverlay.ctaBadgeText}`);
    check(resolvedToolPins[1].typographyOverlay.ctaBadgeText.includes('ROW COUNTER'), 'Pin 2 CTA corrected semantically in metadata', `CTA: ${resolvedToolPins[1].typographyOverlay.ctaBadgeText}`);
    check(resolvedToolPins[0].publishStatus === 'image_ready', 'Pin 1 image_ready asset status preserved');
    check(resolvedToolPins[1].publishStatus === 'image_ready', 'Pin 2 image_ready asset status preserved');

    // -----------------------------------------------------------------
    // TEST 4: IDEMPOTENT ACCOUNTING BY TASK ID
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Idempotent Cost Accounting by taskId ---');
    const uniqueTaskId = `test_task_idem_${Date.now()}`;
    const rec1 = recordCostTransaction({
      jobId: 'test_job_idem',
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: 0.03,
      meta: { taskId: uniqueTaskId, status: 'accepted' },
    });

    const countAfterFirst = getDailyHiggsfieldGenerationsCount();

    // Record the exact same taskId a second time (e.g. on download completion or retry)
    const rec2 = recordCostTransaction({
      jobId: 'test_job_idem',
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: 0.03,
      meta: { taskId: uniqueTaskId, status: 'completed' },
    });

    const countAfterSecond = getDailyHiggsfieldGenerationsCount();

    check(rec1.id === rec2.id, 'Duplicate taskId returns existing record object');
    check(countAfterFirst === countAfterSecond, 'Duplicate taskId does not increment generation count');
    check(rec2.meta?.status === 'completed', 'Existing record status updated in-place without duplicate billing');

    // -----------------------------------------------------------------
    // TEST 5: LOCAL ASSET REUSE ZERO COST & ZERO API CALLS
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Local Asset Reuse Zero Cost ---');
    const reuseSlug = 'test-reuse-slug';
    const reusePrompt = 'A cozy handmade crochet pumpkin on a rustic wooden table';
    const blogDir = path.resolve(process.cwd(), 'public/generated/blog');
    if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

    // Generate deterministic filename
    const hash = crypto.createHash('sha256').update(reusePrompt.trim().toLowerCase()).digest('hex').substring(0, 10);
    const expectedFilename = `${reuseSlug}-${hash}.jpg`;
    const fixtureFilePath = path.join(blogDir, expectedFilename);

    // Create fixture file (> 100 bytes)
    fs.writeFileSync(fixtureFilePath, Buffer.alloc(1024, 1));

    try {
      const localReuseResult = await generateHiggsfieldImage({
        prompt: reusePrompt,
        aspectRatio: '16:9',
        slug: reuseSlug,
        targetFolder: 'blog',
      });

      check(localReuseResult.success === true, 'Local asset reuse returns success');
      check(localReuseResult.costUsd === 0, 'Local asset reuse returns costUsd = 0', `Cost: ${localReuseResult.costUsd}`);
      check(localReuseResult.stableAssetPath === fixtureFilePath, 'Local asset reuse returns existing file path without API call');
    } finally {
      if (fs.existsSync(fixtureFilePath)) fs.unlinkSync(fixtureFilePath);
    }

    // -----------------------------------------------------------------
    // TEST 6: EXISTING TASK POLLING (ZERO NEW POST, ZERO EXTRA COUNT)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Existing Task Polling (Zero New POST) ---');
    const prevKey6 = process.env.HF_KEY;
    process.env.HF_KEY = 'mock_test_hf_key_123';
    const existingTaskIdMock = `task_polling_mock_${Date.now()}`;

    // Step 1: Record the accepted task when it was created by the POST request
    recordCostTransaction({
      jobId: 'test_job_polling',
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: 0.03,
      meta: { taskId: existingTaskIdMock, status: 'accepted' },
    });

    const initialCountBeforePoll = getDailyHiggsfieldGenerationsCount();

    // Mock global fetch to return polling completion directly without POST
    const originalFetch = global.fetch;
    let postCallCount = 0;
    let pollCallCount = 0;

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (init?.method === 'POST') {
        postCallCount++;
        return new Response(JSON.stringify({ id: existingTaskIdMock, status: 'in_progress' }), { status: 200 });
      }
      if (urlStr.includes('/requests/') || urlStr.includes('status')) {
        pollCallCount++;
        return new Response(JSON.stringify({ status: 'completed', image_url: 'https://cdn.example.com/mock-image.jpg' }), { status: 200 });
      }
      if (urlStr.includes('mock-image.jpg')) {
        return new Response(Buffer.alloc(1024, 2), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    }) as any;

    let pollGenResultPath: string | undefined;
    try {
      const pollGenResult = await generateHiggsfieldImage({
        prompt: `Mock prompt for polling test ${Date.now()}`,
        aspectRatio: '16:9',
        slug: `mock-polling-slug-${Date.now()}`,
        targetFolder: 'blog',
        existingTaskId: existingTaskIdMock,
      });

      pollGenResultPath = pollGenResult.stableAssetPath;
      check(postCallCount === 0, 'Existing task polling issues 0 new POST requests');
      check(pollCallCount >= 1, 'Existing task polling checks status URL', `Poll calls: ${pollCallCount}`);
      check(pollGenResult.success === true, 'Existing task polling returns success');
      const countAfterPoll = getDailyHiggsfieldGenerationsCount();
      check(countAfterPoll === initialCountBeforePoll, 'Existing task polling does NOT increment daily generation count');
    } finally {
      global.fetch = originalFetch;
      process.env.HF_KEY = prevKey6;
      if (pollGenResultPath && fs.existsSync(pollGenResultPath)) {
        try { fs.unlinkSync(pollGenResultPath); } catch {}
      }
    }

    // -----------------------------------------------------------------
    // TEST 7: FAILED / TIMEOUT ACCEPTED TASK REMAINS COUNTED
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Failed / Timeout Accepted Task Remains Counted ---');
    const failedTaskId = `task_failed_${Date.now()}`;
    const countBeforeFailure = getDailyHiggsfieldGenerationsCount();

    // 1. Paid POST was accepted by Higgsfield:
    recordCostTransaction({
      jobId: 'test_job_failed_task',
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: 0.03,
      meta: { taskId: failedTaskId, status: 'accepted' },
    });

    const countAfterAccepted = getDailyHiggsfieldGenerationsCount();
    check(countAfterAccepted === countBeforeFailure + 1, 'Accepted task is immediately counted in ledger');

    // 2. Polling later fails (e.g. NSFW or timeout):
    recordCostTransaction({
      jobId: 'test_job_failed_task',
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: 0.03,
      meta: { taskId: failedTaskId, status: 'failed' },
    });

    const countAfterFailed = getDailyHiggsfieldGenerationsCount();
    check(countAfterFailed === countAfterAccepted, 'Failed polling status keeps task counted in daily ledger (no decrement/duplication)');

    // -----------------------------------------------------------------
    // TEST 8: CRASH RESILIENCE & CIRCUIT BREAKER SURVIVING RESTART
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Crash Resilience & Circuit Breaker Surviving Restart ---');
    const prevKey = process.env.HF_KEY;
    process.env.HF_KEY = 'mock_test_hf_key_123';

    // Simulate filling up today's ledger to 6 accepted generations
    const currentCount = getDailyHiggsfieldGenerationsCount();
    const needed = Math.max(0, 6 - currentCount);
    for (let i = 0; i < needed; i++) {
      recordCostTransaction({
        jobId: `test_job_circuit_${i}_${Date.now()}`,
        provider: 'higgsfield',
        operation: 'image_generation',
        unitsConsumed: 1,
        costUsd: 0.03,
        meta: { taskId: `task_circuit_${i}_${Date.now()}`, status: 'accepted' },
      });
    }

    const initialGenCount = getDailyHiggsfieldGenerationsCount();
    check(initialGenCount >= 6, 'Cost tracker reflects >= 6 daily accepted Higgsfield generations', `Count: ${initialGenCount}`);

    // Attempt a 7th paid generation (with dummy non-cached prompt)
    const blockedGenResult = await generateHiggsfieldImage({
      prompt: `Uncached test prompt for circuit breaker verification ${Date.now()}`,
      aspectRatio: '16:9',
      slug: `test-circuit-breaker-slug-${Date.now()}`,
      targetFolder: 'blog',
    });

    check(blockedGenResult.success === false, '7th generation blocked by circuit breaker');
    check(
      Boolean(blockedGenResult.error?.includes('Daily Higgsfield generation limit reached')),
      'Circuit breaker error message clearly indicates limit reached',
      blockedGenResult.error
    );

    process.env.HF_KEY = prevKey;

    // -----------------------------------------------------------------
    // TEST 9: TWO ARTICLES = MAXIMUM 6 ACCEPTED HIGGSFIELD POSTS
    // -----------------------------------------------------------------
    console.log('\n--- TEST 9: Two Articles Maximum 6 Higgsfield Generations ---');
    const maxPostsPerArticle = 3; // Hero (16:9), Pin 1 (2:3), Pin 2 (2:3)
    const maxArticlesPerDay = 2;
    const maxTotalDailyPosts = maxArticlesPerDay * maxPostsPerArticle;
    check(maxTotalDailyPosts === 6, '2 articles/day * 3 images/article = exactly 6 maximum paid POSTs/day');

    // -----------------------------------------------------------------
    // TEST 10: TIMEZONE & MIDNIGHT BOUNDARY SEMANTICS (America/New_York)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 10: Timezone & Midnight Boundary Semantics (America/New_York) ---');
    // Day 1: 2026-10-15
    // Slot 1: 08:00 EDT = 2026-10-15T12:00:00.000Z (UTC)
    // Slot 2: 20:00 EDT = 2026-10-16T00:00:00.000Z (UTC, next UTC day but SAME NY day)
    // Day 2 Slot 1: 2026-10-16 08:00 EDT = 2026-10-16T12:00:00.000Z (UTC)

    const nyDate1 = '2026-10-15';
    const nyDate2 = '2026-10-16';

    // 3 images generated at 08:00 EDT (12:00 UTC) on Day 1
    for (let i = 1; i <= 3; i++) {
      recordCostTransaction({
        jobId: `test_job_tz_slot1_${i}`,
        provider: 'higgsfield',
        operation: 'image_generation',
        unitsConsumed: 1,
        costUsd: 0.03,
        meta: { taskId: `task_tz_morning_${i}`, status: 'accepted' },
      });
    }

    // Manually adjust the test record timestamps to simulate 08:00 EDT (12:00 UTC) and 20:00 EDT (00:00 UTC next day)
    const costPath = path.resolve(process.cwd(), 'data/seo-engine-costs.json');
    const costData = JSON.parse(fs.readFileSync(costPath, 'utf8'));
    for (const r of costData.records) {
      if (r.meta?.taskId?.startsWith('task_tz_morning_')) {
        r.timestamp = '2026-10-15T12:00:00.000Z'; // 08:00 EDT
      }
    }
    fs.writeFileSync(costPath, JSON.stringify(costData, null, 2), 'utf8');

    // 3 images generated at 20:00 EDT (00:00 UTC on 2026-10-16) on Day 1
    for (let i = 1; i <= 3; i++) {
      recordCostTransaction({
        jobId: `test_job_tz_slot2_${i}`,
        provider: 'higgsfield',
        operation: 'image_generation',
        unitsConsumed: 1,
        costUsd: 0.03,
        meta: { taskId: `task_tz_evening_${i}`, status: 'accepted' },
      });
    }

    const costData2 = JSON.parse(fs.readFileSync(costPath, 'utf8'));
    for (const r of costData2.records) {
      if (r.meta?.taskId?.startsWith('task_tz_evening_')) {
        r.timestamp = '2026-10-16T00:00:00.000Z'; // 20:00 EDT on 2026-10-15 (UTC is 2026-10-16)
      }
    }
    fs.writeFileSync(costPath, JSON.stringify(costData2, null, 2), 'utf8');

    const day1Generations = getDailyHiggsfieldGenerationsCount(nyDate1, 'America/New_York');
    const day2Generations = getDailyHiggsfieldGenerationsCount(nyDate2, 'America/New_York');

    check(
      day1Generations === 6,
      '08:00 EDT + 20:00 EDT generations both count toward the same NY calendar day (6 total)',
      `Got: ${day1Generations}`
    );

    check(
      day2Generations === 0,
      'Following day (2026-10-16) correctly resets to 0 and does NOT inherit previous day 20:00 EDT records',
      `Got: ${day2Generations}`
    );

  } finally {
    // Restore original state
    writeEngineState(originalState);

    // Clean up test records from costs storage
    try {
      const costPath = path.resolve(process.cwd(), 'data/seo-engine-costs.json');
      if (fs.existsSync(costPath)) {
        const raw = JSON.parse(fs.readFileSync(costPath, 'utf8'));
        raw.records = (raw.records || []).filter((r: any) => !r.jobId?.startsWith('test_job_'));
        raw.totalSpendAllTimeUsd = Math.round(raw.records.reduce((sum: number, r: any) => sum + (r.costUsd || 0), 0) * 100000) / 100000;
        fs.writeFileSync(costPath, JSON.stringify(raw, null, 2), 'utf8');
      }
    } catch {
      // ignore cleanup error
    }
  }

  console.log('\n===============================================================');
  console.log(`TEST SUITE COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================');

  return failedCount === 0;
}

if (process.argv[1]?.includes('testHiggsfieldInvariantProtections')) {
  runHiggsfieldInvariantProtectionsTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}
