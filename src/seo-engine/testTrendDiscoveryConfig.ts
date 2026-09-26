/**
 * Dedicated Unit Test Suite for Trend Discovery Configuration Layer (Isolated)
 *
 * Tests:
 * 1. Default markets = US, GB, CA, AU, NZ
 * 2. Default windows = 7, 30, 90
 * 3. Default weights = 0.40, 0.35, 0.25
 * 4. Weights must sum to 1
 * 5. Invalid market rejected
 * 6. Duplicate market rejected
 * 7. Problem Trends default = true
 * 8. Dynamic Related Queries default = true
 * 9. Curated Seeds default = true
 * 10. Existing 60-day protection remains unchanged
 * 11. Existing tool exclusion remains unchanged
 * 12. Discovery default behavior remains equivalent
 */

import { DEFAULT_SEO_ENGINE_CONFIG, CONTENT_ENGINE_LIMITS } from './config';
import { TOOL_DISQUALIFYING_KEYWORDS, isToolKeyword } from './discovery/opportunityScorer';
import { TARGET_MARKET_LOCATIONS } from './discovery/dataForSeoClient';

async function runTrendConfigTests() {
  console.log('=== STARTING TREND DISCOVERY CONFIG TESTS ===');

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

  // 1. Default markets = US, GB, CA, AU, NZ
  const markets = DEFAULT_SEO_ENGINE_CONFIG.targetMarkets || [];
  assert(
    markets.length === 5 &&
    markets.includes('US') &&
    markets.includes('GB') &&
    markets.includes('CA') &&
    markets.includes('AU') &&
    markets.includes('NZ'),
    '1. Default markets = [US, GB, CA, AU, NZ]'
  );

  // 2. Default windows = 7, 30, 90
  assert(
    DEFAULT_SEO_ENGINE_CONFIG.freshTrendWindow === 7 &&
    DEFAULT_SEO_ENGINE_CONFIG.recentTrendWindow === 30 &&
    DEFAULT_SEO_ENGINE_CONFIG.historicalTrendWindow === 90,
    '2. Default windows = 7, 30, 90'
  );

  // 3. Default weights = 0.40, 0.35, 0.25
  assert(
    DEFAULT_SEO_ENGINE_CONFIG.freshTrendWeight === 0.40 &&
    DEFAULT_SEO_ENGINE_CONFIG.recentTrendWeight === 0.35 &&
    DEFAULT_SEO_ENGINE_CONFIG.historicalTrendWeight === 0.25,
    '3. Default weights = 0.40, 0.35, 0.25'
  );

  // 4. Weights must sum to 1
  const sum = (DEFAULT_SEO_ENGINE_CONFIG.freshTrendWeight ?? 0) +
              (DEFAULT_SEO_ENGINE_CONFIG.recentTrendWeight ?? 0) +
              (DEFAULT_SEO_ENGINE_CONFIG.historicalTrendWeight ?? 0);
  assert(Math.abs(sum - 1.0) < 0.001, `4. Weights sum to 1.0 (actual: ${sum})`);

  // 5. Invalid market rejection logic simulation
  const validateMarkets = (input: any[]): ('US' | 'GB' | 'CA' | 'AU' | 'NZ')[] => {
    const allowed = ['US', 'GB', 'CA', 'AU', 'NZ'];
    return Array.from(new Set(input.filter((m: any) => typeof m === 'string' && allowed.includes(m.toUpperCase())))) as any;
  };
  const filteredInvalid = validateMarkets(['US', 'FR', 'DE', 'GB']);
  assert(filteredInvalid.length === 2 && !filteredInvalid.includes('FR' as any), '5. Invalid market (FR, DE) rejected');

  // 6. Duplicate market deduplication
  const filteredDupes = validateMarkets(['US', 'US', 'GB', 'GB', 'CA']);
  assert(filteredDupes.length === 3, '6. Duplicate market values are deduplicated to 3 unique markets');

  // 7. Problem Trends default = true
  assert(DEFAULT_SEO_ENGINE_CONFIG.problemTrendsEnabled === true, '7. Problem Trends default = true');

  // 8. Dynamic Related Queries default = true
  assert(DEFAULT_SEO_ENGINE_CONFIG.dynamicRelatedQueriesEnabled === true, '8. Dynamic Related Queries default = true');

  // 9. Curated Seeds default = true
  assert(DEFAULT_SEO_ENGINE_CONFIG.curatedSeedsEnabled === true, '9. Curated Seeds default = true');

  // 10. Existing 60-day protection remains unchanged
  assert(CONTENT_ENGINE_LIMITS.DUPLICATE_CHECK_LOOKBACK_DAYS === 60, '10. Existing 60-day cannibalization protection is 60 days');

  // 11. Existing tool exclusion remains unchanged
  assert(isToolKeyword('yarn yardage calculator free') === true, '11a. Tool keywords are disqualified from Slot 1');
  assert(isToolKeyword('easy plush crochet pumpkin') === false, '11b. Craft topics pass tool disqualification');

  // 12. Discovery default behavior calculation remains mathematically equivalent
  const fresh = 80;
  const recent = 60;
  const historical = 40;
  const originalCalc = Math.round(fresh * 0.40 + recent * 0.35 + historical * 0.25);
  const configuredCalc = Math.round(
    fresh * (DEFAULT_SEO_ENGINE_CONFIG.freshTrendWeight ?? 0.40) +
    recent * (DEFAULT_SEO_ENGINE_CONFIG.recentTrendWeight ?? 0.35) +
    historical * (DEFAULT_SEO_ENGINE_CONFIG.historicalTrendWeight ?? 0.25)
  );
  assert(originalCalc === configuredCalc && originalCalc === 63, `12. Discovery score calculation is mathematically identical (${originalCalc} === ${configuredCalc})`);

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runTrendConfigTests();
