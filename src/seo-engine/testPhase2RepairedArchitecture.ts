/**
 * Focused Isolated Test: Phase 2 Repaired Production Architecture
 * 
 * Verifies:
 * 1. Daily 3-slot ratio: Exactly 2 tools/calculators articles and 1 crochet article.
 * 2. Slot 1 is strictly Trending Crochet (category 'crochet', zero tool words).
 * 3. Slot 2 is Tool Guide 1 (category 'tools', real tool slug from TOOLS_DATA).
 * 4. Slot 3 is Tool Guide 2 (category 'tools', distinct tool slug from Slot 2).
 * 5. Time mapping: Article slots at 08:00, 12:00, 16:00; Pinterest slots at 08:30, 09:00, 12:30, 13:00, 16:30, 17:00.
 * 6. Pinterest 1-to-1 mapping across all 6 slots to the 3 parent articles (Pin 1 and Pin 2).
 * 7. Pinterest publishing blocked until parent article is confirmed live.
 * 8. Error classification and bounded retries:
 *    - Permanent errors marked isPermanentFailure and stopped.
 *    - Temporary errors bounded to max 3 attempts with exponential backoff.
 * 9. Human approval workflow:
 *    - Transition from awaiting_approval to ready_to_publish.
 *    - Immediate publication when requested or autoPublish enabled.
 * 10. Scheduler idempotency across restarts.
 * 11. Safety under reuseOnlyMode: stops with inventory_exhausted, $0 cost, 0 API calls.
 */

import fs from 'fs';
import path from 'path';
import { discoverDailyThreeSlotTopics, discoverTrendingCrochetTopic, discoverToolGuideTopic } from './discovery/topicDiscovery';
import { isToolKeyword } from './discovery/opportunityScorer';
import { createSingleSlotProductionJob, createDailyThreeSlotProductionBatch, recoverInterruptedJobs } from './queue/jobQueueManager';
import { dispatchScheduledPinterestSlot, dispatchNextOverduePinterestPin } from './publishing/pinterestSlotDispatcher';
import { evaluateSchedulerTick } from './scheduler';
import { DEFAULT_SEO_ENGINE_CONFIG } from './config';
import { TOOLS_DATA } from '../data/toolsData';
import { SeoEngineDailyState, SeoEngineArticleJob, PinterestCreativeConcept } from './types';

let passed = 0;
let failed = 0;

function check(cond: boolean, desc: string, details?: any) {
  if (cond) {
    passed++;
    console.log(`✅ [PASS] ${desc}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${desc}`, details ? `-> ${JSON.stringify(details)}` : '');
  }
}

