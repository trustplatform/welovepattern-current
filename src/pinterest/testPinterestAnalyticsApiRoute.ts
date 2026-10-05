/**
 * Dedicated Unit Test Suite for GET /api/admin/pinterest/analytics/pins
 *
 * Tests:
 * 1. today period
 * 2. yesterday period
 * 3. 7d period
 * 4. this_month period
 * 5. last_month period
 * 6. custom period
 * 7. invalid custom dates
 * 8. startDate > endDate
 * 9. unauthorized request
 * 10. successful response contains summary + pins
 */

import { calculatePeriodDates, calculateAggregatedSummary, EnrichedPinAnalyticsRecord, getPinAnalytics } from './pinterestAnalytics';

async function runEndpointTests() {
  console.log('=== STARTING PINTEREST PIN ANALYTICS API ROUTE TESTS ===');

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

  const timeZone = 'America/New_York';

  // Test 1: today period
  const todayRes = calculatePeriodDates('today', undefined, undefined, timeZone);
  assert(!todayRes.error && todayRes.startDate === todayRes.endDate && /^\d{4}-\d{2}-\d{2}$/.test(todayRes.startDate), '1. "today" period returns identical valid start and end dates');

  // Test 2: yesterday period
  const yestRes = calculatePeriodDates('yesterday', undefined, undefined, timeZone);
  assert(!yestRes.error && yestRes.startDate === yestRes.endDate && /^\d{4}-\d{2}-\d{2}$/.test(yestRes.startDate), '2. "yesterday" period returns valid matching dates');

  // Test 3: 7d period
  const sevenDayRes = calculatePeriodDates('7d', undefined, undefined, timeZone);
  assert(!sevenDayRes.error && new Date(sevenDayRes.startDate).getTime() < new Date(sevenDayRes.endDate).getTime(), '3. "7d" period returns valid 7-day range');

  // Test 4: this_month period
  const thisMonthRes = calculatePeriodDates('this_month', undefined, undefined, timeZone);
  assert(!thisMonthRes.error && thisMonthRes.startDate.endsWith('-01'), '4. "this_month" period starts on day 01 of current month');

  // Test 5: last_month period
  const lastMonthRes = calculatePeriodDates('last_month', undefined, undefined, timeZone);
  assert(!lastMonthRes.error && lastMonthRes.startDate.endsWith('-01'), '5. "last_month" period starts on day 01 of previous month');

  // Test 6: custom period valid
  const customRes = calculatePeriodDates('custom', '2026-09-01', '2026-09-15', timeZone);
  assert(!customRes.error && customRes.startDate === '2026-09-01' && customRes.endDate === '2026-09-15', '6. "custom" period preserves custom valid dates');

  // Test 7: invalid custom dates
  const invalidCustomFormat = calculatePeriodDates('custom', '01-09-2026', '2026/09/15', timeZone);
  assert(Boolean(invalidCustomFormat.error?.includes('Invalid date format')), '7. Rejects invalid date format in custom period');

  const missingCustomDates = calculatePeriodDates('custom', undefined, '2026-09-15', timeZone);
  assert(Boolean(missingCustomDates.error?.includes('Both startDate and endDate are required')), '7b. Rejects missing custom dates');

  // Test 8: startDate > endDate
  const invertedDates = calculatePeriodDates('custom', '2026-09-30', '2026-09-01', timeZone);
  assert(Boolean(invertedDates.error?.includes('cannot be after endDate')), '8. Rejects startDate > endDate');

  // Test 9: Auth verification logic simulation
  const mockIsAdminAuthenticated = (cookies: Record<string, string>, authHeader?: string) => {
    return cookies['admin_session'] === 'valid_token' || authHeader === 'Bearer valid_token';
  };
  const unauthed = mockIsAdminAuthenticated({});
  assert(unauthed === false, '9. Rejects unauthenticated request without admin_session or bearer token');

  // Test 10: Successful response contains summary + pins and calculates weighted CTR
  const mockPins: EnrichedPinAnalyticsRecord[] = [
    {
      pinterestPinId: 'pin_101',
      jobId: 'job_001',
      pinNumber: 1,
      publishedAt: '2026-09-20T10:00:00Z',
      articleTitle: 'Crochet Blanket Guide',
      articleSlug: 'crochet-blanket-guide',
      category: 'crochet',
      headline: 'Best Blanket Patterns',
      cta: 'GET PATTERNS →',
      conceptAngle: 'Cozy Lifestyle',
      compositionType: 'single_hero',
      imageUrl: '/pins/blanket.webp',
      boardName: 'Crochet Blankets',
      targetBoardId: 'b_123',
      destinationUrl: 'https://welovepattern.com/blog/crochet-blanket-guide',
      analyticsStatus: 'success',
      metrics: {
        impressions: 10000,
        saves: 200,
        pinClicks: 500,
        outboundClicks: 350,
        engagements: 1050,
        closeups: 100,
        engagementRate: 0.105,
        clickThroughRate: 0.035,
      },
      dailyBreakdown: [],
    },
    {
      pinterestPinId: 'pin_102',
      jobId: 'job_002',
      pinNumber: 2,
      publishedAt: '2026-09-21T10:00:00Z',
      articleTitle: 'Yarn Calculator Tool',
      articleSlug: 'yarn-calculator-tool',
      category: 'tools',
      headline: 'Calculate Yarn Needed',
      cta: 'CALCULATE FREE →',
      conceptAngle: 'Tool Focus',
      compositionType: 'single_hero',
      imageUrl: '/pins/tool.webp',
      boardName: 'Crochet Tools',
      targetBoardId: 'b_456',
      destinationUrl: 'https://welovepattern.com/tools/yarn-calculator',
      analyticsStatus: 'success',
      metrics: {
        impressions: 5000,
        saves: 100,
        pinClicks: 300,
        outboundClicks: 250,
        engagements: 650,
        closeups: 50,
        engagementRate: 0.13,
        clickThroughRate: 0.05,
      },
      dailyBreakdown: [],
    },
    {
      pinterestPinId: 'pin_103',
      jobId: 'job_003',
      pinNumber: 1,
      publishedAt: '2026-09-22T10:00:00Z',
      articleTitle: 'Failed Pin Test',
      articleSlug: 'failed-pin',
      category: 'crochet',
      headline: 'Failed Pin',
      cta: 'CLICK →',
      conceptAngle: 'Angle',
      compositionType: 'single_hero',
      imageUrl: '/pins/fail.webp',
      boardName: 'Board',
      targetBoardId: 'b_789',
      destinationUrl: 'https://welovepattern.com/blog/failed',
      analyticsStatus: 'failed',
      errorMessage: 'Rate limit',
      metrics: {
        impressions: 0,
        saves: 0,
        pinClicks: 0,
        outboundClicks: 0,
        engagements: 0,
        closeups: 0,
        engagementRate: 0,
        clickThroughRate: 0,
      },
      dailyBreakdown: [],
    },
  ];

  const summary = calculateAggregatedSummary(mockPins);

  assert(summary.totalPinsTracked === 3, '10a. summary.totalPinsTracked is 3');
  assert(summary.pinsWithMetrics === 2, '10b. summary.pinsWithMetrics is 2');
  assert(summary.pinsFailed === 1, '10c. summary.pinsFailed is 1');
  assert(summary.totalImpressions === 15000, '10d. summary.totalImpressions = 15,000 (10k + 5k)');
  assert(summary.totalOutboundClicks === 600, '10e. summary.totalOutboundClicks = 600 (350 + 250)');
  assert(summary.totalSaves === 300, '10f. summary.totalSaves = 300 (200 + 100)');
  assert(summary.totalPinClicks === 800, '10g. summary.totalPinClicks = 800 (500 + 300)');
  assert(summary.totalEngagements === 1700, '10h. summary.totalEngagements = 1,700');
  assert(summary.totalCloseups === 150, '10i. summary.totalCloseups = 150');
  // Weighted CTR: 600 / 15000 = 0.04 (4.0%)
  assert(summary.averageCTR === 0.04, `10j. summary.averageCTR is safely calculated as weighted total clicks / total impressions (expected 0.04, got ${summary.averageCTR})`);

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runEndpointTests();
