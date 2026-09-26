/**
 * Isolated unit test for fetchPinAnalytics()
 */

import { fetchPinAnalytics, DEFAULT_PINTEREST_PIN_METRICS } from '../pinterest/pinterestApi';

async function runTest() {
  console.log('=== STARTING FETCH_PIN_ANALYTICS ISOLATED TEST ===');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string) {
    if (cond) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // Test 1: Missing / invalid Pin ID
  const invalidIdRes = await fetchPinAnalytics('', '2026-09-01', '2026-09-20');
  assert(!invalidIdRes.success && invalidIdRes.error?.includes('Pin ID is required'), 'Rejects empty Pin ID');

  // Test 2: Invalid date format
  const invalidDateRes = await fetchPinAnalytics('123456789', '2026/09/01', '2026-09-20');
  assert(!invalidDateRes.success && invalidDateRes.error?.includes('Invalid date format'), 'Rejects invalid date format');

  // Test 3: Start date after end date
  const invertedDateRes = await fetchPinAnalytics('123456789', '2026-09-30', '2026-09-01');
  assert(!invertedDateRes.success && invertedDateRes.error?.includes('cannot be after endDate'), 'Rejects startDate > endDate');

  // Test 4: Mocked fetch verification
  const originalFetch = global.fetch;
  const mockApiResponse = {
    all: {
      summary_metrics: {
        IMPRESSION: 1250,
        SAVE: 45,
        PIN_CLICK: 85,
        OUTBOUND_CLICK: 62,
        ENGAGEMENT: 192,
        CLOSEUP: 30
      },
      daily_metrics: [
        {
          date: '2026-09-15',
          metrics: {
            IMPRESSION: 600,
            SAVE: 20,
            PIN_CLICK: 40,
            OUTBOUND_CLICK: 30
          }
        },
        {
          date: '2026-09-16',
          metrics: {
            IMPRESSION: 650,
            SAVE: 25,
            PIN_CLICK: 45,
            OUTBOUND_CLICK: 32
          }
        }
      ]
    }
  };

  // Mock global.fetch
  global.fetch = async (url: any, init?: any) => {
    const urlStr = String(url);
    if (urlStr.includes('/v5/pins/test_pin_98765/analytics')) {
      return {
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
        text: async () => JSON.stringify(mockApiResponse),
      } as any;
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
      text: async () => 'Not found',
    } as any;
  };

  try {
    // Enable sandbox mode temporarily so it doesn't need live OAuth files during mock test
    process.env.PINTEREST_USE_SANDBOX = 'true';
    process.env.PINTEREST_SANDBOX_ACCESS_TOKEN = 'mock_sandbox_token_abc123';

    const result = await fetchPinAnalytics('test_pin_98765', '2026-09-01', '2026-09-20');

    assert(result.success === true, 'Returns success: true for valid mocked response');
    assert(result.pinId === 'test_pin_98765', 'Echoes correct pinId');
    assert(result.summary?.impressions === 1250, 'Extracts impressions: 1250');
    assert(result.summary?.saves === 45, 'Extracts saves: 45');
    assert(result.summary?.pinClicks === 85, 'Extracts pin clicks: 85');
    assert(result.summary?.outboundClicks === 62, 'Extracts outbound clicks: 62');
    assert(result.summary?.engagements === 192, 'Extracts engagements: 192');
    assert(result.summary?.closeups === 30, 'Extracts closeups: 30');
    assert(result.summary?.clickThroughRate === 0.0496, `Calculates CTR correctly (0.0496): ${result.summary?.clickThroughRate}`);
    assert(result.dailyBreakdown?.length === 2, 'Extracts 2 daily breakdown records');
    assert(result.dailyBreakdown?.[0].date === '2026-09-15', 'Preserves daily record date');
  } finally {
    // Restore global fetch and env
    global.fetch = originalFetch;
    delete process.env.PINTEREST_USE_SANDBOX;
    delete process.env.PINTEREST_SANDBOX_ACCESS_TOKEN;
  }

  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

runTest();
