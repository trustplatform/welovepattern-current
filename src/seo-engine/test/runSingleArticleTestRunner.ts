/**
 * Controlled Single Article Test Runner
 * Topic: "gauge swatch calculator"
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { executeJobLifecycle, queueJobForTopic } from '../queue/jobQueueManager';
import { DiscoveredTopic, SeoEngineArticleJob } from '../types';

export async function runSingleArticleTest(): Promise<SeoEngineArticleJob> {
  console.log('===============================================================');
  console.log('STARTING CONTROLLED SINGLE-ARTICLE PRODUCTION TEST RUN');
  console.log('===============================================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Topic: "gauge swatch calculator"`);

  const topic: DiscoveredTopic = {
    id: 'test_topic_gauge_swatch_calculator',
    keyword: 'gauge swatch calculator',
    contentType: 'tool_guide',
    category: 'tools',
    toolSlug: 'gauge-calculator',
    source: 'gsc_seed',
    opportunityScore: 95,
    targetContentFormat: 'tool_focus',
    targetToolUrl: '/tools/gauge-calculator',
    targetCategoryUrl: '/category/tools',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'High intent maker query for comparing swatch measurements against pattern gauge.',
    discoveredAt: new Date().toISOString(),
    status: 'selected',
  };

  const currentState = readEngineState();
  const existingJob = currentState.activeJobs.find(
    j => j.topic.keyword.toLowerCase() === topic.keyword.toLowerCase()
  );

  let jobToRunId: string;

  if (existingJob) {
    jobToRunId = existingJob.id;
    console.log(`[JobQueue] Reusing job ${existingJob.id} (previous stage: "${existingJob.stage}")`);
    updateJobInState(existingJob.id, j => {
      j.stage = 'selected';
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Restarting single article test run after Stage 5 Quality Gate fix.',
      });
      return j;
    });
  } else {
    const queuedJob = queueJobForTopic(topic, {
      ...currentState.config,
      autoPublish: false,
      autoPublishPinterest: false,
      requiresApproval: true,
      pinsPerArticle: 2,
    });
    jobToRunId = queuedJob.id;
    console.log(`[JobQueue] Created new job ${queuedJob.id}`);
  }

  console.log(`[JobRunner] Executing lifecycle for job: ${jobToRunId}...`);
  const completedJob = await executeJobLifecycle(jobToRunId, { allowTestFallbackBoard: true });

  console.log('\n===============================================================');
  console.log('SINGLE ARTICLE LIFECYCLE EXECUTION RESULT');
  console.log('===============================================================');
  console.log(`Job ID:          ${completedJob.id}`);
  console.log(`Final Stage:     ${completedJob.stage}`);
  console.log(`Requires Review: ${completedJob.requiresApproval}`);
  console.log(`Word Count:      ${completedJob.articleContent?.wordCount || 0}`);
  console.log(`Article Title:   ${completedJob.articleContent?.title}`);
  console.log(`Article Slug:    ${completedJob.articleContent?.slug}`);
  console.log('---------------------------------------------------------------');
  console.log('VISUAL ASSETS SUMMARY:');
  
  const hero = completedJob.articleContent?.heroImage;
  console.log(`1. Hero Image (16:9, 1k):`);
  console.log(`   - Status:      ${hero?.status}`);
  console.log(`   - Request ID:  ${hero?.higgsfieldRequestId}`);
  console.log(`   - Public URL:  ${hero?.stablePublicUrl}`);
  console.log(`   - File Exists: ${hero?.stableAssetPath && fs.existsSync(hero?.stableAssetPath)} (${hero?.stableAssetPath && fs.existsSync(hero?.stableAssetPath) ? fs.statSync(hero?.stableAssetPath).size + ' bytes' : 'N/A'})`);

  if (completedJob.pinterestPins) {
    completedJob.pinterestPins.forEach((pin, idx) => {
      console.log(`\n${idx + 2}. Pin ${pin.pinNumber} (2:3, 1k) [${pin.conceptAngle}]:`);
      console.log(`   - Status:         ${pin.publishStatus}`);
      console.log(`   - Request ID:     ${pin.higgsfieldRequestId}`);
      console.log(`   - Public URL:     ${pin.stablePublicUrl}`);
      console.log(`   - File Exists:    ${pin.stableAssetPath && fs.existsSync(pin.stableAssetPath)} (${pin.stableAssetPath && fs.existsSync(pin.stableAssetPath) ? fs.statSync(pin.stableAssetPath).size + ' bytes' : 'N/A'})`);
      console.log(`   - Primary Title:  "${pin.typographyOverlay.primaryHeadline}"`);
      console.log(`   - Supporting:     "${pin.typographyOverlay.supportingText}"`);
      console.log(`   - CTA Badge:      "${pin.typographyOverlay.ctaBadgeText}"`);
      console.log(`   - Style / Layout: "${pin.typographyOverlay.textContainerStyle}"`);
      console.log(`   - Concept Prompt: "${pin.compactHiggsfieldPrompt}"`);
    });
  }
  console.log('===============================================================\n');

  return completedJob;
}

if (process.argv[1] && process.argv[1].endsWith('runSingleArticleTestRunner.ts')) {
  runSingleArticleTest().catch(err => {
    console.error('Fatal single article runner error:', err);
    process.exit(1);
  });
}
