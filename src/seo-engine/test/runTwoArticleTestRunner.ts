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

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { queueJobForTopic, executeJobLifecycle } from '../queue/jobQueueManager';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';
import { getHiggsfieldApiKey, isHiggsfieldConfigured, testHiggsfieldAuthentication } from '../generation/higgsfieldClient';

interface GenerationLogEntry {
  article: string;
  asset: string;
  aspectRatio: string;
  resolution: string;
  status: 'generated' | 'cached' | 'failed';
  providerRequestId?: string;
  localPath?: string;
  error?: string;
  stageAtCompletion?: string;
}

const TEST_TOPICS: {
  keyword: string;
  slug: string;
  contentType: 'trending_crochet' | 'tool_guide';
  category: 'crochet' | 'tools';
  toolSlug?: string;
  targetTool?: string;
  targetCategoryUrl: string;
  targetFormat: 'tutorial' | 'tool_focus';
  notes: string;
}[] = [
  {
    keyword: 'easy crochet pumpkin pattern free',
    slug: 'easy-crochet-pumpkin-pattern-free',
    contentType: 'trending_crochet',
    category: 'crochet',
    targetCategoryUrl: '/categories/tutorials',
    targetFormat: 'tutorial',
    notes: 'Seasonal high-volume search for beginner-friendly plush ribbed pumpkins (Slot 1).',
  },
  {
    keyword: 'yarn calculator',
    slug: 'yarn-calculator',
    contentType: 'tool_guide',
    category: 'tools',
    toolSlug: 'yarn-calculator',
    targetTool: '/tools/yarn-calculator',
    targetCategoryUrl: '/categories/tools',
    targetFormat: 'tool_focus',
    notes: 'Top tier yardage and skein estimation search for fiber craft makers (Slot 2).',
  },
];

function maskSecret(val: string | undefined): string {
  if (!val) return 'MISSING (NOT CONFIGURED)';
  if (val.length <= 8) return '********';
  return `${val.slice(0, 4)}...${val.slice(-4)} (length: ${val.length})`;
}