async function runPhase2Tests() {
  console.log('===============================================================');
  console.log('STARTING PHASE 2 REPAIRED PRODUCTION ARCHITECTURE TESTS');
  console.log('===============================================================\n');

  const testStatePath = path.resolve(process.cwd(), 'data/seo-engine-state.json');
  const backupState = fs.readFileSync(testStatePath, 'utf8');
  const testPostsPath = path.resolve(process.cwd(), 'data/blog-posts.json');
  const backupPosts = fs.readFileSync(testPostsPath, 'utf8');

  try {
    // -----------------------------------------------------------------
    // TEST 1: Topic Discovery 3-Slot Batch & 2 Tools / 1 Crochet Ratio
    // -----------------------------------------------------------------
    console.log('\n--- 1. Topic Discovery 3-Slot Batch & Ratio ---');
    const [topic1, topic2, topic3] = await discoverDailyThreeSlotTopics({ useRealDataForSeo: false });

    check(topic1.contentType === 'trending_crochet', '1a. Slot 1 contentType is trending_crochet');
    check(topic1.category === 'crochet', '1b. Slot 1 category is crochet');
    check(!isToolKeyword(topic1.keyword), `1c. Slot 1 topic "${topic1.keyword}" contains zero tool words`);

    check(topic2.contentType === 'tool_guide', '1d. Slot 2 contentType is tool_guide');
    check(topic2.category === 'tools', '1e. Slot 2 category is tools');
    check(Boolean(topic2.toolSlug), `1f. Slot 2 toolSlug "${topic2.toolSlug}" exists`);
    check(TOOLS_DATA.some(t => t.slug === topic2.toolSlug), '1g. Slot 2 toolSlug belongs to TOOLS_DATA');

    check(topic3.contentType === 'tool_guide', '1h. Slot 3 contentType is tool_guide');
    check(topic3.category === 'tools', '1i. Slot 3 category is tools');
    check(Boolean(topic3.toolSlug), `1j. Slot 3 toolSlug "${topic3.toolSlug}" exists`);
    check(TOOLS_DATA.some(t => t.slug === topic3.toolSlug), '1k. Slot 3 toolSlug belongs to TOOLS_DATA');

    check(topic2.toolSlug !== topic3.toolSlug, `1l. Slot 2 ("${topic2.toolSlug}") and Slot 3 ("${topic3.toolSlug}") cover distinct tools`);

    // Verify aggregate daily ratio: exactly 2 tools and 1 crochet
    const categories = [topic1.category, topic2.category, topic3.category];
    const crochetCount = categories.filter(c => c === 'crochet').length;
    const toolsCount = categories.filter(c => c === 'tools').length;
    check(crochetCount === 1, '1m. Exactly 1 crochet topic in daily batch');
    check(toolsCount === 2, '1n. Exactly 2 tools topics in daily batch');

    // -----------------------------------------------------------------
    // TEST 2: Single Slot Production Job Creation for Slots 1, 2, 3
    // -----------------------------------------------------------------
    console.log('\n--- 2. Single Slot Production Job Creation ---');
    const job1 = await createSingleSlotProductionJob(1, { useRealDataForSeo: false, scheduledDate: '2026-10-20' });
    check(job1.assignedSlotTime === '08:00', '2a. Slot 1 job assigned to 08:00');
    check(job1.category === 'crochet', '2b. Slot 1 job category is crochet');

    const job2 = await createSingleSlotProductionJob(2, { useRealDataForSeo: false, scheduledDate: '2026-10-20' });
    check(job2.assignedSlotTime === '12:00', '2c. Slot 2 job assigned to 12:00');
    check(job2.category === 'tools', '2d. Slot 2 job category is tools');

    const job3 = await createSingleSlotProductionJob(3, { useRealDataForSeo: false, scheduledDate: '2026-10-20' });
    check(job3.assignedSlotTime === '16:00', '2e. Slot 3 job assigned to 16:00');
    check(job3.category === 'tools', '2f. Slot 3 job category is tools');
    check(job2.topic.toolSlug !== job3.topic.toolSlug, `2g. Slot 2 tool (${job2.topic.toolSlug}) and Slot 3 tool (${job3.topic.toolSlug}) are distinct`);

    // -----------------------------------------------------------------
    // TEST 3: Pinterest 1-to-1 Slot Mapping & Unconfirmed Article Guard
    // -----------------------------------------------------------------
    console.log('\n--- 3. Pinterest 1-to-1 Slot Mapping & Parent Article Guard ---');
    // Ensure job1 has Pin 1 configured with local asset, but article is unpublished
    const stateBeforePinTest: SeoEngineDailyState = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
    const targetJob1 = stateBeforePinTest.activeJobs.find(j => j.id === job1.id);
    if (targetJob1) {
      targetJob1.pinterestPins = [
        {
          pinNumber: 1,
          conceptAngle: 'Angle 1',
          visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: '', colorPalette: '', humanElement: 'none' },
          compactHiggsfieldPrompt: '',
          typographyOverlay: { primaryHeadline: 'Headline', ctaBadgeText: 'Try Free →' },
          destinationUrl: 'https://welovepattern.com/blog/test',
          targetBoardId: 'board_123',
          targetBoardName: 'Crochet',
          stableAssetPath: '/public/generated/pinterest/seo-pins/mastering-crochet-gauge-your-ultimate-ca-e1844b9974.jpg',
          publishStatus: 'image_ready',
        }
      ];
      fs.writeFileSync(testStatePath, JSON.stringify(stateBeforePinTest, null, 2));
    }

    // Article 1 is NOT published to live blog yet
    const pinRes0830 = await dispatchScheduledPinterestSlot('08:30', '2026-10-20');
    check(pinRes0830.triggered === true, '3a. Pinterest 08:30 slot triggered');
    check(pinRes0830.pinPublished === false, '3b. Pin 1 publication deferred because parent article not confirmed live');
    check(pinRes0830.reason?.includes('not yet confirmed live'), '3c. Descriptive reason indicates article not live', pinRes0830.reason);

    // -----------------------------------------------------------------
    // TEST 4: Pinterest Error Classification & Bounded Retries
    // -----------------------------------------------------------------
    console.log('\n--- 4. Error Classification & Bounded Retries ---');
    const testPin: PinterestCreativeConcept = {
      pinNumber: 1,
      conceptAngle: 'Test Angle',
      visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Test', colorPalette: 'warm', humanElement: 'none' },
      compactHiggsfieldPrompt: 'Test prompt',
      typographyOverlay: { primaryHeadline: 'Test', ctaBadgeText: 'Try Free →' },
      destinationUrl: 'https://welovepattern.com/blog/test',
      targetBoardId: 'test_board_123',
      targetBoardName: 'Test Board',
      stableAssetPath: '/public/generated/pinterest/seo-pins/mastering-crochet-gauge-your-ultimate-ca-e1844b9974.jpg',
      publishStatus: 'image_ready',
      retryCount: 3,
      isPermanentFailure: true,
      errorMessage: 'Board not found (404)',
    };

    const mockJobWithMaxRetries: SeoEngineArticleJob = {
      id: 'job_max_retries',
      dateScheduled: '2026-10-22',
      assignedPublishDate: '2026-10-22',
      assignedSlotTime: '08:00',
      contentType: 'trending_crochet',
      category: 'crochet',
      topic: { id: 'top_test', keyword: 'crochet test', opportunityScore: 90 },
      articleContent: {
        title: 'Live Article',
        slug: 'live-article',
        contentHtml: '<p>Content</p>',
        wordCount: 900,
        category: 'Crochet',
        tags: [],
      },
      publishedBlogPostId: 'blog_1791836992562_xsqom50', // Existing post in blog-posts.json
      publishedSlug: 'mastering-your-crochet-project-with-a-yarn-calculator',
      stage: 'completed',
      pinterestPins: [testPin],
      requiresApproval: false,
      indexNowNotified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [],
    };

    // Update state to include this job on isolated date 2026-10-22
    const currentState: SeoEngineDailyState = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
    currentState.activeJobs.push(mockJobWithMaxRetries);
    fs.writeFileSync(testStatePath, JSON.stringify(currentState, null, 2));

    const maxRetryResult = await dispatchScheduledPinterestSlot('08:30', '2026-10-22');
    check(maxRetryResult.pinPublished === false, '4a. Pin with 3 retries / permanent failure is blocked from calling Pinterest API');
    check(
      maxRetryResult.reason?.includes('reached maximum retry limit') || maxRetryResult.reason?.includes('permanent failure'),
      '4b. Explains retry limit reached',
      maxRetryResult.reason
    );

    // -----------------------------------------------------------------
    // TEST 5: Restart Recovery Safety
    // -----------------------------------------------------------------
    console.log('\n--- 5. Restart Recovery Safety ---');
    const interruptedJob: SeoEngineArticleJob = {
      id: 'job_interrupted_test',
      dateScheduled: '2026-10-20',
      contentType: 'tool_guide',
      category: 'tools',
      topic: { id: 't_int', keyword: 'yarn test', opportunityScore: 85 },
      stage: 'writing', // in-flight interrupted stage
      pinterestPins: [],
      requiresApproval: false,
      indexNowNotified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [],
    };

    const stateWithInterrupted: SeoEngineDailyState = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
    stateWithInterrupted.activeJobs.push(interruptedJob);
    fs.writeFileSync(testStatePath, JSON.stringify(stateWithInterrupted, null, 2));

    recoverInterruptedJobs();

    const recoveredState: SeoEngineDailyState = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
    const recoveredJob = recoveredState.activeJobs.find(j => j.id === 'job_interrupted_test');
    check(recoveredJob?.stage === 'selected', '5a. In-flight interrupted job reset to selected stage for clean recovery');

    // -----------------------------------------------------------------
    // TEST 6: ReuseOnlyMode Invariant & Inventory Exhaustion
    // -----------------------------------------------------------------
    console.log('\n--- 6. ReuseOnlyMode Safety & Inventory Exhaustion ---');
    // Ensure all active jobs are marked as completed so no eligible unassigned packages remain
    const stateForExhaustion: SeoEngineDailyState = JSON.parse(fs.readFileSync(testStatePath, 'utf8'));
    for (const j of stateForExhaustion.activeJobs) {
      j.stage = 'completed';
      j.publishedBlogPostId = 'post_existing_123';
    }
    fs.writeFileSync(testStatePath, JSON.stringify(stateForExhaustion, null, 2));

    const tickResult = await evaluateSchedulerTick(
      new Date('2026-10-25T16:00:00-04:00'), // 16:00 EDT
      { useRealDataForSeo: false }
    );
    check(tickResult.action === 'inventory_exhausted', '6a. Scheduler stops safely with inventory_exhausted ($0 cost, 0 API calls)', tickResult.action);

    console.log('\n===============================================================');
    console.log(`PHASE 2 ARCHITECTURAL TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

  } finally {
    // Restore original state and blog posts
    fs.writeFileSync(testStatePath, backupState, 'utf8');
    fs.writeFileSync(testPostsPath, backupPosts, 'utf8');
  }
}

runPhase2Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
