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
import { readEngineState } from '../queue/engineStorage';
import { getJobCostBreakdown } from '../cost/costTracker';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';

export async function runFreshProductionTest(): Promise<{
  job: SeoEngineArticleJob;
  topic: DiscoveredTopic;
  heroMeta?: Metadata;
  pin1Meta?: Metadata;
  pin2Meta?: Metadata;
}> {
  console.log('===============================================================');
  console.log('STARTING FRESH LIVE PRODUCTION ARTICLE TEST RUN');
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

  // Verify Image Metadata on Disk
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

  return {
    job: completedJob,
    topic: selectedTopic,
    heroMeta,
    pin1Meta,
    pin2Meta,
  };
}

if (process.argv[1] && process.argv[1].endsWith('runFreshProductionArticleTest.ts')) {
  runFreshProductionTest()
    .then(result => {
      console.log('\n=== FINAL FRESH PRODUCTION TEST COMPLETED SUCCESSFULLY ===');
      console.log(`Job ID: ${result.job.id}`);
      console.log(`Topic: ${result.topic.keyword}`);
      console.log(`Title: ${result.job.articleContent?.title}`);
      console.log(`Word Count: ${result.job.articleContent?.wordCount}`);
      console.log(`Hero Dimensions: ${result.heroMeta?.width}x${result.heroMeta?.height}`);
      console.log(`Pin 1 Dimensions: ${result.pin1Meta?.width}x${result.pin1Meta?.height}`);
      console.log(`Pin 2 Dimensions: ${result.pin2Meta?.width}x${result.pin2Meta?.height}`);
    })
    .catch(err => {
      console.error('Fatal fresh production runner error:', err);
      process.exit(1);
    });
}
