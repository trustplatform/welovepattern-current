/**
 * Resume Controlled Single Article Production Test
 * Target Job: job_2026-10-18_1tip0j
 * Keyword: "crochet christmas tree ornament pattern"
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import sharp, { Metadata } from 'sharp';
import { readEngineState, updateJobInState, getJobById } from '../queue/engineStorage';
import { executeJobLifecycle } from '../queue/jobQueueManager';
import { isHiggsfieldConfigured, testHiggsfieldAuthentication } from '../generation/higgsfieldClient';
import { isDataForSeoConfigured } from '../discovery/dataForSeoClient';
import { getPinterestAuthRecord, isPinterestConfigured } from '../../pinterest/pinterestOAuth';
import { isRealNumericPinterestBoardId } from '../publishing/pinterestBoardSelector';
import { publishArticleToLiveSite, PublishArticleResult } from '../publishing/articlePublisher';
import { publishPinToPinterest, PublishPinResult } from '../publishing/pinterestPublisher';
import { getJobCostBreakdown, getDailyHiggsfieldSpendUsd, getDailyHiggsfieldGenerationsCount } from '../cost/costTracker';
import { SeoEngineArticleJob } from '../types';

export interface ResumeTestResult {
  jobId: string;
  keyword: string;
  articleTitle?: string;
  articleWordCount?: number;
  articlePublishedUrl?: string;
  articlePublishSuccess?: boolean;
  heroMeta?: Metadata;
  pin1Meta?: Metadata;
  pin2Meta?: Metadata;
  pin1Result?: PublishPinResult;
  pin2Result?: PublishPinResult;
  dailyHiggsfieldSpendUsd: number;
  dailyHiggsfieldCount: number;
  actualJobCost?: ReturnType<typeof getJobCostBreakdown>;
  pinterestConnected: boolean;
  pinterestBoardConfigured: boolean;
  blockers: string[];
}

export async function runResumeSingleArticleTest(): Promise<ResumeTestResult> {
  const TARGET_JOB_ID = 'job_2026-10-18_1tip0j';
  const blockers: string[] = [];

  console.log('===============================================================');
  console.log('RESUMING CONTROLLED SINGLE-ARTICLE PRODUCTION TEST');
  console.log(`Target Job ID: ${TARGET_JOB_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('===============================================================');

  // 1. Verify secrets and integrations
  console.log('\n[Step 1] Verifying runtime secrets and integrations...');
  const hfConfigured = isHiggsfieldConfigured();
  const dataForSeoConfigured = isDataForSeoConfigured();
  const pinterestAppConfigured = isPinterestConfigured().configured;
  const pinterestAuth = getPinterestAuthRecord();
  const pinterestConnected = Boolean(pinterestAuth && pinterestAuth.accessToken);

  console.log(`- Higgsfield (HF_KEY):        ${hfConfigured ? 'READY (configured)' : 'MISSING'}`);
  console.log(`- DataForSEO:                  ${dataForSeoConfigured ? 'READY (configured)' : 'MISSING'}`);
  console.log(`- Pinterest OAuth App:         ${pinterestAppConfigured ? 'READY (App ID & Secret present)' : 'MISSING'}`);
  console.log(`- Pinterest Account Connected: ${pinterestConnected ? 'CONNECTED' : 'NOT CONNECTED (OAuth Access Token required)'}`);

  if (!hfConfigured) {
    blockers.push('HF_KEY is missing from runtime.');
  }

  // Check board configuration
  const state = readEngineState();
  const fallbackBoardId = state.config.fallbackBoardId;
  const isBoardReal = isRealNumericPinterestBoardId(fallbackBoardId);
  console.log(`- Configured Fallback Board:   ${fallbackBoardId || '(none)'} (Real numeric ID: ${isBoardReal})`);

  if (!pinterestConnected) {
    blockers.push('Pinterest OAuth user account is not connected. Admin authorization or PINTEREST_ACCESS_TOKEN is required to publish live pins.');
  }
  if (!isBoardReal) {
    blockers.push('Configured Pinterest target board is missing or not a genuine numeric ID (required for live Pinterest pin publishing).');
  }

  // 2. Locate existing job
  console.log('\n[Step 2] Locating existing article job...');
  const job = getJobById(TARGET_JOB_ID);
  if (!job) {
    throw new Error(`Job ${TARGET_JOB_ID} was not found in active state.`);
  }

  if (!job.articleContent || !job.articleContent.title) {
    throw new Error(`Job ${TARGET_JOB_ID} has no generated article content.`);
  }

  console.log(`- Found existing job: "${job.topic.keyword}"`);
  console.log(`- Article Title:      "${job.articleContent.title}"`);
  console.log(`- Word Count:         ${job.articleContent.wordCount} words`);
  console.log(`- Current Stage:      ${job.stage}`);

  // Reset stage from 'failed' to 'writing' so lifecycle proceeds to Stage 3 (Image Generation)
  updateJobInState(TARGET_JOB_ID, j => {
    j.stage = 'writing';
    j.error = undefined;
    j.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Resuming job execution after HF_KEY configuration. Existing article draft preserved.',
    });
    return j;
  });

  // 3. Execute lifecycle: Generates 1 Hero (16:9) and 2 Pins (2:3) via Higgsfield
  console.log('\n[Step 3] Executing lifecycle Stage 3 for image generation...');
  const completedJob = await executeJobLifecycle(TARGET_JOB_ID, { allowTestFallbackBoard: true });

  console.log(`- Lifecycle completed with stage: ${completedJob.stage}`);

  // 4. Verify generated visual assets on disk with sharp
  console.log('\n[Step 4] Verifying generated images on disk...');
  let heroMeta: Metadata | undefined;
  let pin1Meta: Metadata | undefined;
  let pin2Meta: Metadata | undefined;

  const heroPath = completedJob.articleContent?.heroImage?.stableAssetPath;
  if (heroPath && fs.existsSync(heroPath)) {
    heroMeta = await sharp(heroPath).metadata();
    console.log(`- Hero Image (16:9): ${heroMeta.width}x${heroMeta.height} (${heroMeta.format}) at ${heroPath}`);
  } else {
    console.warn(`- Hero Image: Missing on disk`);
  }

  const pin1Path = completedJob.pinterestPins?.[0]?.stableAssetPath;
  if (pin1Path && fs.existsSync(pin1Path)) {
    pin1Meta = await sharp(pin1Path).metadata();
    console.log(`- Pin 1 Image (2:3): ${pin1Meta.width}x${pin1Meta.height} (${pin1Meta.format}) at ${pin1Path}`);
  } else {
    console.warn(`- Pin 1 Image: Missing on disk`);
  }

  const pin2Path = completedJob.pinterestPins?.[1]?.stableAssetPath;
  if (pin2Path && fs.existsSync(pin2Path)) {
    pin2Meta = await sharp(pin2Path).metadata();
    console.log(`- Pin 2 Image (2:3): ${pin2Meta.width}x${pin2Meta.height} (${pin2Meta.format}) at ${pin2Path}`);
  } else {
    console.warn(`- Pin 2 Image: Missing on disk`);
  }

  // 5. Publish Article to Production Live Site
  console.log('\n[Step 5] Publishing article to live website blog...');
  let articlePublishResult: PublishArticleResult | undefined;
  if (completedJob.articleContent && completedJob.stage !== 'failed') {
    articlePublishResult = await publishArticleToLiveSite(completedJob);
    if (articlePublishResult.success && articlePublishResult.publicUrl) {
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
      console.log(`- Article published successfully! Canonical URL: ${articlePublishResult.publicUrl}`);
    } else {
      console.warn(`- Article publish warning: ${articlePublishResult.error}`);
    }
  } else {
    console.warn(`- Article publishing skipped because job stage is: ${completedJob.stage}`);
  }

  // 6. Attempt publishing Pins to Pinterest
  console.log('\n[Step 6] Publishing Pins to Pinterest...');
  let pin1Result: PublishPinResult | undefined;
  let pin2Result: PublishPinResult | undefined;

  if (completedJob.pinterestPins?.[0]) {
    pin1Result = await publishPinToPinterest(completedJob, completedJob.pinterestPins[0]);
    if (pin1Result.success && pin1Result.pinId) {
      updateJobInState(completedJob.id, j => {
        if (j.pinterestPins?.[0]) {
          j.pinterestPins[0].publishStatus = 'published';
          j.pinterestPins[0].pinterestPinId = pin1Result!.pinId;
          j.pinterestPins[0].pinterestPinUrl = pin1Result!.pinUrl;
        }
        return j;
      });
      console.log(`- Pin 1 published: ${pin1Result.pinUrl || pin1Result.pinId}`);
    } else {
      console.log(`- Pin 1 publish notice: ${pin1Result.error}`);
    }
  }

  if (completedJob.pinterestPins?.[1]) {
    pin2Result = await publishPinToPinterest(completedJob, completedJob.pinterestPins[1]);
    if (pin2Result.success && pin2Result.pinId) {
      updateJobInState(completedJob.id, j => {
        if (j.pinterestPins?.[1]) {
          j.pinterestPins[1].publishStatus = 'published';
          j.pinterestPins[1].pinterestPinId = pin2Result!.pinId;
          j.pinterestPins[1].pinterestPinUrl = pin2Result!.pinUrl;
        }
        return j;
      });
      console.log(`- Pin 2 published: ${pin2Result.pinUrl || pin2Result.pinId}`);
    } else {
      console.log(`- Pin 2 publish notice: ${pin2Result.error}`);
    }
  }

  // 7. Costs and ledger records
  const dailyHiggsfieldSpendUsd = getDailyHiggsfieldSpendUsd();
  const dailyHiggsfieldCount = getDailyHiggsfieldGenerationsCount();
  const actualJobCost = getJobCostBreakdown(TARGET_JOB_ID);

  console.log('\n===============================================================');
  console.log('RESUME TEST EXECUTION SUMMARY');
  console.log(`Job ID:                 ${TARGET_JOB_ID}`);
  console.log(`Keyword:                ${job.topic.keyword}`);
  console.log(`Article Title:          ${job.articleContent.title}`);
  console.log(`Article Published URL:  ${articlePublishResult?.publicUrl || 'N/A'}`);
  console.log(`Pin 1 Publish Result:   ${pin1Result?.pinUrl || pin1Result?.pinId || pin1Result?.error || 'N/A'}`);
  console.log(`Pin 2 Publish Result:   ${pin2Result?.pinUrl || pin2Result?.pinId || pin2Result?.error || 'N/A'}`);
  console.log(`Higgsfield Daily Count: ${dailyHiggsfieldCount}`);
  console.log(`Higgsfield Daily Spend: $${dailyHiggsfieldSpendUsd.toFixed(2)}`);
  console.log(`Actual Job Cost:        Total $${(actualJobCost?.totalCostUsd || 0).toFixed(4)} (Higgsfield: $${(actualJobCost?.higgsfieldCostUsd || 0).toFixed(4)})`);
  console.log('===============================================================\n');

  return {
    jobId: TARGET_JOB_ID,
    keyword: job.topic.keyword,
    articleTitle: job.articleContent.title,
    articleWordCount: job.articleContent.wordCount,
    articlePublishedUrl: articlePublishResult?.publicUrl,
    articlePublishSuccess: articlePublishResult?.success,
    heroMeta,
    pin1Meta,
    pin2Meta,
    pin1Result,
    pin2Result,
    dailyHiggsfieldSpendUsd,
    dailyHiggsfieldCount,
    actualJobCost,
    pinterestConnected,
    pinterestBoardConfigured: isBoardReal,
    blockers,
  };
}

if (process.argv[1] && process.argv[1].endsWith('resumeSingleArticleTest.ts')) {
  runResumeSingleArticleTest().catch(err => {
    console.error('Fatal resume test runner error:', err);
    process.exit(1);
  });
}
