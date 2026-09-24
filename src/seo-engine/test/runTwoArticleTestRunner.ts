/**
 * Controlled 2-Article Production-Like Test Runner
 * 
 * Executes exactly TWO SEO Engine jobs sequentially:
 * 1. "gauge swatch calculator"
 * 2. "yarn calculator"
 * 
 * STRICT CONTROLS:
 * - Exactly 2 jobs.
 * - Exactly 6 Higgsfield generations if cache is empty (1 Hero 16:9 1k + 2 Pins 2:3 1k per article).
 * - Sequential execution only.
 * - Zero Pinterest publishing (no live pin creation).
 * - Zero public article publishing (halts safely at `awaiting_approval`).
 * - Reuses existing local assets if present.
 * - Granular per-generation logging (Article / Asset / Aspect Ratio / Resolution / Request ID).
 * - Comprehensive end-of-run summary report.
 */

import fs from 'fs';
import path from 'path';
import { readEngineState } from '../queue/engineStorage';
import { queueJobForTopic, executeJobLifecycle } from '../queue/jobQueueManager';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';

interface GenerationLogEntry {
  article: string;
  asset: string;
  aspectRatio: string;
  resolution: string;
  status: 'generated' | 'cached' | 'failed';
  providerRequestId?: string;
  localPath?: string;
  error?: string;
}

const TEST_TOPICS: { keyword: string; slug: string; targetTool: string; notes: string }[] = [
  {
    keyword: 'gauge swatch calculator',
    slug: 'gauge-swatch-calculator',
    targetTool: '/tools/gauge-calculator',
    notes: 'High intent maker query for comparing swatch measurements against pattern gauge.',
  },
  {
    keyword: 'yarn calculator',
    slug: 'yarn-calculator',
    targetTool: '/tools/yarn-calculator',
    notes: 'Top tier yardage and skein estimation search for fiber craft makers.',
  },
];

