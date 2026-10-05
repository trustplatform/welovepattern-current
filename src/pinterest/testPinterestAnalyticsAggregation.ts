/**
 * Unit Test Suite for Pinterest Pin Analytics Aggregation (Isolated, Mocked)
 */

import { getPinAnalytics } from './pinterestAnalytics';
import { SeoEngineDailyState, SeoEngineArticleJob } from '../seo-engine/types';
import { FetchPinAnalyticsResult } from './pinterestApi';

async function runAggregationTests() {
  console.log('=== STARTING PINTEREST ANALYTICS AGGREGATION TESTS ===');

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

  // --- MOCK JOBS AND PIN DATA ---
  const mockJob1: SeoEngineArticleJob = {
    id: 'job_article_001',
    dateScheduled: '2026-09-20',
    contentType: 'trending_crochet',
    category: 'crochet',
    stage: 'published',
    requiresApproval: false,
    indexNowNotified: true,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
    logs: [],
    topic: {
      id: 'topic_pumpkin',
      keyword: 'easy crochet pumpkin pattern free',
      contentType: 'trending_crochet',
      category: 'crochet',
      source: 'gsc_seed',
      trendScore: 90,
      opportunityScore: 92,
      targetContentFormat: 'tutorial',
      targetCategoryUrl: '/categories/crochet',
      targetAudienceLevel: 'beginner',
      searchIntentNotes: 'Test seed',
      discoveredAt: '2026-09-20T10:00:00.000Z',
      status: 'published',
    },
    articleContent: {
      title: 'How to Crochet an Easy Pumpkin for Fall',
      slug: 'how-to-crochet-easy-pumpkin-fall',
      excerpt: 'Learn to crochet a plush pumpkin in under an hour.',
      contentHtml: '<p>Article content</p>',
      wordCount: 1200,
      category: 'crochet',
      tags: ['pumpkin', 'crochet'],
      seoMeta: { title: 'Pumpkin Tutorial', description: 'Easy pattern', keywords: 'pumpkin' },
    },
    pinterestPins: [
      {
        pinNumber: 1,
        conceptAngle: 'Lifestyle Autumn Warmth',
        visualStyle: {
          imageCount: 1,
          compositionType: 'single_hero',
          subjectDescription: 'Crochet pumpkin on rustic table',
          colorPalette: 'Orange, cream, warm brown',
          humanElement: 'none',
        },
        compactHiggsfieldPrompt: 'Prompt for pin 1',
        typographyOverlay: {
          primaryHeadline: 'Quick Plush Pumpkin Pattern',
          ctaBadgeText: 'GET THE FREE PATTERN →',
          textContainerStyle: 'soft_comfort_card',
        },
        destinationUrl: 'https://welovepattern.com/blog/how-to-crochet-easy-pumpkin-fall',
        targetBoardId: 'board_autumn_decor',
        targetBoardName: 'Crochet Home Decor & Autumn',
        stablePublicUrl: '/generated/pinterest/seo-pins/pumpkin-pin-1.webp',
        pinterestPinId: 'pin_111111',
        publishStatus: 'published', // VALID PUBLISHED PIN
      },
      {
        pinNumber: 2,
        conceptAngle: 'Editorial Collage Step by Step',
        visualStyle: {
          imageCount: 3,
          compositionType: '3_image_grid',
          subjectDescription: 'Step-by-step crochet pumpkin steps',
          colorPalette: 'Warm terracotta',
          humanElement: 'hands_only',
        },
        compactHiggsfieldPrompt: 'Prompt for pin 2',
        typographyOverlay: {
          primaryHeadline: 'Step by Step Pumpkin Crochet',
          ctaBadgeText: 'SEE ALL 4 STEPS →',
          textContainerStyle: 'clean_lower_banner',
        },
        destinationUrl: 'https://welovepattern.com/blog/how-to-crochet-easy-pumpkin-fall',
        targetBoardId: 'board_tutorials',
        targetBoardName: 'Crochet Tutorials & Stitches',
        stablePublicUrl: '/generated/pinterest/seo-pins/pumpkin-pin-2.webp',
        pinterestPinId: 'pin_222222',
        publishStatus: 'published', // VALID PUBLISHED PIN (Will be simulated to fail in fetcher)
      },
    ],
  };

  const mockJob2Unpublished: SeoEngineArticleJob = {
    id: 'job_article_002',
    dateScheduled: '2026-09-21',
    contentType: 'tool_guide',
    category: 'tools',
    stage: 'awaiting_approval',
    requiresApproval: true,
    indexNowNotified: false,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
    logs: [],
    topic: {
      id: 'topic_calc',
      keyword: 'yarn calculator',
      contentType: 'tool_guide',
      category: 'tools',
      source: 'gsc_seed',
      trendScore: 80,
      opportunityScore: 85,
      targetContentFormat: 'tool_focus',
      targetCategoryUrl: '/categories/tools',
      targetAudienceLevel: 'all_levels',
      searchIntentNotes: 'Tool guide',
      discoveredAt: '2026-09-21T10:00:00.000Z',
      status: 'awaiting_approval',
    },
    pinterestPins: [
      {
        pinNumber: 1,
        conceptAngle: 'Tool Calculator Hero',
        visualStyle: {
          imageCount: 1,
          compositionType: 'single_hero',
          subjectDescription: 'Yarn calculator app preview',
          colorPalette: 'Indigo and slate',
          humanElement: 'none',
        },
        compactHiggsfieldPrompt: 'Tool pin prompt',
        typographyOverlay: {
          primaryHeadline: 'Calculate Exact Blanket Yardage',
          ctaBadgeText: 'CALCULATE YARN FREE →',
          textContainerStyle: 'soft_comfort_card',
        },
        destinationUrl: 'https://welovepattern.com/tools/yarn-calculator',
        targetBoardId: 'board_tools',
        targetBoardName: 'Crochet Tools & Calculators',
        stablePublicUrl: '/generated/pinterest/seo-pins/tool-pin-1.webp',
        pinterestPinId: 'pin_333333',
        publishStatus: 'image_ready', // NOT PUBLISHED -> MUST BE EXCLUDED
      },
      {
        pinNumber: 2,
        conceptAngle: 'Tool Angle 2',
        visualStyle: {
          imageCount: 1,
          compositionType: 'single_hero',
          subjectDescription: 'Yarn chart',
          colorPalette: 'Indigo',
          humanElement: 'none',
        },
        compactHiggsfieldPrompt: 'Prompt',
        typographyOverlay: {
          primaryHeadline: 'How Much Yarn Do I Need',
          ctaBadgeText: 'TRY THE CALCULATOR →',
          textContainerStyle: 'soft_comfort_card',
        },
        destinationUrl: 'https://welovepattern.com/tools/yarn-calculator',
        targetBoardId: 'board_tools',
        targetBoardName: 'Crochet Tools & Calculators',
        stablePublicUrl: '/generated/pinterest/seo-pins/tool-pin-2.webp',
        pinterestPinId: undefined, // NO PIN ID -> MUST BE EXCLUDED
        publishStatus: 'published',
      },
    ],
  };

  const mockJob3Duplicate: SeoEngineArticleJob = {
    id: 'job_article_003',
    dateScheduled: '2026-09-22',
    contentType: 'trending_crochet',
    category: 'crochet',
    stage: 'published',
    requiresApproval: false,
    indexNowNotified: true,
    createdAt: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-22T12:00:00.000Z',
    logs: [],
    topic: {
      id: 'topic_dup',
      keyword: 'duplicate test',
      contentType: 'trending_crochet',
      category: 'crochet',
      source: 'gsc_seed',
      trendScore: 70,
      opportunityScore: 70,
      targetContentFormat: 'tutorial',
      targetCategoryUrl: '/categories/crochet',
      targetAudienceLevel: 'all_levels',
      searchIntentNotes: 'Dup test',
      discoveredAt: '2026-09-22T10:00:00.000Z',
      status: 'published',
    },
    pinterestPins: [
      {
        pinNumber: 1,
        conceptAngle: 'Duplicate Angle',
        visualStyle: {
          imageCount: 1,
          compositionType: 'single_hero',
          subjectDescription: 'Test',
          colorPalette: 'Test',
          humanElement: 'none',
        },
        compactHiggsfieldPrompt: 'Test',
        typographyOverlay: {
          primaryHeadline: 'Duplicate Headline',
          ctaBadgeText: 'TEST CTA →',
          textContainerStyle: 'soft_comfort_card',
        },
        destinationUrl: 'https://welovepattern.com/blog/duplicate',
        targetBoardId: 'board_autumn_decor',
        targetBoardName: 'Crochet Home Decor & Autumn',
        stablePublicUrl: '/generated/pinterest/seo-pins/duplicate.webp',
        pinterestPinId: 'pin_111111', // SAME PIN ID AS IN JOB 1 -> MUST BE DEDUPLICATED
        publishStatus: 'published',
      },
    ],
  };

  const mockState: SeoEngineDailyState = {
    version: 1,
    config: {} as any,
    lastRunDate: '2026-09-22',
    todayDiscoveredTopics: [],
    activeJobs: [mockJob1, mockJob2Unpublished, mockJob3Duplicate],
    completedJobsHistory: [],
    updatedAt: '2026-09-22T12:00:00.000Z',
  };

  // Mock Fetcher
  const mockFetcher = async (pinId: string, startDate: string, endDate: string): Promise<FetchPinAnalyticsResult> => {
    if (pinId === 'pin_111111') {
      return {
        success: true,
        pinId,
        startDate,
        endDate,
        summary: {
          impressions: 4850,
          saves: 142,
          pinClicks: 210,
          outboundClicks: 165,
          engagements: 517,
          closeups: 80,
          engagementRate: 0.1066,
          clickThroughRate: 0.034,
        },
        dailyBreakdown: [
          { date: '2026-09-18', metrics: { IMPRESSION: 2400, SAVE: 70, OUTBOUND_CLICK: 80 } },
          { date: '2026-09-19', metrics: { IMPRESSION: 2450, SAVE: 72, OUTBOUND_CLICK: 85 } },
        ],
      };
    } else if (pinId === 'pin_222222') {
      // Simulate failure for pin 2
      return {
        success: false,
        pinId,
        error: 'Pinterest API 500 Internal Server Error for this Pin',
      };
    }
    return {
      success: false,
      pinId,
      error: 'Not found',
    };
  };

  // Execute getPinAnalytics
  const result = await getPinAnalytics('2026-09-01', '2026-09-22', {
    state: mockState,
    fetchFn: mockFetcher,
  });

  // 1. Published Pin with valid pinterestPinId is included
  assert(result.pins.some(p => p.pinterestPinId === 'pin_111111'), '1. Published Pin with valid pinterestPinId is included');

  // 2. Unpublished Pin is excluded
  assert(!result.pins.some(p => p.pinterestPinId === 'pin_333333'), '2. Unpublished Pin (image_ready) is excluded');

  // 3. Pin without pinterestPinId is excluded
  assert(result.pins.every(p => Boolean(p.pinterestPinId)), '3. Pin without pinterestPinId is excluded');

  // 4. Pin is correctly linked to its parent Article
  const pin1 = result.pins.find(p => p.pinterestPinId === 'pin_111111');
  assert(
    pin1?.articleTitle === 'How to Crochet an Easy Pumpkin for Fall' &&
    pin1?.articleSlug === 'how-to-crochet-easy-pumpkin-fall' &&
    pin1?.jobId === 'job_article_001',
    '4. Pin is correctly linked to its parent Article'
  );

  // 5. Pin metadata is preserved
  assert(
    pin1?.headline === 'Quick Plush Pumpkin Pattern' &&
    pin1?.cta === 'GET THE FREE PATTERN →' &&
    pin1?.boardName === 'Crochet Home Decor & Autumn' &&
    pin1?.compositionType === 'single_hero',
    '5. Pin creative metadata (headline, CTA, board, composition) is preserved'
  );

  // 6. Analytics metrics are mapped correctly
  assert(
    pin1?.analyticsStatus === 'success' &&
    pin1?.metrics.impressions === 4850 &&
    pin1?.metrics.saves === 142 &&
    pin1?.metrics.outboundClicks === 165 &&
    pin1?.metrics.clickThroughRate === 0.034,
    '6. Analytics metrics (impressions, saves, outbound clicks, CTR) mapped correctly'
  );

  // 7. Daily breakdown is preserved
  assert(
    pin1?.dailyBreakdown.length === 2 &&
    pin1?.dailyBreakdown[0].date === '2026-09-18' &&
    pin1?.dailyBreakdown[0].metrics.IMPRESSION === 2400,
    '7. Daily breakdown array is preserved'
  );

  // 8. One failed Pin does not break other Pins
  const pin2 = result.pins.find(p => p.pinterestPinId === 'pin_222222');
  assert(
    pin2?.analyticsStatus === 'failed' &&
    pin2?.errorMessage?.includes('500 Internal Server Error') &&
    pin2?.metrics.impressions === 0,
    '8. Failed Pin is marked analyticsStatus="failed" without breaking other Pins'
  );

  // 9. Duplicate pinterestPinId values are deduplicated
  const countPin1Occurrences = result.pins.filter(p => p.pinterestPinId === 'pin_111111').length;
  assert(countPin1Occurrences === 1, '9. Duplicate pinterestPinId (present in Job 1 and Job 3) is deduplicated to exactly 1 call');
  assert(result.totalPinsTracked === 2, `Total unique pins tracked is 2 (got ${result.totalPinsTracked})`);

  // 10. Empty state returns an empty result
  const emptyResult = await getPinAnalytics('2026-09-01', '2026-09-22', {
    state: { version: 1, config: {} as any, lastRunDate: '', todayDiscoveredTopics: [], activeJobs: [], completedJobsHistory: [], updatedAt: '' },
    fetchFn: mockFetcher,
  });
  assert(
    emptyResult.success === true &&
    emptyResult.totalPinsTracked === 0 &&
    emptyResult.pins.length === 0,
    '10. Empty state returns clean empty result without errors'
  );

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runAggregationTests();
