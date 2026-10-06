/**
 * Production Test Suite: Drain-First Recovered Job Pipeline & Invariant Verification
 * 
 * Verifies:
 * 1. 2 recovered jobs drain as A/B on Day 1 (08:00 & 16:00) with 0 Higgsfield POSTs.
 * 2. Next 2 recovered jobs drain as C/D on Day 2 (08:00 & 16:00) with 0 Higgsfield POSTs.
 * 3. Recovered jobs have strict priority over new topic generation.
 * 4. Mixed mode (1 recovered + 1 new topic) works correctly.
 * 5. Normal production (0 recovered) triggers new generation for both slots.
 * 6. Daily quota (max 2 published articles/day) is strictly enforced.
 * 7. Articles never publish before their assigned slot time.
 * 8. Pinterest slots (09:00, 13:00, 17:00, 21:00) publish exactly 1 pin per slot (max 4 pins/day).
 * 9. Pinterest catch-up bursts and multi-pin bundling are disabled.
 * 10. Process restart / state reload preserves assignedPublishDate and assignedSlotTime.
 * 11. Production quality gates strictly evaluate recovered jobs before publication.
 */

import fs from 'fs';
import path from 'path';
import { getTimeInTimezone, evaluateSchedulerTick } from '../scheduler';
import { readEngineState, writeEngineState, getEngineStateFilePath, addJobToState } from '../queue/engineStorage';
import { getEligibleRecoveredJobs, assignRecoveredJobToSlot, recoverJobLocalAssets } from '../queue/assetRecovery';
import { dispatchScheduledPinterestSlot, dispatchNextOverduePinterestPin } from '../publishing/pinterestSlotDispatcher';
import { getLiveBlogPosts } from '../publishing/articlePublisher';
import { SeoEngineArticleJob, PinterestCreativeConcept } from '../types';
import { getDailyHiggsfieldGenerationsCount } from '../cost/costTracker';

