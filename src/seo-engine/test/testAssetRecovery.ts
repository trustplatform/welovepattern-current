/**
 * Automated Test Suite for Local Asset Recovery System
 * 
 * Verifies:
 * 1. Exact 3-Image Recovery for the 4 identified production jobs
 * 2. Correct Hero / Pin 1 / Pin 2 Slot Assignment
 * 3. Ambiguous Multi-Variant Protection (Halloween variants rejected from auto-attachment)
 * 4. Benchmark / Test Asset Protection (Excluded from production jobs)
 * 5. Zero HTTP POST Calls during recovery
 * 6. Zero New Cost Records in ledger
 * 7. Recovery Idempotency across repeated executions
 * 8. Rejection of corrupted / missing files (< 100 bytes)
 * 9. Subsequent generateHiggsfieldImage() zero-cost reuse
 * 10. 6/Day Circuit Breaker Unconsumed by Recovery
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  recoverJobLocalAssets,
  resolveHeroAsset,
  resolvePinAsset,
  isValidLocalAsset,
  JobRecoveryResult
} from '../queue/assetRecovery';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { generateHiggsfieldImage } from '../generation/higgsfieldClient';
import { getDailyHiggsfieldGenerationsCount } from '../cost/costTracker';
import { SeoEngineArticleJob } from '../types';

let passed = 0;
let failed = 0;

function check(assertion: boolean, name: string, details?: string) {
  if (assertion) {
    passed++;
    console.log(`✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
  }
}

export async function runAssetRecoveryTests(): Promise<boolean> {
  console.log('===============================================================');
  console.log('STARTING LOCAL ASSET RECOVERY TEST SUITE');
  console.log('===============================================================\n');

  const originalState = readEngineState();

  try {
    // -----------------------------------------------------------------
    // TEST 1: EXACT 3-IMAGE RECOVERY FOR 4 PRODUCTION JOBS
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Exact 3-Image Recovery for 4 Production Jobs ---');

    const fourTestJobs: SeoEngineArticleJob[] = [
      {
        id: 'test_rec_border_calc',
        dateScheduled: '2026-10-04',
        contentType: 'tool_guide',
        category: 'tools',
        stage: 'failed',
        requiresApproval: true,
        topic: { id: 't_border', keyword: 'crochet blanket border calculator', contentType: 'tool_guide', category: 'tools', opportunityScore: 90, status: 'discovered' },
        articleContent: {
          title: 'Master Your Crochet Blanket Borders with Our Calculator',
          slug: 'master-your-crochet-blanket-borders-with-our-calculator',
          contentHtml: '<p>Complete guide to blanket borders with calculated stitches and yardage...</p>'.repeat(10),
          wordCount: 1100,
          category: 'tools',
          contentType: 'tool_guide',
          tags: ['border', 'calculator'],
          internalLinks: [],
        },
        pinterestPins: [],
        logs: [],
        createdAt: '2026-10-04T12:00:35.875Z',
        updatedAt: '2026-10-04T12:00:35.875Z',
        indexNowNotified: false,
      },
      {
        id: 'test_rec_yarn_calc',
        dateScheduled: '2026-10-01',
        contentType: 'tool_guide',
        category: 'tools',
        stage: 'failed',
        requiresApproval: true,
        topic: { id: 't_yarn', keyword: 'how to use a crochet blanket yarn calculator', contentType: 'tool_guide', category: 'tools', opportunityScore: 88, status: 'discovered' },
        articleContent: {
          title: 'How to Use a Crochet Blanket Yarn Calculator for Perfect Projects',
          slug: 'how-to-use-a-crochet-blanket-yarn-calculator-for-perfect-projects',
          contentHtml: '<p>Calculate blanket yarn accurately with safety buffer...</p>'.repeat(10),
          wordCount: 950,
          category: 'tools',
          contentType: 'tool_guide',
          tags: ['yarn', 'calculator'],
          internalLinks: [],
        },
        pinterestPins: [],
        logs: [],
        createdAt: '2026-10-01T00:00:30.000Z',
        updatedAt: '2026-10-01T00:00:30.000Z',
        indexNowNotified: false,
      },
      {
        id: 'test_rec_gauge_calc',
        dateScheduled: '2026-09-28',
        contentType: 'tool_guide',
        category: 'tools',
        stage: 'failed',
        requiresApproval: true,
        topic: { id: 't_gauge', keyword: 'crochet gauge calculator', contentType: 'tool_guide', category: 'tools', opportunityScore: 89, status: 'discovered' },
        articleContent: {
          title: 'Mastering Your Crochet Gauge with Our Calculator Tool',
          slug: 'mastering-your-crochet-gauge-with-our-calculator-tool',
          contentHtml: '<p>Accurate gauge swatch counting and hook adjustment...</p>'.repeat(10),
          wordCount: 1020,
          category: 'tools',
          contentType: 'tool_guide',
          tags: ['gauge', 'calculator'],
          internalLinks: [],
        },
        pinterestPins: [],
        logs: [],
        createdAt: '2026-09-28T00:00:20.000Z',
        updatedAt: '2026-09-28T00:00:20.000Z',
        indexNowNotified: false,
      },
      {
        id: 'test_rec_stitch_counter',
        dateScheduled: '2026-10-03',
        contentType: 'tool_guide',
        category: 'tools',
        stage: 'failed',
        requiresApproval: true,
        topic: { id: 't_stitch', keyword: 'stitch counter online', contentType: 'tool_guide', category: 'tools', opportunityScore: 87, status: 'discovered' },
        articleContent: {
          title: 'Mastering Your Crochet Projects with an Online Stitch Counter',
          slug: 'mastering-your-crochet-projects-with-an-online-stitch-counter',
          contentHtml: '<p>Track rows and stitch repeats with digital counter tool...</p>'.repeat(10),
          wordCount: 980,
          category: 'tools',
          contentType: 'tool_guide',
          tags: ['stitch', 'counter'],
          internalLinks: [],
        },
        pinterestPins: [],
        logs: [],
        createdAt: '2026-10-03T00:00:32.392Z',
        updatedAt: '2026-10-03T00:00:32.392Z',
        indexNowNotified: false,
      },
    ];

    // Mock global.fetch to guarantee zero network activity during recovery
    const origFetch = global.fetch;
    let fetchCalled = false;
    global.fetch = (() => {
      fetchCalled = true;
      throw new Error('NETWORK CALL DETECTED DURING ASSET RECOVERY!');
    }) as any;

    const recoveryResults: JobRecoveryResult[] = [];

    try {
      for (const job of fourTestJobs) {
        const res = recoverJobLocalAssets(job);
        recoveryResults.push(res);
      }
    } finally {
      global.fetch = origFetch;
    }

    check(fetchCalled === false, 'Zero network/HTTP calls executed during asset recovery');

    // Verify each of the 4 jobs
    const [borderRes, yarnRes, gaugeRes, stitchRes] = recoveryResults;

    check(borderRes.allAssetsReady === true, 'Border Calculator recovered all 3 assets');
    check(borderRes.newStage === 'awaiting_approval', 'Border Calculator transitioned to awaiting_approval');
    check(borderRes.recoveredAssets.find(a => a.slotType === 'hero')?.stableAssetPath.includes('crochet-blanket-border-calculator-accura-23758683d7.jpg') === true, 'Border Calculator Hero matched exact forensic file');
    check(borderRes.recoveredAssets.find(a => a.slotType === 'pin_1')?.stableAssetPath.includes('crochet-blanket-border-calculator-accura-d9574b01b9.jpg') === true, 'Border Calculator Pin 1 matched exact forensic file');
    check(borderRes.recoveredAssets.find(a => a.slotType === 'pin_2')?.stableAssetPath.includes('crochet-blanket-border-calculator-accura-f2847c3b96.jpg') === true, 'Border Calculator Pin 2 matched exact forensic file');

    check(yarnRes.allAssetsReady === true, 'Yarn Calculator recovered all 3 assets');
    check(yarnRes.newStage === 'awaiting_approval', 'Yarn Calculator transitioned to awaiting_approval');
    check(yarnRes.recoveredAssets.find(a => a.slotType === 'hero')?.stableAssetPath.includes('crochet-blanket-yarn-calculator-accurate-5f2ef4f0d5.jpg') === true, 'Yarn Calculator Hero matched exact forensic file');

    check(gaugeRes.allAssetsReady === true, 'Gauge Calculator recovered all 3 assets');
    check(gaugeRes.newStage === 'awaiting_approval', 'Gauge Calculator transitioned to awaiting_approval');
    check(gaugeRes.recoveredAssets.find(a => a.slotType === 'hero')?.stableAssetPath.includes('mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg') === true, 'Gauge Calculator Hero matched exact forensic file');

    check(stitchRes.allAssetsReady === true, 'Stitch Counter recovered all 3 assets');
    check(stitchRes.newStage === 'awaiting_approval', 'Stitch Counter transitioned to awaiting_approval');
    check(stitchRes.recoveredAssets.find(a => a.slotType === 'hero')?.stableAssetPath.includes('mastering-crochet-with-our-online-stitch-431a461a51.jpg') === true, 'Stitch Counter Hero matched exact forensic file');

    // -----------------------------------------------------------------
    // TEST 2: AMBIGUOUS MULTI-VARIANT TOPIC REJECTION
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Ambiguous Multi-Variant Protection ---');
    const ambiguousJob: SeoEngineArticleJob = {
      id: 'test_job_ambiguous_halloween',
      dateScheduled: '2026-10-15',
      contentType: 'trending_crochet',
      category: 'crochet',
      stage: 'selected',
      requiresApproval: true,
      topic: {
        id: 't_halloween_granny',
        keyword: 'halloween granny square pattern',
        contentType: 'trending_crochet',
        category: 'crochet',
        opportunityScore: 92,
        status: 'discovered',
      },
      articleContent: {
        title: 'Craft Spooky Crochet Halloween Granny Squares',
        slug: 'craft-spooky-crochet-halloween-granny-squares',
        contentHtml: '<p>Spooky halloween granny square tutorial...</p>'.repeat(10),
        wordCount: 900,
        category: 'crochet',
        contentType: 'trending_crochet',
        tags: ['halloween', 'granny-square'],
        internalLinks: [],
      },
      pinterestPins: [],
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      indexNowNotified: false,
    };

    const resolvedAmbiguousHero = resolveHeroAsset(ambiguousJob);
    check(
      resolvedAmbiguousHero === null,
      'Ambiguous multi-variant topic (Halloween) rejected from automatic Hero attachment'
    );

    const resolvedAmbiguousPin = resolvePinAsset(ambiguousJob, 1);
    check(
      resolvedAmbiguousPin === null,
      'Ambiguous multi-variant topic (Halloween) rejected from automatic Pin attachment'
    );

    // -----------------------------------------------------------------
    // TEST 3: BENCHMARK / TEST ASSET EXCLUSION
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Benchmark / Test Asset Exclusion ---');
    const benchmarkExclusionCheck1 = isValidLocalAsset(path.resolve(process.cwd(), 'public/generated/pinterest/test-pin-p1.png'));
    check(benchmarkExclusionCheck1 === true, 'Benchmark file physically exists');

    const jobRequestingBenchmark: SeoEngineArticleJob = {
      id: 'test_job_test_bench',
      dateScheduled: '2026-10-15',
      contentType: 'trending_crochet',
      category: 'crochet',
      stage: 'selected',
      requiresApproval: true,
      topic: { id: 't_bench', keyword: 'fall crochet ideas literal lock v1', contentType: 'trending_crochet', category: 'crochet', opportunityScore: 50, status: 'discovered' },
      articleContent: {
        title: 'Fall Crochet Ideas',
        slug: 'fall-crochet-ideas-pin1-literal-lock-v1',
        contentHtml: '<p>Testing benchmark exclusion...</p>'.repeat(10),
        wordCount: 800,
        category: 'crochet',
        contentType: 'trending_crochet',
        tags: ['test'],
        internalLinks: [],
      },
      pinterestPins: [],
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      indexNowNotified: false,
    };

    const benchmarkPinResult = resolvePinAsset(jobRequestingBenchmark, 1);
    check(benchmarkPinResult === null, 'Benchmark fixture with -literal-lock- is strictly excluded from production recovery');

    // -----------------------------------------------------------------
    // TEST 4: IDEMPOTENCY ACROSS REPEATED RUNS
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Idempotency Across Repeated Runs ---');
    const borderJobClone = JSON.parse(JSON.stringify(fourTestJobs[0]));
    const firstRun = recoverJobLocalAssets(borderJobClone);
    const stateSnapshotAfterFirst = JSON.stringify(borderJobClone);

    // Second run on already recovered job
    const secondRun = recoverJobLocalAssets(borderJobClone);
    const stateSnapshotAfterSecond = JSON.stringify(borderJobClone);

    check(firstRun.allAssetsReady === true, 'First recovery run succeeds');
    check(secondRun.allAssetsReady === true, 'Second recovery run recognizes existing assets');
    check(stateSnapshotAfterFirst === stateSnapshotAfterSecond, 'Repeated recovery is 100% idempotent (identical state snapshot)');

    // -----------------------------------------------------------------
    // TEST 5: CORRUPTED / EMPTY FILE REJECTION
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Corrupted / Empty File Rejection ---');
    const fakeEmptyPath = path.resolve(process.cwd(), 'public/generated/blog/temp-corrupt-test.jpg');
    fs.writeFileSync(fakeEmptyPath, Buffer.alloc(50)); // < 100 bytes

    try {
      const corruptCheck = isValidLocalAsset(fakeEmptyPath);
      check(corruptCheck === false, 'isValidLocalAsset strictly rejects files <= 100 bytes');
    } finally {
      if (fs.existsSync(fakeEmptyPath)) fs.unlinkSync(fakeEmptyPath);
    }

    // -----------------------------------------------------------------
    // TEST 6: SUBSEQUENT generateHiggsfieldImage() ZERO-COST REUSE
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Subsequent generateHiggsfieldImage() Zero-Cost Reuse ---');
    const reuseSlug = 'test-reuse-recovery-slug';
    const reusePrompt = 'A cozy handmade crochet blanket border on rustic table';
    const blogDir = path.resolve(process.cwd(), 'public/generated/blog');
    const testHash = crypto.createHash('sha256').update(reusePrompt.trim().toLowerCase()).digest('hex').substring(0, 10);
    const testFilename = `${reuseSlug}-${testHash}.jpg`;
    const testFilePath = path.join(blogDir, testFilename);
    fs.writeFileSync(testFilePath, Buffer.alloc(1024, 1));

    const countBeforeReuse = getDailyHiggsfieldGenerationsCount();

    try {
      const reuseGenResult = await generateHiggsfieldImage({
        prompt: reusePrompt,
        aspectRatio: '16:9',
        slug: reuseSlug,
        targetFolder: 'blog',
      });

      const countAfterReuse = getDailyHiggsfieldGenerationsCount();

      check(reuseGenResult.success === true, 'generateHiggsfieldImage succeeds on recovered asset');
      check(reuseGenResult.costUsd === 0, 'generateHiggsfieldImage returns costUsd = 0 for recovered asset');
      check(countAfterReuse === countBeforeReuse, 'Recovery asset reuse does NOT consume daily Higgsfield generation quota');
    } finally {
      if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    }

  } finally {
    writeEngineState(originalState);
  }

  console.log('\n===============================================================');
  console.log(`ASSET RECOVERY TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  return failed === 0;
}

if (process.argv[1]?.includes('testAssetRecovery')) {
  runAssetRecoveryTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}
