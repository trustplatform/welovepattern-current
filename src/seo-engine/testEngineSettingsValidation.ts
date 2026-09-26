/**
 * Unit Test Suite for Engine Settings Admin validation and config payload formatting
 */

import { DEFAULT_SEO_ENGINE_CONFIG } from './config';
import { SeoEngineConfig } from './types';

async function runConfigValidationTest() {
  console.log('=== STARTING SEO ENGINE SETTINGS VALIDATION TESTS ===');

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

  // 1. Default config preserves all safety invariants and active production toggles
  assert(DEFAULT_SEO_ENGINE_CONFIG.requiresApproval === false, '1. Default requiresApproval is false');
  assert(DEFAULT_SEO_ENGINE_CONFIG.autoPublish === true, '2. Default autoPublish is true');
  assert(DEFAULT_SEO_ENGINE_CONFIG.autoPublishPinterest === true, '3. Default autoPublishPinterest is true');
  assert(DEFAULT_SEO_ENGINE_CONFIG.articlesPerDay === 2, '4. Default articlesPerDay is 2');
  assert(DEFAULT_SEO_ENGINE_CONFIG.minWordCount === 800, '5. Default minWordCount is 800');
  assert(DEFAULT_SEO_ENGINE_CONFIG.maxWordCount === 2000, '6. Default maxWordCount is 2000');
  assert(DEFAULT_SEO_ENGINE_CONFIG.dailyCostLimitUsd === 5.0, '7. Default dailyCostLimitUsd is $5.00');
  assert(DEFAULT_SEO_ENGINE_CONFIG.perJobCostLimitUsd === 1.5, '8. Default perJobCostLimitUsd is $1.50');
  assert(DEFAULT_SEO_ENGINE_CONFIG.timezone === 'America/New_York', '9. Default timezone is America/New_York');

  // 2. Client-side form validation simulation
  const validateForm = (data: Partial<SeoEngineConfig>): { valid: boolean; error?: string } => {
    const minWords = Number(data.minWordCount);
    const maxWords = Number(data.maxWordCount);
    if (isNaN(minWords) || minWords < 300) {
      return { valid: false, error: 'Minimum Word Count must be at least 300 words.' };
    }
    if (isNaN(maxWords) || maxWords < minWords) {
      return { valid: false, error: 'Maximum Word Count must be >= Minimum Word Count.' };
    }
    const dailySpend = Number(data.dailyCostLimitUsd);
    if (isNaN(dailySpend) || dailySpend <= 0) {
      return { valid: false, error: 'Daily spend limit must be a positive number.' };
    }
    const opp = Number(data.minOpportunityScore);
    if (isNaN(opp) || opp < 0 || opp > 100) {
      return { valid: false, error: 'Opportunity Score must be 0-100.' };
    }
    return { valid: true };
  };

  const validTest = validateForm(DEFAULT_SEO_ENGINE_CONFIG);
  assert(validTest.valid === true, '10. Default configuration passes form validation');

  const invalidWordCount = validateForm({ ...DEFAULT_SEO_ENGINE_CONFIG, minWordCount: 1500, maxWordCount: 1000 });
  assert(!invalidWordCount.valid && invalidWordCount.error?.includes('Maximum Word Count must be >='), '11. Rejects minWordCount > maxWordCount');

  const invalidSpend = validateForm({ ...DEFAULT_SEO_ENGINE_CONFIG, dailyCostLimitUsd: -5 });
  assert(!invalidSpend.valid && invalidSpend.error?.includes('positive number'), '12. Rejects negative daily spend limit');

  const invalidScore = validateForm({ ...DEFAULT_SEO_ENGINE_CONFIG, minOpportunityScore: 120 });
  assert(!invalidScore.valid && invalidScore.error?.includes('0-100'), '13. Rejects opportunity score out of 0-100 range');

  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

runConfigValidationTest();
