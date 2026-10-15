/**
 * Dynamic Pinterest Board Selection Regression Test Suite
 * 
 * Verifies all requirements of the Dynamic Board Selection specification:
 * 1. Category-based board selection:
 *    - Tools article selects the best available tools board.
 *    - Crochet article selects the best available crochet board.
 * 2. Semantic matching:
 *    - Semantically relevant alternative is selected when the preferred board is missing.
 * 3. Fallback hierarchy:
 *    - Configured verified default fallback board works when no match exists.
 *    - Unverified or placeholder boards are never used.
 * 4. Validation:
 *    - Real numeric Pinterest board IDs only (e.g. 18-19 digits).
 *    - Placeholders such as 'board_tools' or 'board_crochet' are rejected.
 * 5. Article & Pin Independence:
 *    - Pinterest board selection failure MUST NOT mark a successfully published article as failed.
 *    - Parent article remains published on the website (data/blog-posts.json).
 * 6. Retryable pin state:
 *    - Unresolved pins are retained in a retryable state with bounded retries.
 *    - Never mark pin as published until confirmed.
 */

import {
  selectBestPinterestBoard,
  scoreBoardRelevance,
  isRealNumericPinterestBoardId,
  isPlaceholderBoardId,
  setMockPinterestBoards,
  clearPinterestBoardCache,
} from '../publishing/pinterestBoardSelector';
import { NormalizedPinterestBoard } from '../../pinterest/pinterestApi';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';
import { publishPinToPinterest } from '../publishing/pinterestPublisher';
import { dispatchScheduledPinterestSlot } from '../publishing/pinterestSlotDispatcher';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { saveLiveBlogPosts, getLiveBlogPosts } from '../publishing/articlePublisher';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

