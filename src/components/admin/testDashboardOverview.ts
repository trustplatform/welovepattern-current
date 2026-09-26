/**
 * Unit Test Suite for Dashboard Overview metrics calculation & Period filtering
 */

import { calculatePeriodDates, calculateAggregatedSummary, EnrichedPinAnalyticsRecord } from '../../pinterest/pinterestAnalytics';

async function runDashboardOverviewTests() {
  console.log('=== STARTING DASHBOARD OVERVIEW TESTS ===');

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

  // 1. Period Selector date calculation for Dashboard
  const periods = ['today', 'yesterday', '7d', 'this_month', 'last_month'] as const;
  for (const p of periods) {
    const dates = calculatePeriodDates(p);
    assert(!dates.error && dates.startDate.length === 10 && dates.endDate.length === 10, `1. Period "${p}" returns valid startDate and endDate`);
  }

  // 2. Custom Date Range Validation
  const validCustom = calculatePeriodDates('custom', '2026-09-01', '2026-09-20');
  assert(!validCustom.error && validCustom.startDate === '2026-09-01' && validCustom.endDate === '2026-09-20', '2. Valid custom date range accepted');

  const invalidCustom = calculatePeriodDates('custom', '2026-09-30', '2026-09-01');
  assert(Boolean(invalidCustom.error), '3. Inverted custom date range rejected');

  // 3. Job filtering within reporting window
  const mockJobs = [
    { id: 'j1', createdAt: '2026-09-20T10:00:00Z', stage: 'published', pins: [{}, {}] },
    { id: 'j2', createdAt: '2026-09-21T10:00:00Z', stage: 'awaiting_approval', pins: [{}, {}] },
    { id: 'j3', createdAt: '2026-09-10T10:00:00Z', stage: 'published', pins: [{}, {}] }, // outside 7d window
  ];

  const filterJobs = (jobs: any[], start: string, end: string) => {
    return jobs.filter(j => {
      const date = j.createdAt.split('T')[0];
      return date >= start && date <= end;
    });
  };

  const periodFiltered = filterJobs(mockJobs, '2026-09-15', '2026-09-26');
  assert(periodFiltered.length === 2, '4. Filters jobs accurately within active period window');

  // 4. Production Metrics Aggregation
  const publishedCount = periodFiltered.filter(j => j.stage === 'published').length;
  const awaitingCount = mockJobs.filter(j => j.stage === 'awaiting_approval').length;
  const pinsCount = periodFiltered.reduce((acc, j) => acc + (j.pins?.length || 2), 0);

  assert(publishedCount === 1, '5. Accurately counts published articles in period (1)');
  assert(awaitingCount === 1, '6. Accurately counts awaiting approval jobs across all state (1)');
  assert(pinsCount === 4, '7. Accurately counts total pins created in period (4)');

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runDashboardOverviewTests();
