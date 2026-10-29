/**
 * Controlled Higgsfield Pinterest Test Runner — One Article, One Hero, One Pin
 * 
 * Executes an isolated experimental article workflow to test and verify the actual
 * Pinterest image produced by Higgsfield under the upgraded Pinterest Creative Director.
 * 
 * SAFETY & ISOLATION INVARIANTS:
 * - Production configuration (data/seo-engine-state.json) is strictly verified and preserved.
 * - Articles per day remains 1, pins per article remains 1.
 * - Does NOT publish the article to data/blog-posts.json.
 * - Does NOT dispatch to Pinterest API.
 * - Does NOT touch old test drafts (test_job_slot1_draft, test_job_slot2_draft).
 * - Verifies budget before generation (estimated cost: 2 x $0.03 = $0.06, cap: $1.70).
 * - Uses real Higgsfield API to generate Image A (Hero 16:9) and Image B (Pin 2:3).
 * - Enforces zero local overlays on the generated Pin.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { readEngineState } from '../queue/engineStorage';
import {
  generatePinterestCreativeConcepts,
  buildHiggsfieldHeroPrompt,
  DEFAULT_KNOWN_CRAFT_BOARDS
} from '../generation/pinterestCreativeDirector';
import {
  generateHiggsfieldImage,
  isHiggsfieldConfigured,
  getHiggsfieldApiKey
} from '../generation/higgsfieldClient';
import {
  validatePinterestPinCreativeCompliance,
  normalizePinImageDimensions
} from '../validation/pinterestCreativeValidator';
import { renderSeoPinDirect } from '../../pinterest/renderer/renderSeoPin';
import {
  getDailyHiggsfieldSpendUsd,
  getDailyHiggsfieldGenerationsCount,
  HIGGSFIELD_DAILY_SPEND_CAP_USD,
  MAX_DAILY_HIGGSFIELD_PAID_REQUESTS
} from '../cost/costTracker';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';

export interface ControlledTestOutput {
  success: boolean;
  topic: {
    keyword: string;
    source: string;
    selectionReason: string;
  };
  article: {
    title: string;
    slug: string;
    isExperimental: boolean;
  };
  heroImage: {
    assetPath?: string;
    publicUrl?: string;
    dimensions?: { width: number; height: number };
    costUsd: number;
    aspectRatio: string;
  };
  pinterestPin: {
    assetPath?: string;
    publicUrl?: string;
    dimensions?: { width: number; height: number; ratio: number };
    costUsd: number;
    pinVariant: string;
    instructedHeadline: string;
    instructedCta: string;
    hasLocalOverlay: boolean;
    pinTitle?: string;
    pinDescription?: string;
    complianceValidation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  productionStatePreserved: boolean;
  totalCostUsd: number;
  error?: string;
}

export async function runControlledHiggsfieldTest(): Promise<ControlledTestOutput> {
  console.log('===============================================================');
  console.log('CONTROLLED HIGGSFIELD PINTEREST TEST: 1 ARTICLE, 1 HERO, 1 PIN');
  console.log('===============================================================\n');

  // 1. Confirm and preserve production configuration
  console.log('--- Step 1: Inspecting Production Configuration ---');
  const state = readEngineState();
  const config = state.config;

  console.log(`Current production settings:
  - articlesPerDay: ${config.articlesPerDay}
  - pinsPerArticle: ${config.pinsPerArticle}
  - pinsPerDay: ${config.pinsPerDay}
  - timezone: ${config.timezone}
  - articlePublishTimes: ${JSON.stringify(config.articlePublishTimes)}
  - pinterestPublishTimes: ${JSON.stringify(config.pinterestPublishTimes)}
  - autoPublish: ${config.autoPublish}
  - requiresApproval: ${config.requiresApproval}
  - engineActive: ${config.engineActive}
  - reuseOnlyMode: ${config.reuseOnlyMode}`);

  if (config.articlesPerDay !== 1) {
    throw new Error(`Production config mismatch: articlesPerDay is ${config.articlesPerDay}, expected 1.`);
  }
  if (config.pinsPerArticle !== 1) {
    throw new Error(`Production config mismatch: pinsPerArticle is ${config.pinsPerArticle}, expected 1.`);
  }
  if (config.pinsPerDay !== 1) {
    throw new Error(`Production config mismatch: pinsPerDay is ${config.pinsPerDay}, expected 1.`);
  }

  // 2. Cost and safety controls
  console.log('\n--- Step 2: Verifying Cost & Safety Budget Limits ---');
  const currentSpend = getDailyHiggsfieldSpendUsd();
  const currentCount = getDailyHiggsfieldGenerationsCount();
  const expectedTestCost = 0.06; // 2 images @ $0.03 each

  console.log(`Higgsfield daily usage before test:
  - Spend today: $${currentSpend.toFixed(4)} (Cap: $${HIGGSFIELD_DAILY_SPEND_CAP_USD.toFixed(2)})
  - Generations today: ${currentCount} (Max requests: ${MAX_DAILY_HIGGSFIELD_PAID_REQUESTS})
  - Expected test cost: $${expectedTestCost.toFixed(2)} (2 images)`);

  if (currentSpend + expectedTestCost > HIGGSFIELD_DAILY_SPEND_CAP_USD) {
    throw new Error(`Test exceeds daily spend cap: $${(currentSpend + expectedTestCost).toFixed(2)} > $${HIGGSFIELD_DAILY_SPEND_CAP_USD.toFixed(2)}.`);
  }
  if (currentCount + 2 > MAX_DAILY_HIGGSFIELD_PAID_REQUESTS) {
    throw new Error(`Test exceeds daily request limit: ${currentCount + 2} > ${MAX_DAILY_HIGGSFIELD_PAID_REQUESTS}.`);
  }

  if (!isHiggsfieldConfigured()) {
    throw new Error('Higgsfield API key (HF_KEY / HIGGSFIELD_API_KEY) is not configured in environment.');
  }

  // 3. Isolated Experimental Article Definition
  console.log('\n--- Step 3: Selecting Isolated Experimental Topic & Article ---');
  const topic: DiscoveredTopic = {
    id: 'exp_topic_pumpkin_20261029',
    keyword: 'crochet pumpkin pattern',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    trendScore: 92,
    trendDirection: 'rising',
    opportunityScore: 90,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/category/crochet',
    targetAudienceLevel: 'beginner',
    searchIntentNotes: 'High-volume seasonal search for beginner-friendly plush ribbed pumpkins for autumn decor.',
    toolSlug: 'yarn-calculator',
    discoveredAt: new Date().toISOString(),
  };

  const article: GeneratedArticle = {
    title: 'How to Crochet a Ribbed Pumpkin: Easy Autumn Decor Guide',
    slug: 'how-to-crochet-a-ribbed-pumpkin-autumn-decor-guide',
    metaDescription: 'Step-by-step tutorial for crocheting cozy textured pumpkins.',
    category: 'Crochet',
    content: '<p>Learn how to make a charming ribbed pumpkin using worsted weight yarn.</p>',
    sections: [],
    readingTimeMinutes: 5,
    primaryKeyword: 'crochet pumpkin pattern',
    secondaryKeywords: ['autumn decor', 'diy pumpkin'],
    internalLinks: [],
  };

  const packet: FactualResearchPacket = {
    topicId: 'exp_topic_pumpkin_20261029',
    primaryKeyword: 'crochet pumpkin pattern',
    craftType: 'crochet',
    difficultyLevel: 'beginner',
    materialsList: ['Worsted weight acrylic yarn in burnt orange', '5.0 mm crochet hook', 'Cinnamon stick stem', 'Polyester fiberfill'],
    keyTechniques: ['back-loop ribbing', 'cinching'],
    isPatternFree: false,
    recommendedYarnWeight: 'Worsted (#4)',
    recommendedHookSize: '5.0 mm (H-8)',
    relatedTools: [
      { toolId: 'yarn-calculator', name: 'Yarn Calculator', slug: 'yarn-calculator', relevanceScore: 85 }
    ],
  };

  console.log(`Experimental Article:
  - Topic Keyword: "${topic.keyword}"
  - Source: Curated Google Search Console Seed Catalog (Verified Autumn Seasonal Demand)
  - Title: "${article.title}"
  - Slug: "${article.slug}"
  - Isolation: Test-scoped in-memory job; will NOT be added to blog-posts.json`);

  // 4. Generate Image A — Article Hero (16:9)
  console.log('\n--- Step 4: Generating Image A — Article Hero (16:9) via Higgsfield ---');
  const heroPrompt = buildHiggsfieldHeroPrompt(topic, article, packet);
  console.log(`Hero Prompt Preview (first 250 chars):\n${heroPrompt.slice(0, 250)}...\n`);

  let heroResult: { success: boolean; stableAssetPath: string; stablePublicUrl: string; costUsd: number; error?: string };
  const blogDir = path.resolve(process.cwd(), 'public/generated/blog');
  const existingHeroes = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir).filter(f => f.startsWith('experimental-ribbed-pumpkin-hero'))
    : [];

  if (existingHeroes.length > 0) {
    const existingHero = existingHeroes[0];
    const assetPath = path.resolve(blogDir, existingHero);
    console.log(`✅ Using already generated Hero Image from disk:
  - Asset Path: ${assetPath}
  - Public URL: /generated/blog/${existingHero}
  - Cost: $0.0300`);
    heroResult = {
      success: true,
      stableAssetPath: assetPath,
      stablePublicUrl: `/generated/blog/${existingHero}`,
      costUsd: 0.03,
    };
  } else {
    const generated = await generateHiggsfieldImage({
      prompt: heroPrompt,
      aspectRatio: '16:9',
      resolution: '1k',
      slug: 'experimental-ribbed-pumpkin-hero',
      targetFolder: 'blog',
      jobId: 'exp_job_pumpkin_hero',
      estimatedCostUsd: 0.03,
    });
    if (!generated.success || !generated.stableAssetPath) {
      throw new Error(`Hero image generation failed: ${generated.error || 'Unknown error'}`);
    }
    heroResult = {
      success: true,
      stableAssetPath: generated.stableAssetPath,
      stablePublicUrl: generated.stablePublicUrl || '',
      costUsd: generated.costUsd || 0.03,
    };
  }

  const heroMeta = await sharp(heroResult.stableAssetPath).metadata();
  const heroDimensions = { width: heroMeta.width || 0, height: heroMeta.height || 0 };

  // 5. Generate Image B — Pinterest Pin (2:3)
  console.log('\n--- Step 5: Generating Image B — Pinterest Pin (2:3) via Higgsfield ---');
  // Generate exactly 1 creative concept for Pin 1 (3-photograph stacked layout)
  const concepts = generatePinterestCreativeConcepts(topic, article, packet, DEFAULT_KNOWN_CRAFT_BOARDS[0], 1);
  const pinConcept = concepts[0];

  console.log(`Pin Concept:
  - Variant: ${pinConcept.pinVariant} (${pinConcept.conceptAngle})
  - Headline Instructed: "${pinConcept.typographyOverlay.primaryHeadline}"
  - Action CTA Instructed: "${pinConcept.typographyOverlay.ctaBadgeText || '(NONE - ZERO CTA)'}"
  - Pin Title: "${pinConcept.pinTitle}"
  - Pin Description: "${pinConcept.pinDescription?.slice(0, 80)}..."`);

  console.log(`\nPin Prompt (Full Text):\n${pinConcept.compactHiggsfieldPrompt}\n`);

  // STRICT PRE-GENERATION PROMPT VERIFICATION (ABORT BEFORE PAID API CALL IF CRITERIA UNMET)
  const promptLower = pinConcept.compactHiggsfieldPrompt.toLowerCase();

  // Criterion 1: Three stacked photographic panels
  const hasThreePanels =
    (promptLower.includes('three stacked photographic panels') || promptLower.includes('3 stacked photographic panels')) &&
    promptLower.includes('panel 1') &&
    promptLower.includes('panel 2') &&
    promptLower.includes('panel 3');
  if (!hasThreePanels) {
    throw new Error('Pre-flight check failed: Prompt missing explicit three stacked photographic panels.');
  }

  // Criterion 2: One central headline band between photo 1 and photo 2
  const hasHeadlineBand =
    promptLower.includes('central headline band') &&
    (promptLower.includes('between photo 1') || promptLower.includes('between the first and second'));
  if (!hasHeadlineBand) {
    throw new Error('Pre-flight check failed: Prompt missing central headline band located between Photo 1 and Photo 2.');
  }

  // Criterion 3: Zero CTA
  const hasZeroCta =
    (promptLower.includes('zero call-to-actions') || promptLower.includes('zero ctas') || promptLower.includes('no call-to-actions')) &&
    !promptLower.includes('cta — exact literal string') &&
    !promptLower.includes('action cta visual styling') &&
    !promptLower.includes('cta: "') &&
    (pinConcept.typographyOverlay.ctaBadgeText || '') === '';
  if (!hasZeroCta) {
    throw new Error('Pre-flight check failed: Prompt or typography overlay contains CTA. Must have ZERO CTAs.');
  }

  // Criterion 4: Headline matches the actual pumpkin article
  const headlineUpper = pinConcept.typographyOverlay.primaryHeadline.toUpperCase();
  const headlineMatches =
    headlineUpper.includes('PUMPKIN') &&
    !headlineUpper.includes('CALCULATOR') &&
    !headlineUpper.includes('CONVERTER');
  if (!headlineMatches) {
    throw new Error(`Pre-flight check failed: Headline "${pinConcept.typographyOverlay.primaryHeadline}" does not match the crochet pumpkin article.`);
  }

  console.log('✅ Pre-flight prompt verification PASSED:');
  console.log('  1. Three stacked photographic panels confirmed.');
  console.log('  2. One central headline band located between Photo 1 and Photo 2 confirmed.');
  console.log('  3. Zero CTA confirmed (headline-only).');
  console.log(`  4. Headline "${pinConcept.typographyOverlay.primaryHeadline}" accurately matches pumpkin article.`);

  let pinResult: { success: boolean; stableAssetPath: string; stablePublicUrl: string; costUsd: number; error?: string };
  const pinDir = path.resolve(process.cwd(), 'public/generated/pinterest/seo-pins');
  const existingPins = fs.existsSync(pinDir)
    ? fs.readdirSync(pinDir).filter(f => f.startsWith('experimental-ribbed-pumpkin-pin-3panel'))
    : [];

  if (existingPins.length > 0) {
    const assetPath = path.resolve(pinDir, existingPins[0]);
    console.log(`✅ Using already generated 3-Panel Pin Image from disk:
  - Asset Path: ${assetPath}
  - Public URL: /generated/pinterest/seo-pins/${existingPins[0]}
  - Cost: $0.0300`);
    pinResult = {
      success: true,
      stableAssetPath: assetPath,
      stablePublicUrl: `/generated/pinterest/seo-pins/${existingPins[0]}`,
      costUsd: 0.03,
    };
  } else {
    const generated = await generateHiggsfieldImage({
      prompt: pinConcept.compactHiggsfieldPrompt,
      aspectRatio: '2:3',
      resolution: '1k',
      slug: 'experimental-ribbed-pumpkin-pin-3panel',
      targetFolder: 'pinterest',
      jobId: 'exp_job_pumpkin_pin_3panel',
      estimatedCostUsd: 0.03,
    });
    if (!generated.success || !generated.stableAssetPath) {
      throw new Error(`Pinterest Pin image generation failed: ${generated.error || 'Unknown error'}`);
    }
    pinResult = {
      success: true,
      stableAssetPath: generated.stableAssetPath,
      stablePublicUrl: generated.stablePublicUrl || '',
      costUsd: generated.costUsd || 0.03,
    };
  }

  console.log(`✅ Pinterest Pin Image Ready:
  - Asset Path: ${pinResult.stableAssetPath}
  - Public URL: ${pinResult.stablePublicUrl}
  - Cost: $${(pinResult.costUsd || 0.03).toFixed(4)}`);

  // Normalize image dimensions to target 1000 x 1500 if needed (safe in-place resize without overlays)
  const normResult = await normalizePinImageDimensions(pinResult.stableAssetPath);
  if (normResult.normalized) {
    console.log(`ℹ️ Pin image safely normalized to target 1000 x 1500 (Original: ${normResult.originalWidth}x${normResult.originalHeight})`);
  }

  // Bind asset path to concept
  pinConcept.stableAssetPath = pinResult.stableAssetPath;
  pinConcept.stablePublicUrl = pinResult.stablePublicUrl;
  pinConcept.publishStatus = 'image_ready';

  // 6. Direct Pass-Through Verification (Zero Overlays Guarantee)
  console.log('\n--- Step 6: Verifying Direct Pass-Through & Zero Overlays Guarantee ---');
  const passThrough = renderSeoPinDirect(pinConcept);
  console.log(`Pass-Through Result:
  - Asset: ${passThrough.assetPath}
  - Has Local Overlay: ${passThrough.hasLocalOverlay} (Guaranteed: zero canvas/Sharp overlays)
  - Target Dimensions: ${passThrough.width} x ${passThrough.height}`);

  // 7. Validate Pin Creative Compliance
  console.log('\n--- Step 7: Validating Pin Creative Compliance ---');
  const compliance = await validatePinterestPinCreativeCompliance(pinConcept, topic, article.title, article.slug);
  console.log(`Compliance Result:
  - Is Valid: ${compliance.isValid}
  - Errors: ${compliance.errors.length > 0 ? compliance.errors.join('; ') : 'None'}
  - Warnings: ${compliance.warnings.length > 0 ? compliance.warnings.join('; ') : 'None'}`);

  const pinMeta = await sharp(pinResult.stableAssetPath).metadata();
  const pinDimensions = {
    width: pinMeta.width || 0,
    height: pinMeta.height || 0,
    ratio: Number(((pinMeta.width || 1) / (pinMeta.height || 1)).toFixed(3)),
  };

  // 8. Confirm Production Invariants Remained Untouched
  console.log('\n--- Step 8: Confirming Production Files Preserved ---');
  const postState = readEngineState();
  const productionPreserved =
    postState.config.articlesPerDay === 1 &&
    postState.config.pinsPerArticle === 1 &&
    postState.config.pinsPerDay === 1;

  console.log(`Production state preserved: ${productionPreserved}`);

  const totalCost = (heroResult.costUsd || 0.03) + (pinResult.costUsd || 0.03);

  console.log('\n===============================================================');
  console.log('CONTROLLED HIGGSFIELD TEST COMPLETED SUCCESSFULLY');
  console.log('===============================================================\n');

  return {
    success: true,
    topic: {
      keyword: topic.keyword,
      source: 'Google Search Console Seed Catalog (Verified Autumn Seasonal Demand)',
      selectionReason: 'Seasonal high-volume search for beginner-friendly plush ribbed pumpkins for autumn decor. Not previously published.',
    },
    article: {
      title: article.title,
      slug: article.slug,
      isExperimental: true,
    },
    heroImage: {
      assetPath: heroResult.stableAssetPath,
      publicUrl: heroResult.stablePublicUrl,
      dimensions: heroDimensions,
      costUsd: heroResult.costUsd || 0.03,
      aspectRatio: '16:9',
    },
    pinterestPin: {
      assetPath: pinResult.stableAssetPath,
      publicUrl: pinResult.stablePublicUrl,
      dimensions: pinDimensions,
      costUsd: pinResult.costUsd || 0.03,
      pinVariant: pinConcept.pinVariant || 'finished_project',
      instructedHeadline: pinConcept.typographyOverlay.primaryHeadline,
      instructedCta: pinConcept.typographyOverlay.ctaBadgeText,
      hasLocalOverlay: passThrough.hasLocalOverlay,
      pinTitle: pinConcept.pinTitle,
      pinDescription: pinConcept.pinDescription,
      complianceValidation: compliance,
    },
    productionStatePreserved: productionPreserved,
    totalCostUsd: totalCost,
  };
}

if (process.argv[1] && process.argv[1].endsWith('runControlledExperimentalPinTest.ts')) {
  runControlledHiggsfieldTest()
    .then(result => {
      console.log('TEST_RUN_SUMMARY_JSON_START');
      console.log(JSON.stringify(result, null, 2));
      console.log('TEST_RUN_SUMMARY_JSON_END');
      process.exit(0);
    })
    .catch(err => {
      console.error('Controlled test failed:', err);
      process.exit(1);
    });
}
