/**
 * Fresh End-to-End Production Article Pipeline Test Runner
 * 
 * Executes live production flow:
 * DataForSEO Trend Discovery → Opportunity Scoring → Fresh Job Queueing
 * → GPT-4o Technical Research → Factual Packet Validation
 * → GPT-4o Production Article Generation → Stage 5 Factual Validator / Quality Gates
 * → Higgsfield Hero Generation (16:9, 1K)
 * → Higgsfield Pin 1 Generation (2:3, 1K)
 * → Higgsfield Pin 2 Generation (2:3, 1K)
 * → Status Polling & Task URL Extraction (images[0].url)
 * → Asset Download to Disk (Direct Final Higgsfield Artwork)
 * → Final Job State Persistence
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import sharp, { Metadata } from 'sharp';
import { runTopicDiscoveryPipeline } from '../discovery/topicDiscovery';
import { queueJobForTopic, executeJobLifecycle } from '../queue/jobQueueManager';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { getJobCostBreakdown, getDailyHiggsfieldSpendUsd, getDailyHiggsfieldGenerationsCount } from '../cost/costTracker';
import { publishArticleToLiveSite, PublishArticleResult } from '../publishing/articlePublisher';
import { publishPinToPinterest, PublishPinResult } from '../publishing/pinterestPublisher';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';

export interface FreshProductionTestResult {
  job: SeoEngineArticleJob;
  topic: DiscoveredTopic;
  heroMeta?: Metadata;
  pin1Meta?: Metadata;
  pin2Meta?: Metadata;
  articlePublishResult?: PublishArticleResult;
  pin1PublishResult?: PublishPinResult;
  pin2PublishResult?: PublishPinResult;
  dailyHiggsfieldSpendUsd: number;
  dailyHiggsfieldCount: number;
  jobCostBreakdown: ReturnType<typeof getJobCostBreakdown>;
}

export async function runFreshProductionTest(): Promise<FreshProductionTestResult> {
  console.log('===============================================================');
  console.log('STARTING CONTROLLED SINGLE-ARTICLE PRODUCTION TEST RUN');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('===============================================================');

  // 1. Run DataForSEO Topic Discovery Pipeline
  console.log('\n[Stage 1] Running DataForSEO topic discovery pipeline...');
  const discoveredTopics = await runTopicDiscoveryPipeline({ limit: 1, useRealDataForSeo: true });

  if (!discoveredTopics || discoveredTopics.length === 0) {
    throw new Error('Topic discovery returned 0 topics');
  }

  const selectedTopic = discoveredTopics[0];
  console.log(`[Stage 1 Result] Selected Topic: "${selectedTopic.keyword}" (Opportunity Score: ${selectedTopic.opportunityScore}, Format: ${selectedTopic.targetContentFormat})`);

  // 2. Queue Fresh Job with clean state
  const state = readEngineState();
  const freshJob = queueJobForTopic(selectedTopic, {
    ...state.config,
    autoPublish: false,
    autoPublishPinterest: false,
    requiresApproval: true,
    pinsPerArticle: 2,
  });

  console.log(`\n[Stage 2] Queued fresh production job with ID: ${freshJob.id}`);

  // 3. Execute Complete Job Lifecycle
  console.log(`\n[Stage 3] Executing full lifecycle for job: ${freshJob.id}...`);
  const completedJob = await executeJobLifecycle(freshJob.id, { allowTestFallbackBoard: true });

  console.log('\n===============================================================');
  console.log('LIFECYCLE EXECUTION COMPLETED');
  console.log(`Final Stage: ${completedJob.stage}`);
  console.log('===============================================================');

  // 4. Verify Image Metadata on Disk
  let heroMeta: Metadata | undefined;
  let pin1Meta: Metadata | undefined;
  let pin2Meta: Metadata | undefined;

  const heroPath = completedJob.articleContent?.heroImage?.stableAssetPath;
  if (heroPath && fs.existsSync(heroPath)) {
    heroMeta = await sharp(heroPath).metadata();
  }

  const pin1Path = completedJob.pinterestPins?.[0]?.stableAssetPath;
  if (pin1Path && fs.existsSync(pin1Path)) {
    pin1Meta = await sharp(pin1Path).metadata();
  }

  const pin2Path = completedJob.pinterestPins?.[1]?.stableAssetPath;
  if (pin2Path && fs.existsSync(pin2Path)) {
    pin2Meta = await sharp(pin2Path).metadata();
  }

  // 5. Publish Article to Production Live Site
  console.log('\n[Stage 4] Publishing article to production site...');
  let articlePublishResult: PublishArticleResult | undefined;
  if (completedJob.articleContent && completedJob.stage !== 'failed') {
    articlePublishResult = await publishArticleToLiveSite(completedJob);
    if (articlePublishResult.success && articlePublishResult.blogPostId) {
      updateJobInState(completedJob.id, j => {
        j.publishedBlogPostId = articlePublishResult!.blogPostId;
        j.publishedSlug = articlePublishResult!.slug;
        j.publishedUrl = articlePublishResult!.publicUrl;
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Article published live: ${articlePublishResult!.publicUrl} (ID: ${articlePublishResult!.blogPostId})`,
        });
        return j;
      });
      console.log(`[Stage 4 Result] Article published successfully: ${articlePublishResult.publicUrl}`);
    } else {
      console.warn(`[Stage 4 Warning] Article publishing failed or incomplete: ${articlePublishResult.error}`);
    }
  } else {
    console.warn(`[Stage 4 Skipped] Article not ready for publishing (Stage: ${completedJob.stage})`);
  }

  // 6. Publish Pinterest Pins
  console.log('\n[Stage 5] Publishing Pinterest Pins...');
  let pin1PublishResult: PublishPinResult | undefined;
  let pin2PublishResult: PublishPinResult | undefined;

  if (completedJob.pinterestPins?.[0]) {
    pin1PublishResult = await publishPinToPinterest(completedJob, completedJob.pinterestPins[0]);
    if (pin1PublishResult.success && pin1PublishResult.pinId) {
      updateJobInState(completedJob.id, j => {
        if (j.pinterestPins?.[0]) {
          j.pinterestPins[0].publishStatus = 'published';
          j.pinterestPins[0].pinterestPinId = pin1PublishResult!.pinId;
          j.pinterestPins[0].pinterestPinUrl = pin1PublishResult!.pinUrl;
        }
        return j;
      });
      console.log(`[Stage 5 Result] Pin 1 published successfully: ${pin1PublishResult.pinUrl || pin1PublishResult.pinId}`);
    } else {
      console.warn(`[Stage 5 Notice] Pin 1 publishing result: ${pin1PublishResult.error || 'Failed'}`);
    }
  }

  if (completedJob.pinterestPins?.[1]) {
    pin2PublishResult = await publishPinToPinterest(completedJob, completedJob.pinterestPins[1]);
    if (pin2PublishResult.success && pin2PublishResult.pinId) {
      updateJobInState(completedJob.id, j => {
        if (j.pinterestPins?.[1]) {
          j.pinterestPins[1].publishStatus = 'published';
          j.pinterestPins[1].pinterestPinId = pin2PublishResult!.pinId;
          j.pinterestPins[1].pinterestPinUrl = pin2PublishResult!.pinUrl;
        }
        return j;
      });
      console.log(`[Stage 5 Result] Pin 2 published successfully: ${pin2PublishResult.pinUrl || pin2PublishResult.pinId}`);
    } else {
      console.warn(`[Stage 5 Notice] Pin 2 publishing result: ${pin2PublishResult.error || 'Failed'}`);
    }
  }

  // Final job state refresh
  const finalJobState = readEngineState().activeJobs.find(j => j.id === completedJob.id) || completedJob;
  const jobCostBreakdown = getJobCostBreakdown(completedJob.id);
  const dailyHiggsfieldSpendUsd = getDailyHiggsfieldSpendUsd();
  const dailyHiggsfieldCount = getDailyHiggsfieldGenerationsCount();

  return {
    job: finalJobState,
    topic: selectedTopic,
    heroMeta,
    pin1Meta,
    pin2Meta,
    articlePublishResult,
    pin1PublishResult,
    pin2PublishResult,
    dailyHiggsfieldSpendUsd,
    dailyHiggsfieldCount,
    jobCostBreakdown,
  };
}

if (process.argv[1] && process.argv[1].endsWith('runFreshProductionArticleTest.ts')) {
  runFreshProductionTest()
    .then(result => {
      console.log('\n=== FINAL PRODUCTION TEST EXECUTION SUMMARY ===');
      console.log(`Job ID:                   ${result.job.id}`);
      console.log(`Topic Keyword:            ${result.topic.keyword}`);
      console.log(`Article Title:            ${result.job.articleContent?.title}`);
      console.log(`Article Published URL:    ${result.articlePublishResult?.publicUrl || 'N/A'}`);
      console.log(`Pin 1 ID / URL:           ${result.pin1PublishResult?.pinUrl || result.pin1PublishResult?.pinId || result.pin1PublishResult?.error || 'N/A'}`);
      console.log(`Pin 2 ID / URL:           ${result.pin2PublishResult?.pinUrl || result.pin2PublishResult?.pinId || result.pin2PublishResult?.error || 'N/A'}`);
      console.log(`Higgsfield Daily Count:   ${result.dailyHiggsfieldCount}`);
      console.log(`Higgsfield Daily Spend:   $${result.dailyHiggsfieldSpendUsd.toFixed(2)}`);
      console.log(`Job Cost Breakdown:       Total: $${(result.jobCostBreakdown?.totalCostUsd || 0).toFixed(4)} (OpenAI/Gemini: $${(result.jobCostBreakdown?.openaiCostUsd || 0).toFixed(4)}, Higgsfield: $${(result.jobCostBreakdown?.higgsfieldCostUsd || 0).toFixed(4)}, DataForSEO: $${(result.jobCostBreakdown?.dataforseoCostUsd || 0).toFixed(4)})`);
    })
    .catch(err => {
      console.error('Fatal production test runner error:', err);
      process.exit(1);
    });
}