export async function runTwoArticleTest(): Promise<void> {
  console.log('===============================================================');
  console.log('STARTING CONTROLLED 2-ARTICLE PRODUCTION-LIKE TEST RUN');
  console.log('===============================================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Topics (${TEST_TOPICS.length}): ${TEST_TOPICS.map(t => `"${t.keyword}"`).join(', ')}`);
  
  // Pre-flight environment diagnostics (Secrets masked)
  const hfKey = getHiggsfieldApiKey();
  const openAiKey = process.env.OPENAI_API_KEY;
  console.log(`[Pre-flight] HF_KEY / HIGGSFIELD_API_KEY: ${maskSecret(hfKey)}`);
  console.log(`[Pre-flight] OPENAI_API_KEY:             ${maskSecret(openAiKey)}`);
  console.log(`[Pre-flight] Higgsfield Configured:      ${isHiggsfieldConfigured() ? 'YES' : 'NO'}`);

  // Live API connectivity and authentication check
  console.log('[Pre-flight] Verifying live API connectivity...');
  const hfAuth = await testHiggsfieldAuthentication();
  console.log(`[Pre-flight] Higgsfield Auth Check:       ${hfAuth.authenticated ? 'SUCCESS' : 'FAILED'} (${hfAuth.message})`);

  let oaiOk = false;
  try {
    const oaiRes = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${openAiKey}` }
    });
    oaiOk = oaiRes.ok;
    console.log(`[Pre-flight] OpenAI Auth Check:           ${oaiOk ? 'SUCCESS (HTTP 200)' : `FAILED (HTTP ${oaiRes.status})`}`);
  } catch (err: any) {
    console.log(`[Pre-flight] OpenAI Auth Check:           FAILED (${err?.message})`);
  }
  console.log('===============================================================\n');

  if (!hfAuth.authenticated) {
    console.error(`❌ CRITICAL: Higgsfield authentication failed (${hfAuth.message}).`);
    console.error('Stopping immediately. No paid image generation requests will be made.');
    return;
  }

  if (!oaiOk) {
    console.error('❌ CRITICAL: OpenAI authentication failed.');
    console.error('Stopping immediately. No paid generation requests will be made.');
    return;
  }

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

    // Check if an existing job exists for this topic keyword (e.g. from previous run with generated article content)
    const currentState = readEngineState();
    const existingJob = currentState.activeJobs.find(
      j => j.topic.keyword.toLowerCase() === item.keyword.toLowerCase()
    );

    let jobToRunId: string;

    if (existingJob) {
      jobToRunId = existingJob.id;
      console.log(`[JobQueue] Reusing existing job ${existingJob.id} (stage: "${existingJob.stage}") for "${item.keyword}"`);
      
      // If the job was previously failed (e.g. at board matching) or interrupted, reset to selected to allow clean progression
      if (existingJob.stage === 'failed' || existingJob.stage === 'researching' || existingJob.stage === 'writing' || existingJob.stage === 'generating_images') {
        updateJobInState(existingJob.id, j => {
          j.stage = 'selected';
          j.logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Restarting job execution from previous attempt in test runner with test board fallback enabled.',
          });
          return j;
        });
      }
    } else {
      const topic: DiscoveredTopic = {
        id: `test_topic_${item.slug.replace(/-/g, '_')}`,
        keyword: item.keyword,
        contentType: item.contentType,
        category: item.category,
        toolSlug: item.toolSlug,
        source: 'gsc_seed',
        opportunityScore: 95 - i * 3,
        targetContentFormat: item.targetFormat,
        targetToolUrl: item.targetTool,
        targetCategoryUrl: item.targetCategoryUrl,
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
      jobToRunId = queuedJob.id;
      console.log(`[JobQueue] Created job ${queuedJob.id} in state "${queuedJob.stage}"`);
    }

    // Record timestamp before starting execution to isolate current attempt logs from historical logs
    const attemptStartTime = new Date().toISOString();

    // Execute lifecycle through all 5 stages with test fallback board allowed
    let completedJob: SeoEngineArticleJob;
    try {
      completedJob = await executeJobLifecycle(jobToRunId, { allowTestFallbackBoard: true });
    } catch (cycleErr: any) {
      console.error(`[JobRunner] Fatal unhandled exception in executeJobLifecycle for job ${jobToRunId}:`, cycleErr);
      throw cycleErr;
    }
    processedJobs.push(completedJob);

    // Distinguish current execution attempt logs from historical logs
    const currentAttemptLogs = completedJob.logs.filter(l => l.timestamp >= attemptStartTime);
    const historicalLogs = completedJob.logs.filter(l => l.timestamp < attemptStartTime);
    const currentErrorLogs = currentAttemptLogs.filter(l => l.level === 'error').map(l => l.message);
    const historicalErrorLogs = historicalLogs.filter(l => l.level === 'error').map(l => l.message);

    // Audit Asset 1: Hero Image (16:9, 1k)
    const heroImage = completedJob.articleContent?.heroImage;
    const heroExists = Boolean(
      heroImage?.stableAssetPath &&
      fs.existsSync(heroImage.stableAssetPath) &&
      fs.statSync(heroImage.stableAssetPath).size > 100
    );

    const isHeroNew = currentAttemptLogs.some(l => l.message.includes('Hero image generated and saved'));
    let heroError: string | undefined;
    if (!heroExists) {
      heroError = heroImage?.errorMessage ||
        currentErrorLogs.find(msg => msg.includes('Hero') || msg.includes('Higgsfield') || msg.includes('Budget')) ||
        (currentErrorLogs.length > 0 ? currentErrorLogs[currentErrorLogs.length - 1] : `Job halted at stage "${completedJob.stage}" before Hero generation`);
    }

    const heroEntry: GenerationLogEntry = {
      article: `Article ${articleIndex} ("${item.keyword}")`,
      asset: 'Hero Image',
      aspectRatio: '16:9',
      resolution: '1k',
      status: heroExists ? (isHeroNew ? 'generated' : 'cached') : 'failed',
      providerRequestId: heroImage?.higgsfieldRequestId || 'N/A',
      localPath: heroImage?.stableAssetPath,
      error: heroError,
      stageAtCompletion: completedJob.stage,
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
    if (heroEntry.status === 'failed') {
      console.error(`  ↳ Current Failure Cause: ${heroEntry.error}`);
    }

    // Audit Asset 2 & 3: Pins 1 & 2 (2:3, 1k)
    for (let p = 0; p < 2; p++) {
      const pinIndex = p + 1;
      const pin = completedJob.pinterestPins ? completedJob.pinterestPins[p] : undefined;
      const pinExists = Boolean(
        pin?.stableAssetPath &&
        fs.existsSync(pin.stableAssetPath) &&
        fs.statSync(pin.stableAssetPath).size > 100
      );

      const isPinNew = currentAttemptLogs.some(l => l.message.includes(`Pin ${pinIndex} generated and saved`));
      let pinError: string | undefined;
      if (!pinExists) {
        pinError = pin?.errorMessage ||
          currentErrorLogs.find(msg => msg.includes(`Pin ${pinIndex}`) || msg.includes('Higgsfield') || msg.includes('Board') || msg.includes('Budget')) ||
          (currentErrorLogs.length > 0 ? currentErrorLogs[currentErrorLogs.length - 1] : `Job halted at stage "${completedJob.stage}" before Pin ${pinIndex} generation`);
      }

      const pinEntry: GenerationLogEntry = {
        article: `Article ${articleIndex} ("${item.keyword}")`,
        asset: `Pin ${pinIndex}`,
        aspectRatio: '2:3',
        resolution: '1k',
        status: pinExists ? (isPinNew ? 'generated' : 'cached') : 'failed',
        providerRequestId: pin?.higgsfieldRequestId || 'N/A',
        localPath: pin?.stableAssetPath,
        error: pinError,
        stageAtCompletion: completedJob.stage,
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
      if (pinEntry.status === 'failed') {
        console.error(`  ↳ Current Failure Cause: ${pinEntry.error}`);
      }
    }

    // Print current attempt error logs if any occurred
    if (currentErrorLogs.length > 0) {
      console.log(`\n  [CURRENT ATTEMPT ERRORS - Article ${articleIndex}]:`);
      currentErrorLogs.forEach(err => console.log(`   * ${err}`));
      console.log('');
    }

    if (historicalErrorLogs.length > 0 && Boolean(existingJob)) {
      console.log(`  [HISTORICAL LOGS]: ${historicalErrorLogs.length} previous errors from prior runs safely ignored for current attempt audit.`);
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
    if (log.error)     console.log(`     Error: ${log.error} (Stage: ${log.stageAtCompletion})`);
  });
  console.log('---------------------------------------------------------------');
  console.log('FINAL JOB STATES:');
  processedJobs.forEach(job => {
    console.log(`  - Job: ${job.id} | Stage: ${job.stage} | Approval Required: ${job.requiresApproval} | Pins: ${job.pinterestPins ? job.pinterestPins.length : 0}`);
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
