/**
 * Production Runner: Real Crochet Parandi Pinterest Pin Generation
 * 
 * Executes the complete real production pipeline for ONE Pin:
 * 1. Trend Topic Discovery (Crochet Parandi, +5265% Pinterest Trend)
 * 2. Craft Research & Factual Validation (CYC Standards)
 * 3. Pinterest Creative Intelligence Direction (Jewel-tone fashion editorial, dynamic diagonal framing, no torn paper)
 * 4. Literal Text Lock ("Crochet Parandi Ideas" + "GET THE IDEAS →")
 * 5. Real Higgsfield Image Generation (Marketing Studio Image 2.0 Alpha, 2:3, 1K)
 * 6. File & Quality Validation
 */

import fs from 'fs';
import path from 'path';
import { generateHiggsfieldImage } from '../generation/higgsfieldClient';
import {
  buildHiggsfieldPinPrompt,
  analyzeTopicAesthetic,
  PinterestCreativeDimensions,
  resolveRealPinterestBoard,
  DEFAULT_KNOWN_CRAFT_BOARDS
} from '../generation/pinterestCreativeDirector';
import { DiscoveredTopic, FactualResearchPacket } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';

async function main() {
  console.log('===============================================================');
  console.log('🚀 RUNNING REAL PRODUCTION PINTEREST PIN GENERATION');
  console.log('TREND: Crochet Parandi (+5,265% Pinterest 2026 Trend Report)');
  console.log('===============================================================\n');

  // 1. Topic Definition
  const topic: DiscoveredTopic = {
    id: 'topic_crochet_parandi_trend',
    keyword: 'crochet parandi',
    contentType: 'trending_crochet',
    category: 'accessories',
    source: 'gsc_seed',
    trendScore: 98,
    combinedTrendScore: 99,
    trendDirection: 'rising',
    opportunityScore: 98,
    targetContentFormat: 'ideas_roundup',
    targetCategoryUrl: '/categories/accessories',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'High-growth Pinterest 2026 trend: traditional and modern handcrafted hair accessory parandi with tassels.',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  // 2. Article Context
  const article: GeneratedArticle = {
    title: 'Crochet Parandi: 10 Gorgeous Handcrafted Ideas for Trending Hair Accessories',
    slug: 'crochet-parandi-ideas-trending-hair-accessories',
    category: 'accessories',
    metaTitle: 'Crochet Parandi Ideas: Trending Hair Accessories',
    metaDescription: 'Discover vibrant handmade crochet parandi hair accessories featuring jewel-toned yarns, intricate tassels, and traditional craft artistry.',
    primaryKeyword: 'crochet parandi',
    secondaryKeywords: ['crochet hair accessories', 'crochet braid tassels', 'parandi patterns'],
    readingTimeMinutes: 5,
    wordCount: 1150,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  // 3. Factual Craft Research Packet
  const packet: FactualResearchPacket = {
    craftType: 'crochet',
    coreUserProblem: 'Crafting beautiful, durable crochet parandi hair tassels with proper weight balance and secure braid attachment',
    practicalSolutions: [
      'Use lightweight mercerized cotton or fine bamboo silk yarn to prevent heavy pulling on hair',
      'Incorporate traditional three-strand tassel anchors with reinforced slip-stitch loop headers',
      'Embellish with subtle antique gold beadwork and contrasting jewel-toned tassel skirts'
    ],
    verifiedMaterials: {
      hookSizes: ['3.0 mm (D-3)', '3.5 mm (E-4)'],
      yarnWeights: ['CYC #2 Fine / Sport', 'CYC #3 Light / DK', 'Mercerized Cotton #10'],
      stitchTermsStandard: 'US',
      safetyBufferPercent: 15,
    },
    suggestedInternalTools: ['/tools/yarn-calculator', '/tools/stitch-counter'],
    suggestedInternalCategories: ['/categories/accessories'],
  };

  // 4. Board Resolution
  const boardRes = await resolveRealPinterestBoard(topic, 'accessories', DEFAULT_KNOWN_CRAFT_BOARDS, { allowTestFallback: true });
  const targetBoard = boardRes.board || { id: 'board_accessories', name: 'Crochet Bags & Accessories' };
  console.log(`[PinterestDirector] Target Pinterest Board: "${targetBoard.name}" (${targetBoard.id})`);

  // 5. Creative Direction & Multi-Dimensional Profile
  const theme = {
    themeName: 'Jewel Tone Fashion Studio',
    paletteDescription: 'Vibrant jewel tones with deep emerald green, rich plum, vivid cobalt blue, and subtle antique gold',
    ctaVisualTreatment: 'rich emerald, plum, and cobalt jewel tone wash with high-contrast modern typography',
    lightingAndMood: 'Dramatic editorial fashion photography with soft natural daylight, realistic hair highlights, and rich textile contrast',
  };

  const dimensions: PinterestCreativeDimensions = {
    composition: 'lifestyle_scene',
    cameraFraming: 'close_up',
    colorMood: theme,
    typographyStyle: 'bold_modern_sans',
    titlePosition: 'top_right',
    ctaPosition: 'bottom_right',
    ctaStyle: 'editorial_label',
    textBackground: 'none_direct_photo',
    propStorytelling: 'Dynamic high-fashion diagonal composition of a chic woman seen from a three-quarter back angle showcasing a long, beautifully braided hairstyle intricately woven with a vibrant handmade crochet parandi. Rich textured crochet motifs, lush jewel-toned yarn tassels in deep emerald, royal plum, and vivid cobalt with subtle antique gold thread accents. Natural soft daylight illuminates individual yarn plies, authentic hair texture, and immaculate stitch definition with zero generic beige or flat backgrounds',
  };

  // Exact Text Lock
  const lockedHeadline = 'Crochet Parandi Ideas';
  const lockedCta = 'GET THE IDEAS →';

  console.log('\n[Creative Concept Art Direction]');
  console.log(`- Headline: "${lockedHeadline}"`);
  console.log(`- Action CTA: "${lockedCta}"`);
  console.log(`- Color Palette: ${theme.paletteDescription}`);
  console.log(`- Typography Style: ${dimensions.typographyStyle}`);
  console.log(`- Title Placement: ${dimensions.titlePosition}`);
  console.log(`- CTA Placement: ${dimensions.ctaPosition}`);
  console.log(`- Text Background: ${dimensions.textBackground} (No torn paper / clean photographic integration)`);

  const prompt = buildHiggsfieldPinPrompt(
    'lifestyle_person',
    lockedHeadline,
    lockedCta,
    theme,
    topic,
    article,
    packet,
    dimensions
  );

  console.log('\n===============================================================');
  console.log('FINAL HIGGSFIELD 2:3 PIN PROMPT:');
  console.log('===============================================================');
  console.log(prompt);
  console.log('===============================================================\n');

  // 6. Real Higgsfield Image Generation
  console.log('🎨 Calling Real Higgsfield Marketing Studio API (2:3, 1K)...');
  const genResult = await generateHiggsfieldImage({
    prompt,
    aspectRatio: '2:3',
    resolution: '1k',
    slug: 'crochet-parandi-ideas-jewel-tone-pin',
    targetFolder: 'pinterest',
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
  });

  console.log('\n===============================================================');
  console.log('HIGGSFIELD GENERATION RESULT:');
  console.log('===============================================================');
  console.log(JSON.stringify(genResult, null, 2));

  if (!genResult.success || !genResult.stableAssetPath) {
    console.error('❌ Higgsfield generation failed:', genResult.error);
    process.exit(1);
  }

  // 7. Verify Local File on Disk
  if (fs.existsSync(genResult.stableAssetPath)) {
    const stats = fs.statSync(genResult.stableAssetPath);
    console.log(`\n✅ Image successfully downloaded and saved to disk:`);
    console.log(`- Local Path: ${genResult.stableAssetPath}`);
    console.log(`- Public URL: ${genResult.stablePublicUrl}`);
    console.log(`- File Size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`- Task ID: ${genResult.providerRequestId}`);
    console.log('===============================================================');
    console.log('🎉 PRODUCTION PIN GENERATION COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
  } else {
    console.error(`❌ File not found on disk at: ${genResult.stableAssetPath}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