export async function runDynamicPinterestBoardSelectionTests(): Promise<boolean> {
  console.log('===============================================================');
  console.log('STARTING DYNAMIC PINTEREST BOARD SELECTION TEST SUITE');
  console.log('===============================================================\n');

  // Candidate board catalog with real numeric Pinterest IDs
  const connectedBoards: NormalizedPinterestBoard[] = [
    {
      id: '109283746501928374',
      name: 'Crochet Tools & Yarn Calculators',
      description: 'Free interactive crochet tools, yardage calculators, row counters, and stitch tools.',
    },
    {
      id: '209384756102938475',
      name: 'Crochet Patterns & Project Ideas',
      description: 'Modern crochet patterns, beginner tutorials, afghans, and creative project inspiration.',
    },
    {
      id: '309485761203948576',
      name: 'Handmade Crochet Sweaters & Wearables',
      description: 'Cozy crochet clothing, cardigans, and wearable garments.',
    },
  ];

  // -----------------------------------------------------------------
  // TEST 1: Board ID Format & Placeholder Validation
  // -----------------------------------------------------------------
  console.log('--- TEST 1: Board ID Validation ---');
  assert(isRealNumericPinterestBoardId('109283746501928374'), 'Real numeric 18-digit board ID is valid');
  assert(isRealNumericPinterestBoardId('209384756102938475'), 'Real numeric 18-digit board ID 2 is valid');
  assert(!isRealNumericPinterestBoardId('board_tools'), 'Placeholder label "board_tools" is rejected');
  assert(!isRealNumericPinterestBoardId('board_crochet'), 'Placeholder label "board_crochet" is rejected');
  assert(!isRealNumericPinterestBoardId('test_sandbox_fallback_board'), 'Test sandbox placeholder is rejected');
  assert(!isRealNumericPinterestBoardId(''), 'Empty board ID is rejected');
  assert(!isRealNumericPinterestBoardId(null), 'Null board ID is rejected');
  assert(!isRealNumericPinterestBoardId('abc123nonnumeric'), 'Non-numeric ID is rejected');
  assert(isPlaceholderBoardId('board_tools'), 'isPlaceholderBoardId correctly identifies "board_tools"');
  assert(!isPlaceholderBoardId('109283746501928374'), 'isPlaceholderBoardId returns false for genuine numeric ID');

  // -----------------------------------------------------------------
  // TEST 2: Tools Article Selects Best Available Tools Board
  // -----------------------------------------------------------------
  console.log('\n--- TEST 2: Category Matching - Tools Article ---');
  const toolTopic: DiscoveredTopic = {
    id: 'topic_tool_gauge_test',
    keyword: 'how to calculate crochet gauge swatch',
    category: 'tools',
    contentType: 'tool_guide',
    toolSlug: 'gauge-calculator',
    source: 'tool_database',
    competition: 'LOW',
    trendStrength: 85,
    estimatedMonthlyVolume: 1200,
    hookAngle: 'Gauge Swatch Helper',
  };

  const toolSelection = selectBestPinterestBoard({
    topic: toolTopic,
    category: 'tools',
    availableBoards: connectedBoards,
  });

  assert(toolSelection.success === true, 'Tools article board selection succeeded');
  assert(toolSelection.board?.id === '109283746501928374', 'Selected genuine numeric tools board ID');
  assert(toolSelection.board?.name === 'Crochet Tools & Yarn Calculators', 'Selected correct tools board name');
  assert(toolSelection.matchType === 'exact_category', 'Match type is exact_category');

  // -----------------------------------------------------------------
  // TEST 3: Crochet Article Selects Best Available Crochet Board
  // -----------------------------------------------------------------
  console.log('\n--- TEST 3: Category Matching - Crochet Article ---');
  const crochetTopic: DiscoveredTopic = {
    id: 'topic_crochet_waffle_test',
    keyword: 'how to crochet waffle stitch blanket',
    category: 'crochet',
    contentType: 'trending_crochet',
    source: 'trend_hunter',
    competition: 'LOW',
    trendStrength: 90,
    estimatedMonthlyVolume: 2400,
    hookAngle: 'Step by step waffle stitch guide',
  };

  const crochetSelection = selectBestPinterestBoard({
    topic: crochetTopic,
    category: 'crochet',
    availableBoards: connectedBoards,
  });

  assert(crochetSelection.success === true, 'Crochet article board selection succeeded');
  assert(crochetSelection.board?.id === '209384756102938475', 'Selected genuine numeric crochet board ID');
  assert(crochetSelection.board?.name === 'Crochet Patterns & Project Ideas', 'Selected correct crochet board name');
  assert(crochetSelection.matchType === 'exact_category', 'Match type is exact_category');

  // -----------------------------------------------------------------
  // TEST 4: Semantic Match When Preferred Board is Missing
  // -----------------------------------------------------------------
  console.log('\n--- TEST 4: Semantic Alternative Matching ---');
  // Account only has tutorial/stitch board and unrelated gardening board
  const partialBoards: NormalizedPinterestBoard[] = [
    {
      id: '409586712304958671',
      name: 'Crochet Stitch Tutorials & Guides',
      description: 'Step-by-step crochet techniques, stitches, and beginner guides.',
    },
    {
      id: '509687812305968712',
      name: 'Indoor Plant Care & Gardening',
      description: 'Houseplants and gardening tips.',
    },
  ];

  const stitchTopic: DiscoveredTopic = {
    id: 'topic_stitch_ribbed',
    keyword: 'ribbed crochet stitch tutorial',
    category: 'crochet',
    contentType: 'trending_crochet',
    source: 'trend_hunter',
    competition: 'LOW',
    trendStrength: 80,
    estimatedMonthlyVolume: 1800,
    hookAngle: 'Easy ribbed stitch tutorial',
  };

  const semanticSelection = selectBestPinterestBoard({
    topic: stitchTopic,
    category: 'crochet',
    availableBoards: partialBoards,
  });

  assert(semanticSelection.success === true, 'Semantic alternative board selection succeeded');
  assert(semanticSelection.board?.id === '409586712304958671', 'Selected stitch tutorials board');
  assert(
    semanticSelection.matchType === 'exact_category' || semanticSelection.matchType === 'semantic',
    'Match type is exact_category or semantic',
    semanticSelection.matchType
  );

  // -----------------------------------------------------------------
  // TEST 5: Fallback Hierarchy - Default Fallback Board
  // -----------------------------------------------------------------
  console.log('\n--- TEST 5: Configured Default Fallback Board ---');
  // Account has only completely unrelated boards
  const unrelatedBoards: NormalizedPinterestBoard[] = [
    {
      id: '609788912306978812',
      name: 'Vintage Car Restoration',
      description: 'Classic cars and mechanical repairs.',
    },
    {
      id: '709899012307989912',
      name: 'Outdoor Mountain Biking',
      description: 'Trail riding and biking equipment.',
    },
  ];

  const verifiedFallbackBoard = {
    id: '809900112308990012',
    name: 'WeLovePattern Main Community Board',
  };

  const fallbackSelection = selectBestPinterestBoard({
    topic: toolTopic,
    category: 'tools',
    availableBoards: unrelatedBoards,
    fallbackBoard: verifiedFallbackBoard,
  });

  assert(fallbackSelection.success === true, 'Fallback board selection succeeded');
  assert(fallbackSelection.board?.id === '809900112308990012', 'Selected configured verified fallback board ID');
  assert(fallbackSelection.matchType === 'verified_fallback', 'Match type is verified_fallback');

  // If fallback board has a placeholder ID like 'board_tools', it must be REJECTED
  const invalidFallbackBoard = {
    id: 'board_tools',
    name: 'Placeholder Board',
  };

  const rejectedFallback = selectBestPinterestBoard({
    topic: toolTopic,
    category: 'tools',
    availableBoards: unrelatedBoards,
    fallbackBoard: invalidFallbackBoard,
  });

  assert(rejectedFallback.success === false, 'Placeholder fallback board is rejected');
  assert(rejectedFallback.matchType === 'none', 'No board resolved when fallback is a placeholder');

  // -----------------------------------------------------------------
  // TEST 6: Safe Publisher Rejection for Invalid Board ID
  // -----------------------------------------------------------------
  console.log('\n--- TEST 6: Pinterest Publisher Rejection of Placeholder Board IDs ---');
  const dummyJob: SeoEngineArticleJob = {
    id: 'job_test_board_rejection',
    category: 'tools',
    contentType: 'tool_guide',
    stage: 'completed',
    dateScheduled: '2026-10-15',
    topic: toolTopic,
    articleContent: {
      title: 'How to Calculate Crochet Gauge Swatch',
      slug: 'how-to-calculate-crochet-gauge-swatch-test',
      excerpt: 'Calculate crochet gauge swatches easily.',
      contentHtml: '<p>Content</p>',
      wordCount: 850,
      category: 'tools',
      tags: ['Crochet', 'Tools'],
    },
    logs: [],
    createdAt: new Date().toISOString(),
  };

  // Provide existing test fixture image (> 100 bytes so isValidLocalAsset succeeds)
  const fixtureImgPath = path.join(process.cwd(), 'public', 'uploads', 'blog', 'default-crochet.jpg');
  fs.mkdirSync(path.dirname(fixtureImgPath), { recursive: true });
  fs.writeFileSync(fixtureImgPath, Buffer.alloc(1024, 'a'));

  const pinWithPlaceholderBoard = {
    pinNumber: 1,
    publishStatus: 'image_ready' as const,
    stableAssetPath: fixtureImgPath,
    stablePublicUrl: '/uploads/blog/default-crochet.jpg',
    targetBoardId: 'board_tools', // PLACEHOLDER!
    typographyOverlay: {
      primaryHeadline: 'CALCULATE CROCHET GAUGE',
      ctaBadgeText: 'CALCULATE GAUGE FREE →',
    },
  };

  const publishResult = await publishPinToPinterest(dummyJob, pinWithPlaceholderBoard);
  assert(publishResult.success === false, 'Publisher rejected placeholder board ID "board_tools"');
  assert(
    publishResult.error?.includes('placeholder') || publishResult.error?.includes('invalid'),
    'Clear diagnostic error returned for placeholder board ID',
    publishResult.error
  );

  // -----------------------------------------------------------------
  // TEST 7: Article & Pin Independence - Board Failure Does Not Fail Article
  // -----------------------------------------------------------------
  console.log('\n--- TEST 7: Article & Pin Independence ---');
  // Setup clean state
  const origState = readEngineState();
  const testDate = '2026-10-15';
  const testSlot = '08:30';

  // Set mock sandbox connection for dispatcher pre-flight check
  const prevSandbox = process.env.PINTEREST_USE_SANDBOX;
  const prevToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN;
  process.env.PINTEREST_USE_SANDBOX = 'true';
  process.env.PINTEREST_SANDBOX_ACCESS_TOKEN = 'test_mock_sandbox_token';

  // Clear mock boards so no suitable board is found
  clearPinterestBoardCache();
  setMockPinterestBoards([]);

  // Create article job that is already published on website
  const testArticleSlug = 'published-crochet-gauge-guide-safe';
  const testBlogPostId = 'blog_post_safe_test_123';

  // Seed live blog posts datastore
  const currentPosts = getLiveBlogPosts();
  const newPost = {
    id: testBlogPostId,
    seoEngineJobId: 'job_safe_independence_test',
    title: 'Published Crochet Gauge Guide Safe',
    slug: testArticleSlug,
    excerpt: 'Test excerpt',
    content: '<p>Content</p>',
    category: 'Tools',
    status: 'published',
    publishedAt: new Date().toISOString(),
  };
  saveLiveBlogPosts([...currentPosts.filter(p => p.id !== testBlogPostId), newPost]);

  const independentJob: SeoEngineArticleJob = {
    id: 'job_safe_independence_test',
    category: 'tools',
    contentType: 'tool_guide',
    stage: 'completed',
    publishedBlogPostId: testBlogPostId,
    publishedSlug: testArticleSlug,
    assignedPublishDate: testDate,
    assignedSlotTime: '08:00',
    publicationScheduledAt: '08:00',
    dateScheduled: testDate,
    topic: toolTopic,
    articleContent: {
      title: 'Published Crochet Gauge Guide Safe',
      slug: testArticleSlug,
      excerpt: 'Test excerpt',
      contentHtml: '<p>Content</p>',
      wordCount: 800,
      category: 'tools',
      tags: ['Crochet'],
    },
    pinterestPins: [
      {
        pinNumber: 1,
        publishStatus: 'image_ready',
        assignedSlotTime: '08:30',
        scheduledTime: '08:30',
        stableAssetPath: fixtureImgPath,
        stablePublicUrl: '/uploads/blog/default-crochet.jpg',
        targetBoardId: '', // EMPTY BOARD ID!
        typographyOverlay: {
          primaryHeadline: 'CALCULATE GAUGE',
          ctaBadgeText: 'CALCULATE FREE →',
        },
      },
    ],
    logs: [],
    createdAt: new Date().toISOString(),
  };

  // Temporarily insert job into state with no connected boards
  writeEngineState({
    ...origState,
    config: {
      ...origState.config,
      engineActive: true,
      autoPublishPinterest: true,
      fallbackBoardId: undefined, // No fallback configured
      fallbackBoardName: undefined,
    },
    activeJobs: [independentJob],
  });

  // Attempt to dispatch pin for this slot (board cannot be resolved)
  const dispatchResult = await dispatchScheduledPinterestSlot(testSlot, testDate);

  assert(dispatchResult.triggered === true, 'Slot dispatcher triggered');
  assert(dispatchResult.pinPublished === false, 'Pin was NOT published (as expected, no board)');

  // Verify parent article was NOT modified or failed
  const stateAfter = readEngineState();
  const jobAfter = stateAfter.activeJobs.find(j => j.id === independentJob.id);
  assert(jobAfter?.stage === 'completed', 'Parent article job stage remains "completed"');
  assert(jobAfter?.publishedBlogPostId === testBlogPostId, 'Parent article publishedBlogPostId remains intact');

  // Verify live blog post on website is still published and not deleted/failed
  const livePostsAfter = getLiveBlogPosts();
  const livePostStillExists = livePostsAfter.some(p => p.id === testBlogPostId && p.status === 'published');
  assert(livePostStillExists === true, 'Website blog post remains published and live');

  // -----------------------------------------------------------------
  // TEST 8: Pinterest Pin Retryable State & Bounded Retries
  // -----------------------------------------------------------------
  console.log('\n--- TEST 8: Pin Retryable State & Bounded Retries ---');
  const pinAfter = jobAfter?.pinterestPins?.[0];
  assert(pinAfter?.publishStatus === 'failed', 'Pin publishStatus is "failed" (retryable state)');
  assert(pinAfter?.retryCount === 1, 'Pin retryCount incremented to 1');
  assert(Boolean(pinAfter?.lastAttemptAt), 'Pin lastAttemptAt timestamp recorded');
  assert(pinAfter?.isPermanentFailure !== true, 'Pin is NOT permanently failed after 1 attempt');

  // Attempt 2: retryCount increments to 2
  await dispatchScheduledPinterestSlot(testSlot, testDate);
  const stateAfter2 = readEngineState();
  const pinAfter2 = stateAfter2.activeJobs.find(j => j.id === independentJob.id)?.pinterestPins?.[0];
  assert(pinAfter2?.retryCount === 2, 'Pin retryCount incremented to 2');
  assert(pinAfter2?.isPermanentFailure !== true, 'Pin is NOT permanently failed after 2 attempts');

  // Attempt 3: retryCount reaches 3 -> bounded retry stops and marks permanent failure
  await dispatchScheduledPinterestSlot(testSlot, testDate);
  const stateAfter3 = readEngineState();
  const jobAfter3 = stateAfter3.activeJobs.find(j => j.id === independentJob.id);
  const pinAfter3 = jobAfter3?.pinterestPins?.[0];
  assert(pinAfter3?.retryCount === 3, 'Pin retryCount reached 3');
  assert(pinAfter3?.isPermanentFailure === true, 'Pin bounded retry correctly set isPermanentFailure: true');
  assert(jobAfter3?.stage === 'completed', 'Parent article STILL remains "completed" after pin permanent failure');

  // -----------------------------------------------------------------
  // TEST 9: Dynamic Resolution When Board Available
  // -----------------------------------------------------------------
  console.log('\n--- TEST 9: Dynamic Board Resolution During Dispatch ---');
  // Configure mock boards in connected account
  setMockPinterestBoards(connectedBoards);

  // New pin with unassigned board
  const jobWithUnassignedBoard: SeoEngineArticleJob = {
    ...independentJob,
    id: 'job_dynamic_res_test',
    pinterestPins: [
      {
        pinNumber: 1,
        publishStatus: 'image_ready',
        assignedSlotTime: '08:30',
        scheduledTime: '08:30',
        stableAssetPath: fixtureImgPath,
        stablePublicUrl: '/uploads/blog/default-crochet.jpg',
        targetBoardId: '', // Unassigned, should dynamically resolve
        typographyOverlay: {
          primaryHeadline: 'CALCULATE GAUGE',
          ctaBadgeText: 'CALCULATE FREE →',
        },
      } as any,
    ],
  };

  writeEngineState({
    ...readEngineState(),
    activeJobs: [jobWithUnassignedBoard],
  });

  // Call slot dispatcher with valid boards
  await dispatchScheduledPinterestSlot('08:30', testDate);

  const stateAfterDynamic = readEngineState();
  const jobAfterDynamic = stateAfterDynamic.activeJobs.find(j => j.id === 'job_dynamic_res_test');
  const resolvedPin = jobAfterDynamic?.pinterestPins?.[0];
  assert(
    resolvedPin?.targetBoardId === '109283746501928374',
    'Unassigned pin dynamically resolved genuine tools board ID during dispatch',
    resolvedPin?.targetBoardId
  );
  assert(
    resolvedPin?.targetBoardName === 'Crochet Tools & Yarn Calculators',
    'Unassigned pin dynamically resolved tools board name'
  );

  // Restore original state, environment, and cleanup test posts
  if (prevSandbox !== undefined) process.env.PINTEREST_USE_SANDBOX = prevSandbox;
  else delete process.env.PINTEREST_USE_SANDBOX;
  if (prevToken !== undefined) process.env.PINTEREST_SANDBOX_ACCESS_TOKEN = prevToken;
  else delete process.env.PINTEREST_SANDBOX_ACCESS_TOKEN;

  clearPinterestBoardCache();
  writeEngineState(origState);
  saveLiveBlogPosts(getLiveBlogPosts().filter(p => p.id !== testBlogPostId));

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  return failed === 0;
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.endsWith('testDynamicPinterestBoardSelection.ts')) {
  runDynamicPinterestBoardSelectionTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled test error:', err);
      process.exit(1);
    });
}
