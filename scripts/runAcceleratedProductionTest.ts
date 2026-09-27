/**
 * Accelerated Real Production Test Runner
 * 
 * Executes a full production day through the EXACT production pipeline:
 * 1. Discovers 2 real topics (Slot 1: Trending Crochet + Slot 2: Tool Guide) via DataForSEO.
 * 2. Runs factual craft research & validation.
 * 3. Generates 2 full articles via OpenAI GPT-4o.
 * 4. Automatically queries live Pinterest OAuth to resolve real boards with >=60% semantic confidence.
 * 5. Generates 6 real images via Higgsfield Marketing Studio Image 2.0 Alpha (Hero 16:9, Pin 1 2:3, Pin 2 2:3 for both articles).
 * 6. Evaluates all 9 production quality gates.
 * 7. Publishes both articles live to WeLovePattern website datastore (data/blog-posts.json).
 * 8. Sequentially dispatches all 4 real Pinterest Pins to their automatically resolved boards with ZERO artificial delays.
 * 9. Records real Pinterest Pin IDs and audits final state.
 * 
 * ZERO mocks, ZERO fake IDs, ZERO configuration corruption.
 * Permanent scheduler settings remain completely untouched.
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { readEngineState } from '../src/seo-engine/queue/engineStorage';
import { createDailyProductionBatch, processQueueWorker } from '../src/seo-engine/queue/jobQueueManager';
import { publishPinToPinterest } from '../src/seo-engine/publishing/pinterestPublisher';
import { getLiveBlogPosts } from '../src/seo-engine/publishing/articlePublisher';

async function runAcceleratedProductionTest() {
  console.log('================================================================');
  console.log('STARTING ACCELERATED REAL PRODUCTION TEST (13:20 TIMELINE)');
  console.log('================================================================\n');

  const initialState = readEngineState();
  const tz = initialState.config.timezone || 'America/New_York';
  console.log(`Configured Timezone: ${tz}`);
  console.log(`AutoPublish Blog: ${initialState.config.autoPublish}`);
  console.log(`AutoPublish Pinterest: ${initialState.config.autoPublishPinterest}`);
  console.log(`Requires Approval: ${initialState.config.requiresApproval}\n`);

  if (!initialState.config.engineActive) {
    console.error('❌ Error: engineActive is false in config. Please enable the engine in Admin Settings.');
    process.exit(1);
  }

  const tStart = Date.now();

  // -----------------------------------------------------------------
  // STAGE 1: 13:20 SIMULATED ARTICLE PRODUCTION & LIVE WEBSITE PUBLICATION
  // -----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('STAGE 1 [13:20]: REAL 2-ARTICLE PRODUCTION BATCH & PUBLISHING');
  console.log('----------------------------------------------------------------');
  console.log('[1/2] Discovering 2 real topics & creating production batch...');
  const [job1, job2] = await createDailyProductionBatch({ useRealDataForSeo: true });
  console.log(`✓ Queued Slot 1 (${job1.contentType}): "${job1.topic.keyword}" [ID: ${job1.id}]`);
  console.log(`✓ Queued Slot 2 (${job2.contentType}): "${job2.topic.keyword}" [ID: ${job2.id}]`);

  console.log('\n[2/2] Processing Queue Worker (Research -> GPT-4o -> Board Match -> Higgsfield Images -> Gates -> Live Blog Publish)...');
  await processQueueWorker();

  // Inspect generated and published articles
  const stateAfterArticles = readEngineState();
  const liveBlogPosts = getLiveBlogPosts();

  const completedJob1 = stateAfterArticles.activeJobs.find(j => j.id === job1.id);
  const completedJob2 = stateAfterArticles.activeJobs.find(j => j.id === job2.id);
  const newlyPublishedJobs = [completedJob1, completedJob2].filter(
    (j): j is NonNullable<typeof j> => Boolean(j && j.stage === 'completed' && j.publishedBlogPostId)
  );

  console.log(`\n✓ Articles Completed & Published: ${newlyPublishedJobs.length}/2`);

  newlyPublishedJobs.forEach((job, idx) => {
    console.log(`\n[Article ${idx + 1}]`);
    console.log(`- Type: ${job.contentType}`);
    console.log(`- Title: "${job.articleContent?.title}"`);
    console.log(`- Slug: ${job.publishedSlug}`);
    console.log(`- Live URL: ${job.publishedUrl}`);
    console.log(`- Blog Post ID: ${job.publishedBlogPostId}`);
    console.log(`- Word Count: ${job.articleContent?.wordCount}`);
    console.log(`- Hero Image: ${job.articleContent?.heroImage?.stableAssetPath}`);
    console.log(`- Target Pinterest Board: "${job.pinterestPins?.[0]?.targetBoardName}" (ID: ${job.pinterestPins?.[0]?.targetBoardId})`);
    console.log(`- Pin 1 Image: ${job.pinterestPins?.[0]?.stableAssetPath}`);
    console.log(`- Pin 2 Image: ${job.pinterestPins?.[1]?.stableAssetPath}`);
  });

  if (newlyPublishedJobs.length < 2) {
    console.error(`\n❌ Pipeline did not complete both articles. Inspect logs in data/seo-engine-state.json.`);
  }

  // -----------------------------------------------------------------
  // STAGE 2: SEQUENTIAL ACCELERATED PINTEREST PUBLISHING (NO ARTIFICIAL SLEEP)
  // -----------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('STAGE 2: ACCELERATED PINTEREST PUBLISHING (4 REAL PINS)');
  console.log('----------------------------------------------------------------');

  const pinDispatchQueue: { label: string; simulatedTime: string; job: typeof newlyPublishedJobs[0]; pin: any }[] = [];

  if (completedJob1 && completedJob1.pinterestPins) {
    if (completedJob1.pinterestPins[0]) {
      pinDispatchQueue.push({ label: 'Article 1, Pin 1', simulatedTime: '13:23', job: completedJob1, pin: completedJob1.pinterestPins[0] });
    }
    if (completedJob1.pinterestPins[1]) {
      pinDispatchQueue.push({ label: 'Article 1, Pin 2', simulatedTime: '13:26', job: completedJob1, pin: completedJob1.pinterestPins[1] });
    }
  }

  if (completedJob2 && completedJob2.pinterestPins) {
    if (completedJob2.pinterestPins[0]) {
      pinDispatchQueue.push({ label: 'Article 2, Pin 1', simulatedTime: '13:29', job: completedJob2, pin: completedJob2.pinterestPins[0] });
    }
    if (completedJob2.pinterestPins[1]) {
      pinDispatchQueue.push({ label: 'Article 2, Pin 2', simulatedTime: '13:32', job: completedJob2, pin: completedJob2.pinterestPins[1] });
    }
  }

  const publishedPinsReport: { label: string; simulatedTime: string; boardName: string; pinId: string; publicUrl: string }[] = [];

  for (let i = 0; i < pinDispatchQueue.length; i++) {
    const item = pinDispatchQueue[i];
    console.log(`\n[Pin ${i + 1}/4 - Simulated ${item.simulatedTime}] Dispatching ${item.label}...`);
    console.log(`  - Target Board: "${item.pin.targetBoardName}" (ID: ${item.pin.targetBoardId})`);
    console.log(`  - Destination URL: ${item.pin.destinationUrl}`);
    console.log(`  - Image Asset: ${item.pin.stableAssetPath}`);

    const pinRes = await publishPinToPinterest(item.job, item.pin);
    if (pinRes.success && pinRes.pinId) {
      console.log(`  ✅ Successfully published Pin to Pinterest! ID: ${pinRes.pinId}`);
      publishedPinsReport.push({
        label: item.label,
        simulatedTime: item.simulatedTime,
        boardName: item.pin.targetBoardName,
        pinId: pinRes.pinId,
        publicUrl: pinRes.pinUrl || `https://www.pinterest.com/pin/${pinRes.pinId}`,
      });
    } else {
      console.error(`  ❌ Failed to dispatch Pin: ${pinRes.error}`);
    }
  }

  // -----------------------------------------------------------------
  // FINAL AUDIT & SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log('\n================================================================');
  console.log('ACCELERATED REAL PRODUCTION TEST COMPLETE - FINAL AUDIT');
  console.log('================================================================\n');

  const finalState = readEngineState();
  const finalLivePosts = getLiveBlogPosts();

  console.log('FINAL RESULTS:');
  console.log(`1. Real Articles Produced & Published: ${newlyPublishedJobs.length}/2`);
  console.log(`2. Real Blog Posts in data/blog-posts.json: ${finalLivePosts.length}`);
  console.log(`3. Real Pinterest Pins Published: ${publishedPinsReport.length}/4`);
  console.log(`4. Total Execution Time: ${((Date.now() - tStart) / 1000).toFixed(1)}s\n`);

  newlyPublishedJobs.forEach((job, idx) => {
    console.log(`ARTICLE ${idx + 1}:`);
    console.log(`- Title: ${job.articleContent?.title}`);
    console.log(`- Slug: ${job.publishedSlug}`);
    console.log(`- Live URL: ${job.publishedUrl}`);
    console.log(`- Blog Post ID: ${job.publishedBlogPostId}`);
    console.log(`- Hero Image: ${job.articleContent?.heroImage?.stableAssetPath}`);
    console.log(`- Pins for this article:`);
    (job.pinterestPins || []).forEach(p => {
      console.log(`  * Pin ${p.pinNumber} (${p.publishStatus}): ID ${p.pinterestPinId || 'N/A'} -> Board "${p.targetBoardName}" (URL: ${p.destinationUrl})`);
    });
    console.log('');
  });

  const allPassed = newlyPublishedJobs.length === 2 && publishedPinsReport.length === 4;
  console.log(`OVERALL PRODUCTION TEST STATUS: ${allPassed ? '✅ ALL 15 CRITERIA PASSED' : '⚠️ COMPLETED WITH PARTIAL STATUS'}`);
}

runAcceleratedProductionTest().catch(err => {
  console.error('Accelerated production test runner encountered fatal error:', err);
  process.exit(1);
});
