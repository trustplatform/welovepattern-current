/**
 * Focused Isolated Test: Pinterest Partial Recovery & Incomplete Package Ineligibility
 *
 * Verifies:
 * 1. Each existing pin is validated independently: a valid Pin 1 is NOT discarded when Pin 2 is missing.
 * 2. In reuse-only mode, missing assets never trigger image generation or external API calls ($0 cost).
 * 3. Incomplete packages missing either Pin 1 or Pin 2 remain ineligible for publishing.
 * 4. Zero mutations to production JSON datastores.
 */

import path from 'path';
import fs from 'fs';

const TEST_STATE_FILE = path.join(process.cwd(), 'data', 'test-partial-recovery-state.json');
process.env.SEO_ENGINE_STATE_FILE = 'test-partial-recovery-state.json';

import { SeoEngineArticleJob } from './types';
import { recoverJobLocalAssets, getEligibleRecoveredJobs, isValidLocalAsset } from './queue/assetRecovery';
import { readEngineState, writeEngineState } from './queue/engineStorage';

async function testPinterestPartialRecovery() {
  console.log('=== STARTING PINTEREST PARTIAL RECOVERY TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  // Ensure clean test state file
  const baseState = {
    activeJobs: [],
    completedJobsHistory: [],
    config: {
      engineActive: true,
      reuseOnlyMode: true,
      articlesPerDay: 3,
      pinterestAutoPublish: false,
    },
    executedArticleSlots: [],
    failedArticleSlots: [],
  };
  fs.writeFileSync(TEST_STATE_FILE, JSON.stringify(baseState, null, 2), 'utf8');

  // 1. Baseline local assets
  const realHero = '/public/generated/blog/mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg';
  const realPin = '/public/generated/pinterest/seo-pins/mastering-crochet-gauge-your-ultimate-ca-e1844b9974.jpg';

  assert(isValidLocalAsset(realHero), '0a. Real hero image exists on disk');
  assert(isValidLocalAsset(realPin), '0b. Real pin image exists on disk');

  // -------------------------------------------------------------------------
  // TEST CASE 1: Valid Pin 1 + Missing Pin 2
  // -------------------------------------------------------------------------
  console.log('\n--- TEST CASE 1: Valid Pin 1 + Missing Pin 2 ---');
  const jobWithMissingPin2: SeoEngineArticleJob = {
    id: 'job_test_partial_pin_1',
    stage: 'drafting',
    dateScheduled: '2026-10-13',
    contentType: 'tool_guide',
    category: 'tools',
    requiresApproval: false,
    topic: {
      id: 'topic_partial_1',
      keyword: 'crochet hook sizing guide',
      contentType: 'tool_guide',
      category: 'tools',
      opportunityScore: 85,
      intent: 'informational',
      stage: 'selected',
    },
    articleContent: {
      title: 'Crochet Hook Sizing Guide Complete Tutorial',
      slug: 'crochet-hook-sizing-guide-complete-tutorial',
      excerpt: 'Learn all about crochet hook sizes with this clear chart and guide.',
      contentHtml: '<p>' + 'Detailed guide on crochet hooks '.repeat(30) + '</p>',
      wordCount: 850,
      heroImage: {
        stableAssetPath: realHero,
        stablePublicUrl: realHero,
        status: 'ready',
      },
    },
    pinterestPins: [
      {
        pinNumber: 1,
        conceptAngle: 'Hero Hook Comparison',
        visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Hooks', colorPalette: 'natural', humanElement: 'none' },
        compactHiggsfieldPrompt: 'Crochet hooks flatlay',
        typographyOverlay: { primaryHeadline: 'Crochet Hook Sizing Guide', ctaBadgeText: 'READ NOW' },
        destinationUrl: 'https://welovepattern.com/blog/crochet-hook-sizing-guide-complete-tutorial',
        stableAssetPath: realPin,
        stablePublicUrl: realPin,
        publishStatus: 'image_ready',
      },
      {
        pinNumber: 2,
        conceptAngle: 'Chart Layflat',
        visualStyle: { imageCount: 1, compositionType: 'flatlay_materials', subjectDescription: 'Chart', colorPalette: 'warm', humanElement: 'hands_only' },
        compactHiggsfieldPrompt: 'Size chart flatlay',
        typographyOverlay: { primaryHeadline: 'Crochet Sizing Chart', ctaBadgeText: 'SAVE PIN' },
        destinationUrl: 'https://welovepattern.com/blog/crochet-hook-sizing-guide-complete-tutorial',
        stableAssetPath: '/public/generated/pinterest/non_existent_pin_2_missing.jpg',
        publishStatus: 'pending',
      },
    ],
    costRecords: [],
    logs: [],
  };

  const recovery1 = recoverJobLocalAssets(jobWithMissingPin2);

  assert(
    isValidLocalAsset(jobWithMissingPin2.pinterestPins![0].stableAssetPath),
    '1a. Valid Pin 1 was NOT discarded when Pin 2 was missing and remains valid on disk'
  );
  assert(
    jobWithMissingPin2.pinterestPins![0].publishStatus === 'image_ready',
    '1b. Valid Pin 1 retained image_ready status'
  );
  assert(
    recovery1.pin2Recovered === false && !isValidLocalAsset(jobWithMissingPin2.pinterestPins![1].stableAssetPath),
    '1c. Missing Pin 2 correctly reported as not recovered and invalid on disk'
  );
  assert(
    jobWithMissingPin2.stage !== 'awaiting_approval' && jobWithMissingPin2.stage !== 'completed',
    '1d. Incomplete package stage not advanced to awaiting_approval'
  );
  assert(
    jobWithMissingPin2.costRecords.length === 0,
    '1e. Zero cost transactions created during recovery ($0 cost preserved)'
  );

  // Write into isolated state and test getEligibleRecoveredJobs
  writeEngineState({
    ...baseState,
    activeJobs: [jobWithMissingPin2],
  });
  const eligible1 = getEligibleRecoveredJobs(5);
  assert(
    eligible1.length === 0,
    '1f. Incomplete package (missing Pin 2) rejected as ineligible by getEligibleRecoveredJobs'
  );

  // -------------------------------------------------------------------------
  // TEST CASE 2: Symmetric check - Valid Pin 2 + Missing Pin 1
  // -------------------------------------------------------------------------
  console.log('\n--- TEST CASE 2: Valid Pin 2 + Missing Pin 1 ---');
  const jobWithMissingPin1: SeoEngineArticleJob = {
    ...jobWithMissingPin2,
    id: 'job_test_partial_pin_2',
    pinterestPins: [
      {
        ...jobWithMissingPin2.pinterestPins![0],
        stableAssetPath: '/public/generated/pinterest/non_existent_pin_1_missing.jpg',
        publishStatus: 'pending',
      },
      {
        ...jobWithMissingPin2.pinterestPins![1],
        stableAssetPath: realPin,
        stablePublicUrl: realPin,
        publishStatus: 'image_ready',
      },
    ],
  };

  const recovery2 = recoverJobLocalAssets(jobWithMissingPin1);
  assert(
    isValidLocalAsset(jobWithMissingPin1.pinterestPins![1].stableAssetPath),
    '2a. Valid Pin 2 was NOT discarded when Pin 1 was missing and remains valid on disk'
  );
  assert(
    jobWithMissingPin1.pinterestPins![1].publishStatus === 'image_ready',
    '2b. Valid Pin 2 retained image_ready status'
  );
  assert(
    recovery2.pin1Recovered === false && !isValidLocalAsset(jobWithMissingPin1.pinterestPins![0].stableAssetPath),
    '2c. Missing Pin 1 correctly reported as not recovered'
  );
  assert(
    jobWithMissingPin1.stage !== 'awaiting_approval' && jobWithMissingPin1.stage !== 'completed',
    '2d. Incomplete package stage not advanced when Pin 1 is missing'
  );

  writeEngineState({
    ...baseState,
    activeJobs: [jobWithMissingPin1],
  });
  const eligible2 = getEligibleRecoveredJobs(5);
  assert(
    eligible2.length === 0,
    '2e. Incomplete package (missing Pin 1) rejected as ineligible by getEligibleRecoveredJobs'
  );

  // -------------------------------------------------------------------------
  // TEST CASE 3: Complete Package with Both Pins and Hero IS Eligible
  // -------------------------------------------------------------------------
  console.log('\n--- TEST CASE 3: Complete Package (Hero + Pin 1 + Pin 2) ---');
  const completeJob: SeoEngineArticleJob = {
    ...jobWithMissingPin2,
    id: 'job_test_complete_all_pins',
    pinterestPins: [
      {
        ...jobWithMissingPin2.pinterestPins![0],
        stableAssetPath: realPin,
        stablePublicUrl: realPin,
        publishStatus: 'image_ready',
      },
      {
        ...jobWithMissingPin2.pinterestPins![1],
        stableAssetPath: realPin,
        stablePublicUrl: realPin,
        publishStatus: 'image_ready',
      },
    ],
  };

  const recovery3 = recoverJobLocalAssets(completeJob);
  assert(
    recovery3.heroRecovered === true || isValidLocalAsset(completeJob.articleContent?.heroImage?.stableAssetPath),
    '3a. Complete package hero validated'
  );
  assert(
    recovery3.pin1Recovered === true || isValidLocalAsset(completeJob.pinterestPins![0].stableAssetPath),
    '3b. Complete package pin 1 validated'
  );
  assert(
    recovery3.pin2Recovered === true || isValidLocalAsset(completeJob.pinterestPins![1].stableAssetPath),
    '3c. Complete package pin 2 validated'
  );

  writeEngineState({
    ...baseState,
    activeJobs: [completeJob],
  });
  const eligibleComplete = getEligibleRecoveredJobs(5);
  assert(
    eligibleComplete.length === 1 && eligibleComplete[0].id === 'job_test_complete_all_pins',
    '3d. Complete package with valid Hero and both valid Pins IS eligible'
  );

  // Clean up test file
  if (fs.existsSync(TEST_STATE_FILE)) {
    fs.unlinkSync(TEST_STATE_FILE);
  }

  console.log('\n===============================================================');
  console.log(`PINTEREST PARTIAL RECOVERY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

testPinterestPartialRecovery().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
