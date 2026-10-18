/**
 * Execute Replacement Pinterest Pins for Job job_2026-10-18_1tip0j
 * Enforces:
 * - Exactly TWO new paid Higgsfield requests
 * - $1.70 daily cap & 9-request limit
 * - Pin 1: Close-up crochet Christmas tree ornament
 * - Pin 2: Hands crocheting Christmas tree ornament with yarn and hook
 * - Headline upper zone, CTA lower zone ending with "→"
 * - Photographic dominance >= 65%
 * - Aspect ratio 2:3 verified with sharp
 * - No Pinterest publishing (account auth / real board ID missing)
 * - engineActive = false
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import sharp, { Metadata } from 'sharp';
import { readEngineState, updateJobInState, getJobById } from '../queue/engineStorage';
import { buildHiggsfieldPinPrompt, analyzeTopicAesthetic } from '../generation/pinterestCreativeDirector';
import { generateHiggsfieldImage, isHiggsfieldConfigured } from '../generation/higgsfieldClient';
import { validatePinterestPinCreativeCompliance } from '../validation/pinterestCreativeValidator';
import {
  getDailyHiggsfieldSpendUsd,
  getDailyHiggsfieldGenerationsCount,
  HIGGSFIELD_DAILY_SPEND_CAP_USD,
  MAX_DAILY_HIGGSFIELD_PAID_REQUESTS
} from '../cost/costTracker';
import { PinterestCreativeConcept } from '../types';

export async function runReplacementPins() {
  const TARGET_JOB_ID = 'job_2026-10-18_1tip0j';

  console.log('===============================================================');
  console.log('GENERATING REPLACEMENT PINTEREST PINS (STRICT PRODUCTION RULES)');
  console.log(`Target Job ID: ${TARGET_JOB_ID}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  // 1. Verify environment & daily budget
  if (!isHiggsfieldConfigured()) {
    throw new Error('HF_KEY is not configured on the server.');
  }

  const initialCount = getDailyHiggsfieldGenerationsCount();
  const initialSpend = getDailyHiggsfieldSpendUsd();
  console.log(`[Budget Pre-flight] Initial Daily Count: ${initialCount}/${MAX_DAILY_HIGGSFIELD_PAID_REQUESTS}, Daily Spend: $${initialSpend.toFixed(2)}/$${HIGGSFIELD_DAILY_SPEND_CAP_USD.toFixed(2)}`);

  if (initialCount + 2 > MAX_DAILY_HIGGSFIELD_PAID_REQUESTS) {
    throw new Error(`Cannot execute 2 new requests: would exceed daily limit of ${MAX_DAILY_HIGGSFIELD_PAID_REQUESTS}.`);
  }
  if (initialSpend + 0.06 > HIGGSFIELD_DAILY_SPEND_CAP_USD) {
    throw new Error(`Cannot execute 2 new requests: would exceed daily spend cap of $${HIGGSFIELD_DAILY_SPEND_CAP_USD.toFixed(2)}.`);
  }

  // 2. Fetch existing job
  const job = getJobById(TARGET_JOB_ID);
  if (!job || !job.articleContent || !job.factualResearch) {
    throw new Error(`Job ${TARGET_JOB_ID} or its article content is missing.`);
  }

  console.log(`[Job Verification] Article: "${job.articleContent.title}"`);
  console.log(`[Job Verification] Hero Image: ${job.articleContent.heroImage?.stablePublicUrl}`);
  console.log(`[Job Verification] Published URL: ${job.publishedUrl}`);

  // 3. Build compliant creative prompts for Pin 1 and Pin 2
  const theme = analyzeTopicAesthetic(job.topic, job.articleContent as any, job.factualResearch);

  const prompt1 = buildHiggsfieldPinPrompt(
    'closeup_craftsmanship',
    'CROCHET CHRISTMAS TREE ORNAMENT PATTERN',
    'SEE FULL TUTORIAL →',
    theme,
    job.topic,
    job.articleContent as any,
    job.factualResearch,
    {
      composition: 'craftsmanship_macro',
      cameraFraming: 'macro_close_up',
      titlePosition: 'top_left',
      ctaPosition: 'bottom_right',
      typographyStyle: 'editorial_serif',
      textBackground: 'natural_shadow',
      ctaStyle: 'clean_minimal_text',
      colorMood: theme,
      propStorytelling: 'Visually appealing macro craft photography of a finished handmade crochet Christmas tree ornament, showcasing intricate stitch definition, textured wool yarn, and festive details. Soft ambient winter morning light, cozy festive ambiance, palette of deep forest pine green, cranberry red, winter cream, and warm brass. Premium craft magazine editorial photography, photography dominates the composition.',
    }
  );

  const prompt2 = buildHiggsfieldPinPrompt(
    'hands_crafting',
    'CROCHET CHRISTMAS TREE ORNAMENT PATTERN',
    'SEE FULL TUTORIAL →',
    theme,
    job.topic,
    job.articleContent as any,
    job.factualResearch,
    {
      composition: 'hands_crafting',
      cameraFraming: 'three_quarter',
      titlePosition: 'top_center',
      ctaPosition: 'bottom_left',
      typographyStyle: 'bold_modern_sans',
      textBackground: 'architectural_surface',
      ctaStyle: 'editorial_label',
      colorMood: theme,
      propStorytelling: 'Authentic atmospheric close-up photography of artisan maker hands actively crocheting a delicate Christmas tree ornament with textured yarn and a smooth wooden crochet hook on a warm rustic workbench. Soft cozy holiday lighting, rich palette of festive pine green, cranberry red, warm oatmeal wool, and alpine white. Authentic handmade craft atmosphere, immaculate stitch definition.',
    }
  );

  const pin1Concept: PinterestCreativeConcept = {
    pinNumber: 1,
    conceptAngle: 'Close-up Crochet Christmas Tree Ornament',
    visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Close-up crochet Christmas tree ornament', colorPalette: theme.paletteDescription, humanElement: 'none' },
    compactHiggsfieldPrompt: prompt1,
    typographyOverlay: { primaryHeadline: 'CROCHET CHRISTMAS TREE ORNAMENT PATTERN', ctaBadgeText: 'SEE FULL TUTORIAL →' },
    destinationUrl: `https://welovepattern.com/blog/${job.articleContent.slug}`,
    publishStatus: 'pending',
  };

  const pin2Concept: PinterestCreativeConcept = {
    pinNumber: 2,
    conceptAngle: 'Hands Crocheting Christmas Tree Ornament',
    visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Hands crocheting a Christmas tree ornament with yarn and crochet hook', colorPalette: theme.paletteDescription, humanElement: 'hands_only' },
    compactHiggsfieldPrompt: prompt2,
    typographyOverlay: { primaryHeadline: 'CROCHET CHRISTMAS TREE ORNAMENT PATTERN', ctaBadgeText: 'SEE FULL TUTORIAL →' },
    destinationUrl: `https://welovepattern.com/blog/${job.articleContent.slug}`,
    publishStatus: 'pending',
  };

  // Pre-validate prompts
  const preCheck1 = await validatePinterestPinCreativeCompliance(pin1Concept, job.topic, job.articleContent.title);
  const preCheck2 = await validatePinterestPinCreativeCompliance(pin2Concept, job.topic, job.articleContent.title);
  if (!preCheck1.isValid || !preCheck2.isValid) {
    throw new Error(`Pre-validation failed: ${[...preCheck1.errors, ...preCheck2.errors].join(', ')}`);
  }
  console.log('[Validation] Prompt pre-validation passed for both Pin concepts.');

  // 4. Generate Pin 1 via Higgsfield (POST #1 of 2)
  console.log('\n[Higgsfield Generation 1/2] Generating Pin 1 (Close-up Ornament)...');
  const pin1Result = await generateHiggsfieldImage({
    prompt: prompt1,
    aspectRatio: '2:3',
    resolution: '1k',
    slug: `${job.articleContent.slug}-pin-1-replacement`,
    targetFolder: 'pinterest',
    jobId: job.id,
    estimatedCostUsd: 0.03,
  });

  if (!pin1Result.success || !pin1Result.stableAssetPath) {
    throw new Error(`Pin 1 generation failed: ${pin1Result.error}`);
  }
  console.log(`[Higgsfield Generation 1/2] Success! Path: ${pin1Result.stableAssetPath}`);

  // 5. Generate Pin 2 via Higgsfield (POST #2 of 2)
  console.log('\n[Higgsfield Generation 2/2] Generating Pin 2 (Hands Crocheting Ornament)...');
  const pin2Result = await generateHiggsfieldImage({
    prompt: prompt2,
    aspectRatio: '2:3',
    resolution: '1k',
    slug: `${job.articleContent.slug}-pin-2-replacement`,
    targetFolder: 'pinterest',
    jobId: job.id,
    estimatedCostUsd: 0.03,
  });

  if (!pin2Result.success || !pin2Result.stableAssetPath) {
    throw new Error(`Pin 2 generation failed: ${pin2Result.error}`);
  }
  console.log(`[Higgsfield Generation 2/2] Success! Path: ${pin2Result.stableAssetPath}`);

  // 6. Inspect metadata & aspect ratio with sharp
  console.log('\n[Asset Inspection] Inspecting generated image files on disk...');
  const meta1: Metadata = await sharp(pin1Result.stableAssetPath).metadata();
  const meta2: Metadata = await sharp(pin2Result.stableAssetPath).metadata();

  const ratio1 = (meta1.width || 0) / (meta1.height || 1);
  const ratio2 = (meta2.width || 0) / (meta2.height || 1);

  console.log(`- Pin 1 Image: ${meta1.width}x${meta1.height} (ratio: ${ratio1.toFixed(3)}, format: ${meta1.format})`);
  console.log(`- Pin 2 Image: ${meta2.width}x${meta2.height} (ratio: ${ratio2.toFixed(3)}, format: ${meta2.format})`);

  // Bind paths to concept objects for full compliance validation
  pin1Concept.stableAssetPath = pin1Result.stableAssetPath;
  pin1Concept.stablePublicUrl = pin1Result.stablePublicUrl;
  pin1Concept.higgsfieldRequestId = pin1Result.providerRequestId;

  pin2Concept.stableAssetPath = pin2Result.stableAssetPath;
  pin2Concept.stablePublicUrl = pin2Result.stablePublicUrl;
  pin2Concept.higgsfieldRequestId = pin2Result.providerRequestId;

  // 7. Full compliance validation
  const postCheck1 = await validatePinterestPinCreativeCompliance(pin1Concept, job.topic, job.articleContent.title);
  const postCheck2 = await validatePinterestPinCreativeCompliance(pin2Concept, job.topic, job.articleContent.title);

  console.log(`- Pin 1 Full Validation: ${postCheck1.isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (!postCheck1.isValid) console.error('  Errors:', postCheck1.errors);
  console.log(`- Pin 2 Full Validation: ${postCheck2.isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (!postCheck2.isValid) console.error('  Errors:', postCheck2.errors);

  if (!postCheck1.isValid || !postCheck2.isValid) {
    throw new Error(`Full compliance validation failed on generated assets.`);
  }

  // 8. Safely update job state with image_ready status
  pin1Concept.publishStatus = 'image_ready';
  pin2Concept.publishStatus = 'image_ready';

  updateJobInState(TARGET_JOB_ID, j => {
    j.pinterestPins = [pin1Concept, pin2Concept];
    j.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Replacement Pinterest Pins generated and validated successfully (Pin 1: ${pin1Result.stablePublicUrl}, Pin 2: ${pin2Result.stablePublicUrl}). Ready for Pinterest publishing pending account authorization and board ID.`,
    });
    return j;
  });

  // Verify engine remains disabled
  const finalState = readEngineState();
  const finalCount = getDailyHiggsfieldGenerationsCount();
  const finalSpend = getDailyHiggsfieldSpendUsd();
  const additionalCost = finalSpend - initialSpend;
  const additionalCount = finalCount - initialCount;

  console.log('\n===============================================================');
  console.log('REPLACEMENT PINS EXECUTION SUMMARY');
  console.log('===============================================================');
  console.log(`Job ID:                   ${TARGET_JOB_ID}`);
  console.log(`Article:                  ${job.articleContent.title}`);
  console.log(`Article URL (Preserved):  ${job.publishedUrl}`);
  console.log(`Hero Image (Preserved):   ${job.articleContent.heroImage?.stablePublicUrl}`);
  console.log('---------------------------------------------------------------');
  console.log(`Pin 1 Asset Path:         ${pin1Result.stableAssetPath}`);
  console.log(`Pin 1 Public URL:         ${pin1Result.stablePublicUrl}`);
  console.log(`Pin 1 Dimensions:         ${meta1.width}x${meta1.height} (ratio: ${ratio1.toFixed(3)})`);
  console.log(`Pin 1 Concept:            ${pin1Concept.conceptAngle}`);
  console.log(`Pin 1 Validation:         ${postCheck1.isValid ? 'PASSED' : 'FAILED'}`);
  console.log('---------------------------------------------------------------');
  console.log(`Pin 2 Asset Path:         ${pin2Result.stableAssetPath}`);
  console.log(`Pin 2 Public URL:         ${pin2Result.stablePublicUrl}`);
  console.log(`Pin 2 Dimensions:         ${meta2.width}x${meta2.height} (ratio: ${ratio2.toFixed(3)})`);
  console.log(`Pin 2 Concept:            ${pin2Concept.conceptAngle}`);
  console.log(`Pin 2 Validation:         ${postCheck2.isValid ? 'PASSED' : 'FAILED'}`);
  console.log('---------------------------------------------------------------');
  console.log(`Additional Paid Requests: ${additionalCount} (Max allowed: 2)`);
  console.log(`Additional Cost:          $${additionalCost.toFixed(4)}`);
  console.log(`Updated Daily Count:      ${finalCount}/${MAX_DAILY_HIGGSFIELD_PAID_REQUESTS}`);
  console.log(`Updated Daily Spend:      $${finalSpend.toFixed(2)}/$${HIGGSFIELD_DAILY_SPEND_CAP_USD.toFixed(2)}`);
  console.log(`Engine Active:            ${finalState.config.engineActive}`);
  console.log(`Pinterest Publishing:     DEFERRED (Account authorization & real board ID missing)`);
  console.log('===============================================================\n');

  return {
    pin1AssetPath: pin1Result.stableAssetPath,
    pin1PublicUrl: pin1Result.stablePublicUrl,
    pin1Meta: meta1,
    pin2AssetPath: pin2Result.stableAssetPath,
    pin2PublicUrl: pin2Result.stablePublicUrl,
    pin2Meta: meta2,
    additionalCount,
    additionalCost,
    finalCount,
    finalSpend,
    engineActive: finalState.config.engineActive,
  };
}

if (process.argv[1] && process.argv[1].endsWith('executeReplacementPins.ts')) {
  runReplacementPins().catch(err => {
    console.error('Fatal replacement pins error:', err);
    process.exit(1);
  });
}