export async function runTwoArticleTest(): Promise<void> {
  console.log('===============================================================');
  console.log('STARTING CONTROLLED 2-ARTICLE PRODUCTION-LIKE TEST RUN');
  console.log('===============================================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Topics (${TEST_TOPICS.length}): ${TEST_TOPICS.map(t => `"${t.keyword}"`).join(', ')}`);
  console.log('===============================================================\n');

  const generationLogs: GenerationLogEntry[] = [];
  const processedJobs: SeoEngineArticleJob[] = [];
  const engineState = readEngineState();
  const config = engineState.config;

  let attemptCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let cachedCount = 0;

  for (let i = 0; i < TEST_TOPICS.length; i++) {
    const item = TEST_TOPICS[i];
    const articleIndex = i + 1;
    console.log(`---------------------------------------------------------------`);
    console.log(`[ARTICLE ${articleIndex}/2] Initiating lifecycle for: "${item.keyword}"`);
    console.log(`---------------------------------------------------------------`);

    const topic: DiscoveredTopic = {
      id: `test_topic_${item.slug.replace(/-/g, '_')}`,
      keyword: item.keyword,
      source: 'gsc_seed',
      opportunityScore: 95 - i * 3,
      targetContentFormat: 'tool_focus',
      targetToolUrl: item.targetTool,
      targetCategoryUrl: '/category/tools',
      targetAudienceLevel: 'all_levels',
      searchIntentNotes: item.notes,
      discoveredAt: new Date().toISOString(),
      status: 'selected',
    };

    // Queue job with autoPublish forced false and requiresApproval forced true for zero publication risk
    const queuedJob = queueJobForTopic(topic, {
      ...config,
      autoPublish: false,
      autoPublishPinterest: false,
      requiresApproval: true,
      pinsPerArticle: 2,
    });

    console.log(`[JobQueue] Created job ${queuedJob.id} in state "${queuedJob.stage}"`);

    // Execute lifecycle through all 5 stages
    const completedJob = await executeJobLifecycle(queuedJob.id);
    processedJobs.push(completedJob);

    // Audit Asset 1: Hero Image (16:9, 1k)
    const heroImage = completedJob.articleContent?.heroImage;
    const heroExists = Boolean(
      heroImage?.stableAssetPath &&
      fs.existsSync(heroImage.stableAssetPath) &&
      fs.statSync(heroImage.stableAssetPath).size > 100
    );

    const isHeroNew = completedJob.logs.some(l => l.message.includes('Hero image generated and saved'));
    const heroEntry: GenerationLogEntry = {
      article: `Article ${articleIndex} ("${item.keyword}")`,
      asset: 'Hero Image',
      aspectRatio: '16:9',
      resolution: '1k',
      status: heroExists ? (isHeroNew ? 'generated' : 'cached') : 'failed',
      providerRequestId: heroImage?.higgsfieldRequestId || 'N/A',
      localPath: heroImage?.stableAssetPath,
      error: heroExists ? undefined : 'Hero image missing or generation failed',
    };
    generationLogs.push(heroEntry);

    if (heroEntry.status === 'generated') {
      attemptCount++;
      successCount++;
    } else if (heroEntry.status === 'cached') {
      cachedCount++;
    } else {
      attemptCount++;
      failedCount++;
    }

    console.log(
      `[GENERATION] ${heroEntry.article} | ${heroEntry.asset} | ${heroEntry.aspectRatio} | ${heroEntry.resolution} | RequestID: ${heroEntry.providerRequestId} | Status: ${heroEntry.status.toUpperCase()}`
    );

    // Audit Asset 2 & 3: Pins 1 & 2 (2:3, 1k)
    for (let p = 0; p < 2; p++) {
      const pinIndex = p + 1;
      const pin = completedJob.pinterestPins[p];
      const pinExists = Boolean(
        pin?.stableAssetPath &&
        fs.existsSync(pin.stableAssetPath) &&
        fs.statSync(pin.stableAssetPath).size > 100
      );

      const isPinNew = completedJob.logs.some(l => l.message.includes(`Pin ${pinIndex} generated and saved`));
      const pinEntry: GenerationLogEntry = {
        article: `Article ${articleIndex} ("${item.keyword}")`,
        asset: `Pin ${pinIndex}`,
        aspectRatio: '2:3',
        resolution: '1k',
        status: pinExists ? (isPinNew ? 'generated' : 'cached') : 'failed',
        providerRequestId: pin?.higgsfieldRequestId || 'N/A',
        localPath: pin?.stableAssetPath,
        error: pin?.errorMessage || (pinExists ? undefined : `Pin ${pinIndex} image missing`),
      };
      generationLogs.push(pinEntry);

      if (pinEntry.status === 'generated') {
        attemptCount++;
        successCount++;
      } else if (pinEntry.status === 'cached') {
        cachedCount++;
      } else {
        attemptCount++;
        failedCount++;
      }

      console.log(
        `[GENERATION] ${pinEntry.article} | ${pinEntry.asset} | ${pinEntry.aspectRatio} | ${pinEntry.resolution} | RequestID: ${pinEntry.providerRequestId} | Status: ${pinEntry.status.toUpperCase()}`
      );
    }

    console.log(`[ARTICLE ${articleIndex}/2] Lifecycle concluded at stage: "${completedJob.stage}"\n`);
  }

  // Final Summary Report
  console.log('===============================================================');
  console.log('CONTROLLED 2-ARTICLE TEST SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`Total Articles Processed:  ${processedJobs.length}`);
  console.log(`Total Generation Attempts: ${attemptCount}`);
  console.log(`Successful Generations:    ${successCount}`);
  console.log(`Failed Generations:        ${failedCount}`);
  console.log(`Cached / Reused Assets:    ${cachedCount}`);
  console.log('---------------------------------------------------------------');
  console.log('DETAILED ASSET AUDIT:');
  generationLogs.forEach((log, idx) => {
    console.log(`  ${idx + 1}. [${log.status.toUpperCase()}] ${log.article} → ${log.asset}`);
    console.log(`     Specs: ${log.aspectRatio} | ${log.resolution} | Request ID: ${log.providerRequestId}`);
    if (log.localPath) console.log(`     Path:  ${log.localPath}`);
    if (log.error) console.log(`     Error: ${log.error}`);
  });
  console.log('---------------------------------------------------------------');
  console.log('FINAL JOB STATES:');
  processedJobs.forEach(job => {
    console.log(`  - Job: ${job.id} | Stage: ${job.stage} | Approval Required: ${job.requiresApproval} | Pins: ${job.pinterestPins.length}`);
  });
  console.log('===============================================================');
}

// Only execute when invoked directly from CLI
if (process.argv[1] && process.argv[1].endsWith('runTwoArticleTestRunner.ts')) {
  runTwoArticleTest().catch(err => {
    console.error('Test runner encountered unexpected fatal error:', err);
    process.exit(1);
  });
}