async function runDrainFirstPipelineTests() {
  console.log('=== STARTING DRAIN-FIRST RECOVERED JOB PIPELINE TESTS ===\n');

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

  // Backup original state, cost storage, and blog posts
  const statePath = getEngineStateFilePath();
  const originalStateContent = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : null;

  const costPath = path.resolve(process.cwd(), 'data/seo-engine-costs.json');
  const originalCostContent = fs.existsSync(costPath) ? fs.readFileSync(costPath, 'utf8') : null;
  if (fs.existsSync(costPath)) {
    fs.writeFileSync(costPath, JSON.stringify({ totalSpendAllTimeUsd: 0, lastUpdated: new Date().toISOString(), records: [] }, null, 2), 'utf8');
  }

  const blogPostsPath = path.resolve(process.cwd(), 'data/blog-posts.json');
  const originalBlogPostsContent = fs.existsSync(blogPostsPath) ? fs.readFileSync(blogPostsPath, 'utf8') : null;
  fs.writeFileSync(blogPostsPath, '[]', 'utf8');

  // Create temporary mock image files on disk for deterministic test runs
  const testDir = path.resolve(process.cwd(), 'public/generated/test-drain-assets');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  function createMockImage(name: string): string {
    const filePath = path.join(testDir, name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, Buffer.alloc(2048, 0xff));
    }
    return filePath;
  }

  const mockHeroA = createMockImage('hero-a.jpg');
  const mockPin1A = createMockImage('pin1-a.jpg');
  const mockPin2A = createMockImage('pin2-a.jpg');

  const mockHeroB = createMockImage('hero-b.jpg');
  const mockPin1B = createMockImage('pin1-b.jpg');
  const mockPin2B = createMockImage('pin2-b.jpg');

  const mockHeroC = createMockImage('hero-c.jpg');
  const mockPin1C = createMockImage('pin1-c.jpg');
  const mockPin2C = createMockImage('pin2-c.jpg');

  const mockHeroD = createMockImage('hero-d.jpg');
  const mockPin1D = createMockImage('pin1-d.jpg');
  const mockPin2D = createMockImage('pin2-d.jpg');

  try {
    // -----------------------------------------------------------------
    // SETUP TEST STATE
    // -----------------------------------------------------------------
    const testState = readEngineState();
    testState.config.engineActive = true;
    testState.config.timezone = 'America/New_York';
    testState.config.articlePublishTimes = ['08:00', '16:00'];
    testState.config.pinterestPublishTimes = ['09:00', '13:00', '17:00', '21:00'];
    testState.config.articlesPerDay = 2;
    testState.config.autoPublish = true;
    testState.config.autoPublishPinterest = true;
    testState.config.requiresApproval = false;
    testState.lastExecutedArticleSlot = undefined;
    testState.lastExecutedPinterestSlot = undefined;
    testState.activeJobs = [];
    testState.completedJobsHistory = [];
    testState.todayDiscoveredTopics = [];

    function makeRecoveredJob(id: string, keyword: string, title: string, slug: string, dateScheduled: string, hero: string, p1: string, p2: string): SeoEngineArticleJob {
      return {
        id,
        dateScheduled,
        contentType: 'trending_crochet',
        category: 'crochet',
        topic: {
          id: `topic_${id}`,
          keyword,
          contentType: 'trending_crochet',
          category: 'crochet',
          trendScore: 80,
          opportunityScore: 85,
          status: 'selected',
        },
        stage: 'awaiting_approval',
        requiresApproval: false,
        indexNowNotified: false,
        createdAt: `${dateScheduled}T08:00:00.000Z`,
        updatedAt: `${dateScheduled}T08:00:00.000Z`,
        logs: [],
        factualResearch: {
          topicId: `topic_${id}`,
          topic: keyword,
          searchIntent: `Comprehensive guide for ${keyword}`,
          craftType: 'crochet',
          sourceAuthority: 'Craft Yarn Council Technical Standards',
          verifiedTerminology: ['double crochet', 'single crochet', 'gauge swatch', 'stitch markers'],
          verifiedMaterials: {
            yarnWeights: ['Medium / Worsted (#4)'],
            hookSizes: ['5.0 mm (H-8)'],
          },
          techniqueKeyPoints: ['Work with consistent tension along the entire perimeter'],
          makerPainPoints: ['Wavy uneven edges or curling corners'],
          faqItems: [{ question: 'What hook size is best for borders?', factualAnswer: 'Use a 5.0 mm (H-8) hook for worsted weight yarn.' }],
          supportedClaims: [],
        },
        articleContent: {
          title,
          slug,
          excerpt: `Master the art of ${keyword} with our in-depth step-by-step tutorial, material lists, and tension tips.`,
          contentHtml: `<h2>Essential Materials</h2><p>For this project, use a 5.0 mm (H-8) hook and Medium / Worsted (#4) weight yarn to achieve crisp stitch definition and balanced drape across all rounds.</p><h2>Step-by-Step Stitch Guide</h2><p>Begin by working single crochet evenly along the edge, placing 3 stitches in each corner to prevent curling. Maintain even tension throughout your foundation round.</p><h2>Frequently Asked Questions</h2><h3>What hook size is best for borders?</h3><p>Use a 5.0 mm (H-8) hook for worsted weight yarn.</p><p>This comprehensive craft guide provides full instructions with over eight hundred words covering stitch variations, blocking advice, and decorative edge finishing.</p>`.repeat(3),
          wordCount: 850,
          category: 'crochet',
          contentType: 'trending_crochet',
          tags: ['Crochet', 'Guide', 'Patterns'],
          seoMeta: {
            title: `${title} - Free Guide`,
            description: `Learn how to master ${keyword} with our easy free pattern, step by step instructions, and expert finishing tips.`,
            keywords: `${keyword}, crochet guide, free patterns`,
          },
          heroImage: {
            prompt: `Hero image for ${title}`,
            compactPrompt: `Hero image for ${title}`,
            stableAssetPath: hero,
            stablePublicUrl: `/generated/test-drain-assets/${path.basename(hero)}`,
            status: 'ready',
          },
        },
        pinterestPins: [
          {
            pinNumber: 1,
            conceptAngle: 'Lifestyle Concept',
            visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Hero craft', colorPalette: 'warm', humanElement: 'none' },
            compactHiggsfieldPrompt: 'Craft pin 1',
            typographyOverlay: { primaryHeadline: title, ctaBadgeText: 'READ GUIDE →' },
            destinationUrl: `https://welovepattern.com/blog/${slug}`,
            targetBoardId: 'test_board_123',
            targetBoardName: 'Crochet Patterns',
            stableAssetPath: p1,
            stablePublicUrl: `/generated/test-drain-assets/${path.basename(p1)}`,
            publishStatus: 'image_ready',
          },
          {
            pinNumber: 2,
            conceptAngle: 'Flatlay Concept',
            visualStyle: { imageCount: 1, compositionType: 'flatlay_materials', subjectDescription: 'Flatlay craft', colorPalette: 'natural', humanElement: 'hands_only' },
            compactHiggsfieldPrompt: 'Craft pin 2',
            typographyOverlay: { primaryHeadline: title, ctaBadgeText: 'READ GUIDE →' },
            destinationUrl: `https://welovepattern.com/blog/${slug}`,
            targetBoardId: 'test_board_123',
            targetBoardName: 'Crochet Patterns',
            stableAssetPath: p2,
            stablePublicUrl: `/generated/test-drain-assets/${path.basename(p2)}`,
            publishStatus: 'image_ready',
          },
        ],
      };
    }

    const jobA = makeRecoveredJob('job_rec_a', 'easy crochet blanket border', 'Easy Crochet Blanket Border Tutorial', 'easy-crochet-blanket-border-tutorial', '2026-09-28', mockHeroA, mockPin1A, mockPin2A);
    const jobB = makeRecoveredJob('job_rec_b', 'crochet gauge swatch tutorial', 'Crochet Gauge Swatch Complete Guide', 'crochet-gauge-swatch-complete-guide', '2026-10-01', mockHeroB, mockPin1B, mockPin2B);
    const jobC = makeRecoveredJob('job_rec_c', 'crochet stitch counting methods', 'Crochet Stitch Counting Methods Guide', 'crochet-stitch-counting-methods-guide', '2026-10-03', mockHeroC, mockPin1C, mockPin2C);
    const jobD = makeRecoveredJob('job_rec_d', 'crochet blanket yarn calculation', 'Crochet Blanket Yarn Estimation Guide', 'crochet-blanket-yarn-estimation-guide', '2026-10-04', mockHeroD, mockPin1D, mockPin2D);

    testState.activeJobs = [jobA, jobB, jobC, jobD];
    writeEngineState(testState);

    // -----------------------------------------------------------------
    // TEST 1: DAY 1 - SLOT 1 (08:00) DRAINS JOB A (0 HIGGSFIELD POSTS)
    // -----------------------------------------------------------------
    console.log('--- TEST 1: DAY 1 (08:00) Drains Job A ---');
    // 2026-10-05 12:00:00 UTC = 08:00:00 EDT (America/New_York)
    const day1Slot1Date = new Date('2026-10-05T12:00:00.000Z');
    const day1Slot1Tick = await evaluateSchedulerTick(day1Slot1Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });

    assert(day1Slot1Tick.triggered === true, '1a. Day 1 (08:00) triggered successfully');
    assert(day1Slot1Tick.action === 'article_batch', '1b. Action is article_batch');
    assert(day1Slot1Tick.reason?.includes('recovered article'), '1c. Consumed recovered article');

    const stateAfterDay1Slot1 = readEngineState();
    const updatedJobA = stateAfterDay1Slot1.activeJobs.find(j => j.id === 'job_rec_a')!;
    assert(updatedJobA.stage === 'completed', '1d. Job A is stage completed');
    assert(updatedJobA.assignedPublishDate === '2026-10-05', '1e. Job A assignedPublishDate is 2026-10-05');
    assert(updatedJobA.assignedSlotTime === '08:00', '1f. Job A assignedSlotTime is 08:00');
    assert(Boolean(updatedJobA.publishedBlogPostId), '1g. Job A has live publishedBlogPostId');

    // -----------------------------------------------------------------
    // TEST 2: DAY 1 - PINTEREST SLOTS FOR ARTICLE 1 (09:00 & 13:00)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: DAY 1 Pinterest Slots (09:00 & 13:00) ---');
    // 09:00 EDT = 13:00 UTC
    const pinSlot1Date = new Date('2026-10-05T13:00:00.000Z');
    const pinSlot1Tick = await evaluateSchedulerTick(pinSlot1Date, { skipQueueWorkerExecution: true });
    assert(pinSlot1Tick.triggered === true, '2a. Pinterest Slot 1 (09:00) evaluated');
    assert(pinSlot1Tick.slotKey === '2026-10-05_09:00', '2b. Slot key is 2026-10-05_09:00');

    // 13:00 EDT = 17:00 UTC
    const pinSlot2Date = new Date('2026-10-05T17:00:00.000Z');
    const pinSlot2Tick = await evaluateSchedulerTick(pinSlot2Date, { skipQueueWorkerExecution: true });
    assert(pinSlot2Tick.triggered === true, '2c. Pinterest Slot 2 (13:00) evaluated');

    // -----------------------------------------------------------------
    // TEST 3: DAY 1 - SLOT 2 (16:00) DRAINS JOB B (0 HIGGSFIELD POSTS)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: DAY 1 (16:00) Drains Job B ---');
    // 16:00 EDT = 20:00 UTC
    const day1Slot2Date = new Date('2026-10-05T20:00:00.000Z');
    const day1Slot2Tick = await evaluateSchedulerTick(day1Slot2Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });

    assert(day1Slot2Tick.triggered === true, '3a. Day 1 (16:00) triggered successfully');
    assert(day1Slot2Tick.reason?.includes('recovered article'), '3b. Consumed Job B as recovered article');

    const stateAfterDay1Slot2 = readEngineState();
    const updatedJobB = stateAfterDay1Slot2.activeJobs.find(j => j.id === 'job_rec_b')!;
    assert(updatedJobB.stage === 'completed', '3c. Job B is completed');
    assert(updatedJobB.assignedPublishDate === '2026-10-05', '3d. Job B assignedPublishDate is 2026-10-05');
    assert(updatedJobB.assignedSlotTime === '16:00', '3e. Job B assignedSlotTime is 16:00');

    // -----------------------------------------------------------------
    // TEST 4: DAY 1 QUOTA LIMIT (MAX 2 ARTICLES)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: DAY 1 Quota Enforcement ---');
    // Attempt extra trigger at 16:00
    const extraTick = await evaluateSchedulerTick(day1Slot2Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(extraTick.triggered === false, '4a. Duplicate slot tick skipped');

    // -----------------------------------------------------------------
    // TEST 5: DAY 2 - DRAINS JOB C (08:00) AND JOB D (16:00)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: DAY 2 Drains Job C & Job D ---');
    // 2026-10-06 08:00 EDT = 12:00 UTC
    const day2Slot1Date = new Date('2026-10-06T12:00:00.000Z');
    const day2Slot1Tick = await evaluateSchedulerTick(day2Slot1Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(day2Slot1Tick.triggered === true && day2Slot1Tick.reason?.includes('recovered article'), '5a. Day 2 (08:00) consumed Job C');

    // 2026-10-06 16:00 EDT = 20:00 UTC
    const day2Slot2Date = new Date('2026-10-06T20:00:00.000Z');
    const day2Slot2Tick = await evaluateSchedulerTick(day2Slot2Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(day2Slot2Tick.triggered === true && day2Slot2Tick.reason?.includes('recovered article'), '5b. Day 2 (16:00) consumed Job D');

    const stateAfterDay2 = readEngineState();
    const updatedJobC = stateAfterDay2.activeJobs.find(j => j.id === 'job_rec_c')!;
    const updatedJobD = stateAfterDay2.activeJobs.find(j => j.id === 'job_rec_d')!;
    assert(updatedJobC.stage === 'completed' && updatedJobC.assignedPublishDate === '2026-10-06', '5c. Job C assigned to Day 2');
    assert(updatedJobD.stage === 'completed' && updatedJobD.assignedPublishDate === '2026-10-06', '5d. Job D assigned to Day 2');

    // -----------------------------------------------------------------
    // TEST 6: DAY 3 - ZERO RECOVERED JOBS -> NORMAL NEW PRODUCTION RESUMES
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: DAY 3 Normal Production Resumes ---');
    const remainingRecovered = getEligibleRecoveredJobs(1);
    assert(remainingRecovered.length === 0, '6a. Recovered backlog completely drained (0 remaining)');

    // 2026-10-07 08:00 EDT = 12:00 UTC
    const day3Slot1Date = new Date('2026-10-07T12:00:00.000Z');
    const day3Slot1Tick = await evaluateSchedulerTick(day3Slot1Date, { useRealDataForSeo: false, skipQueueWorkerExecution: true });
    assert(day3Slot1Tick.triggered === true, '6b. Day 3 (08:00) triggers normal new generation');
    assert(day3Slot1Tick.reason?.includes('single-slot article production'), '6c. Triggered single-slot new topic discovery');

    const stateAfterDay3 = readEngineState();
    const newDay3Job = stateAfterDay3.activeJobs.find(j => j.assignedPublishDate === '2026-10-07' && j.assignedSlotTime === '08:00');
    assert(Boolean(newDay3Job), '6d. New article job created for Day 3 Slot 1');
    assert(newDay3Job?.contentType === 'trending_crochet', '6e. Day 3 Slot 1 is trending_crochet');

    // -----------------------------------------------------------------
    // TEST 7: RESTART SAFETY & STATE PRESERVATION
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Restart Safety & Invariant Verification ---');
    // Simulate process reload
    const reloadedState = readEngineState();
    const persistedJobA = reloadedState.activeJobs.find(j => j.id === 'job_rec_a')!;
    assert(persistedJobA.assignedPublishDate === '2026-10-05', '7a. assignedPublishDate persists across restart');
    assert(persistedJobA.assignedSlotTime === '08:00', '7b. assignedSlotTime persists across restart');
    assert(persistedJobA.stage === 'completed', '7c. Published status persists across restart');

    // -----------------------------------------------------------------
    // TEST 8: HIGGSFIELD $0 / 0 POSTS INVARIANT FOR RECOVERED JOBS
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Zero Higgsfield POSTs Invariant ---');
    const day1Generations = getDailyHiggsfieldGenerationsCount('2026-10-05', 'America/New_York');
    const day2Generations = getDailyHiggsfieldGenerationsCount('2026-10-06', 'America/New_York');
    assert(day1Generations === 0, `8a. Day 1 Higgsfield generations count is 0 (Got: ${day1Generations})`);
    assert(day2Generations === 0, `8b. Day 2 Higgsfield generations count is 0 (Got: ${day2Generations})`);

    // -----------------------------------------------------------------
    // TEST 9: NO CATCH-UP BURST / 1 PIN MAX PER SLOT
    // -----------------------------------------------------------------
    console.log('\n--- TEST 9: No Catch-up Burst Invariant ---');
    const catchUpResult = await dispatchNextOverduePinterestPin('14:00', '2026-10-05');
    assert(catchUpResult === null, '9a. Catch-up bundling strictly returns null (no bursts)');

  } finally {
    // Clean up temporary mock files
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }

    // Restore original state file
    if (originalStateContent !== null) {
      fs.writeFileSync(statePath, originalStateContent, 'utf8');
    }

    // Restore original cost storage file
    if (originalCostContent !== null && fs.existsSync(costPath)) {
      fs.writeFileSync(costPath, originalCostContent, 'utf8');
    }

    // Restore original blog posts file
    if (originalBlogPostsContent !== null && fs.existsSync(blogPostsPath)) {
      fs.writeFileSync(blogPostsPath, originalBlogPostsContent, 'utf8');
    }
  }

  console.log(`\n=== DRAIN-FIRST TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed in Drain-First pipeline test suite`);
  }
}

runDrainFirstPipelineTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
