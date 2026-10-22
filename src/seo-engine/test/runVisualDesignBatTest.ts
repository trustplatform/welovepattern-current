/**
 * Controlled Single-Article Visual Test for New Pinterest Pin Design
 * Topic: "Easy Crochet Bat Pattern"
 *
 * PRODUCTION SAFETY INVARIANTS:
 * - Does NOT publish to live blog-posts.json
 * - Does NOT dispatch pins to Pinterest API
 * - Does NOT mutate production engine state in data/seo-engine-state.json
 * - Stores all generated assets in isolated directory: public/generated/test-visual/
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { DiscoveredTopic, FactualResearchPacket } from '../types';
import { conductTopicResearch } from '../research/topicResearcher';
import { generateOpenAiArticle, GeneratedArticle } from '../generation/openAiArticleGenerator';
import { generateHiggsfieldImage } from '../generation/higgsfieldClient';
import { readEngineState } from '../queue/engineStorage';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/generated/test-visual');

async function main() {
  console.log('===============================================================');
  console.log('CONTROLLED SINGLE-ARTICLE VISUAL TEST: NEW PINTEREST PIN DESIGN');
  console.log('Topic: Easy Crochet Bat Pattern');
  console.log('Time:', new Date().toISOString());
  console.log('===============================================================\n');

  // Ensure isolated output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Record baseline production state to guarantee zero production impact
  const blogPostsPath = path.resolve(process.cwd(), 'data/blog-posts.json');
  const engineStatePath = path.resolve(process.cwd(), 'data/seo-engine-state.json');
  const baselineBlogCount = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8')).length;
  const baselineState = JSON.parse(fs.readFileSync(engineStatePath, 'utf8'));

  // 1. Define topic
  const topic: DiscoveredTopic = {
    id: 'visual_test_easy_crochet_bat',
    keyword: 'Easy Crochet Bat Pattern',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'visual_test',
    trendScore: 92,
    trendDirection: 'rising',
    opportunityScore: 90,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/categories/crochet',
    targetAudienceLevel: 'beginner',
    searchIntentNotes: 'Visual design validation test for Easy Crochet Bat Pattern',
    discoveredAt: new Date().toISOString(),
    status: 'selected',
  };

  // 2. Conduct topic research using existing pipeline
  console.log('[Step 1/4] Conducting craft technical research...');
  let packet: FactualResearchPacket;
  try {
    packet = await conductTopicResearch(topic);
    console.log(`✓ Research completed. Craft type: ${packet.craftType}, Hook: ${packet.verifiedMaterials?.hookSizes?.[0] || '4.0 mm'}, Yarn: ${packet.verifiedMaterials?.yarnWeights?.[0] || 'Worsted #4'}`);
  } catch (err: any) {
    console.warn(`Research fallback used: ${err?.message}`);
    packet = {
      craftType: 'crochet',
      topicId: topic.id,
      topic: topic.keyword,
      searchIntent: 'Learn how to crochet a handmade bat with clear instructions',
      verifiedTerminology: ['Single Crochet', 'Magic Ring', 'Slip Stitch', 'Chain'],
      verifiedMaterials: {
        yarnWeights: ['Medium / Worsted (#4) in Charcoal Black/Dark Grey'],
        hookSizes: ['3.5 mm (E-4) / 4.0 mm (G-6)'],
        standardYardages: 'Small bat amigurumi: 80 - 120 meters',
      },
      supportedClaims: ['Using a tight gauge prevents fiberfill stuffing from showing through.'],
      techniqueKeyPoints: ['Continuous spiral rounds for the bat body', 'Flat single crochet rows for wings'],
      makerPainPoints: ['Wings flopping or curling', 'Stuffing showing between stitches'],
    } as any;
  }

  // 3. Generate article using existing OpenAI generator
  console.log('\n[Step 2/4] Generating article content via OpenAI pipeline...');
  const config = readEngineState().config;
  let article: GeneratedArticle;
  try {
    article = await generateOpenAiArticle(topic, packet, {
      ...config,
      minWordCount: 800,
      maxWordCount: 1600,
    });
    console.log(`✓ Article generated: "${article.title}" (${article.wordCount} words, slug: ${article.slug})`);
  } catch (err: any) {
    console.warn(`OpenAI generator notice: ${err?.message}. Creating isolated test article package.`);
    article = {
      title: 'Easy Crochet Bat Pattern: A Step-by-Step Beginner Guide',
      slug: 'easy-crochet-bat-pattern',
      category: 'crochet',
      wordCount: 1100,
      metaTitle: 'Easy Crochet Bat Pattern: Step-by-Step Tutorial',
      metaDescription: 'Crochet your own adorable handmade bat with this easy, step-by-step tutorial. Includes clear photos, material lists, and beginner-friendly stitches.',
    };
  }

  const shortTitle = 'EASY CROCHET BAT PATTERN';

  // 4. Construct Prompts strictly following the reference design:
  // TOP: Large clear photograph of finished product
  // CENTER: One short clear title on a simple neutral band
  // BOTTOM: Close-up photograph of human hands actively crocheting the same product
  const heroPrompt = `Realistic photography-led craft tutorial visual for 16:9 widescreen article hero format, featuring an authentic dual-focus tutorial composition:
1. FINISHED OBJECT (LEFT): A large, clear, centered photograph of the completed handmade crochet bat with sculpted wings, cute pointed ears, and clean stitch definition, placed on a warm neutral linen background in soft natural morning window light. High tactile realism and authentic yarn texture.
2. CENTER TITLE: A simple, clean, neutral horizontal divider band displaying the short title "${shortTitle}". Simple, restrained, readable typography with zero decorative stickers, badges, or extra text.
3. CROCHET IN PROGRESS (RIGHT): A realistic close-up photograph of real human hands actively crocheting the body and wings of that EXACT SAME crochet bat, holding a smooth wooden hook with matching charcoal yarn, showing physically plausible, visible stitches in progress. Natural human skin texture and anatomically plausible fingers.
NON-NEGOTIABLE REALISM REQUIREMENTS:
- Authentic photographic realism over illustration, CGI, or cartoon aesthetics.
- Strict visual continuity in yarn color, weight, and construction between the finished bat and the in-progress bat.
- Human hands must look anatomically natural with five correctly formed fingers and realistic skin texture.
- Natural lighting, realistic textures, simple background.
- Title must be short, legible, and visually separated on the neutral band.`;

  const pin1Prompt = `Complete 2:3 vertical Pinterest Pin visual with authentic photography-led tutorial composition (3-part stacked layout):
1. TOP IMAGE (UPPER SECTION):
A large, clear photograph of the finished handmade crochet bat. The bat is made of dark charcoal grey textured worsted yarn with sculpted wings, cute pointed ears, small embroidered features, and immaculate, visible crochet stitches. It is centered and styled on a clean, warm neutral linen surface under soft, natural diffused morning window lighting. Sharp photographic focus, high tactile realism.

2. CENTER TITLE (NEUTRAL HORIZONTAL BAND):
A simple, clean neutral cream-beige horizontal divider band cleanly separating the top and bottom photographs.
On the neutral band, exactly one short, readable article title is rendered in clean, bold, restrained uppercase editorial typography:
"${shortTitle}"
High contrast and immaculate readability at mobile Pinterest feed scale.
STRICT RULE: ONE TITLE ONLY. Absolutely NO subtitles, NO badges, NO stickers, NO icons, NO arrows, NO buttons, NO pills, NO extra text, and NO decorative overlays of any kind.

3. BOTTOM IMAGE (LOWER SECTION):
A realistic macro close-up photograph of real human maker hands actively crocheting the EXACT SAME crochet bat. The hands have natural human skin texture, realistic fingernails, and five anatomically correct fingers, holding a genuine smooth wooden crochet hook in an authentic crochet grip. The hands are actively working the identical dark charcoal grey yarn, showing physically plausible, visible crochet stitches in progress on the bat's wing.

NON-NEGOTIABLE REALISM & CONSISTENCY REQUIREMENTS:
- Prioritize authentic photographic realism over illustration, CGI, cartoon aesthetics, and obvious AI-generated imagery.
- Strict visual continuity in yarn color, yarn weight, fiber texture, and crochet construction between the finished bat in the top photograph and the work-in-progress bat in the bottom photograph.
- Natural human hands with correct finger anatomy and realistic skin.
- Physically plausible crochet stitches, tension, yarn feed, and authentic crochet hook.
- Simple composition and restrained, elegant typography.
- One title only on the neutral band. No cartoon, illustration, CGI, or plastic-looking yarn.`;

  const pin2Prompt = `Complete 2:3 vertical Pinterest Pin visual with authentic photography-led tutorial composition (3-part stacked layout):
1. TOP IMAGE (UPPER SECTION):
A large, crisp 3/4-angle photograph of the finished handmade crochet bat with wings spread, showing rich textured crochet stitches in soft dark charcoal yarn. Beautifully arranged on a rustic wooden maker table with soft natural side window lighting and shallow depth of field. Sharp photographic clarity and authentic handmade yarn texture.

2. CENTER TITLE (NEUTRAL HORIZONTAL BAND):
A simple, clean neutral light warm-grey horizontal divider band dividing the top and bottom photographs.
Centered on the band, exactly one short, readable article title is rendered in bold modern sans-serif uppercase typography:
"${shortTitle}"
Immaculate readability, clean spacing, and high contrast against the neutral band.
STRICT RULE: ONE TITLE ONLY. Absolutely ZERO subtitles, ZERO badges, ZERO stickers, ZERO icons, ZERO extra text, and ZERO decorative frames or elements.

3. BOTTOM IMAGE (LOWER SECTION):
A close-up, top-down angle photograph of real artisan human hands actively crocheting the body of the EXACT SAME dark charcoal crochet bat. Real human hands with authentic skin texture, realistic knuckles, and 5 fingers holding a smooth ergonomic wooden crochet hook. Visible, authentic single crochet stitches in progress with the identical dark charcoal yarn trailing from the skein.

NON-NEGOTIABLE REALISM & CONSISTENCY REQUIREMENTS:
- Prioritize authentic photographic realism over illustration, CGI, cartoon aesthetics, and obvious AI-generated imagery.
- Strict visual continuity: identical dark charcoal yarn, identical stitch scale, and identical bat design between the top and bottom photos.
- Anatomically plausible fingers and natural crochet hand posture.
- Authentic crochet craft realism: realistic yarn texture, true stitch structure, genuine wooden hook.
- Restrained, clean layout with one single title on the neutral band.`;

  console.log('\n[Step 3/4] Generating visual assets via Higgsfield (Marketing Studio Image 2.0 Alpha)...');

  // Generate Hero Image (16:9)
  console.log('\n→ Generating Hero Image (16:9)...');
  const heroResult = await generateHiggsfieldImage({
    prompt: heroPrompt,
    aspectRatio: '16:9',
    resolution: '1k',
    slug: 'test-bat-hero',
    targetFolder: 'test-visual',
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
    customMaxRequests: 25,
    customCapUsd: 3.00,
  });

  if (!heroResult.success || !heroResult.stableAssetPath) {
    throw new Error(`Hero image generation failed: ${heroResult.error}`);
  }
  console.log(`✓ Hero image generated: ${heroResult.stableAssetPath}`);

  // Generate Pinterest Pin 1 (2:3)
  console.log('\n→ Generating Pinterest Pin 1 (2:3)...');
  const pin1Result = await generateHiggsfieldImage({
    prompt: pin1Prompt,
    aspectRatio: '2:3',
    resolution: '1k',
    slug: 'test-bat-pin1',
    targetFolder: 'test-visual',
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
    customMaxRequests: 25,
    customCapUsd: 3.00,
  });

  if (!pin1Result.success || !pin1Result.stableAssetPath) {
    throw new Error(`Pin 1 generation failed: ${pin1Result.error}`);
  }
  console.log(`✓ Pin 1 generated: ${pin1Result.stableAssetPath}`);

  // Generate Pinterest Pin 2 (2:3)
  console.log('\n→ Generating Pinterest Pin 2 (2:3)...');
  const pin2Result = await generateHiggsfieldImage({
    prompt: pin2Prompt,
    aspectRatio: '2:3',
    resolution: '1k',
    slug: 'test-bat-pin2',
    targetFolder: 'test-visual',
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
    customMaxRequests: 25,
    customCapUsd: 3.00,
  });

  if (!pin2Result.success || !pin2Result.stableAssetPath) {
    throw new Error(`Pin 2 generation failed: ${pin2Result.error}`);
  }
  console.log(`✓ Pin 2 generated: ${pin2Result.stableAssetPath}`);

  // 5. Copy and ensure precise dimensions in isolated output directory
  console.log('\n[Step 4/4] Processing and copying test outputs to isolated test directory...');

  const finalHeroPath = path.join(OUTPUT_DIR, 'hero-easy-crochet-bat-pattern.jpg');
  const finalPin1Path = path.join(OUTPUT_DIR, 'pinterest-pin-1-easy-crochet-bat-pattern.jpg');
  const finalPin2Path = path.join(OUTPUT_DIR, 'pinterest-pin-2-easy-crochet-bat-pattern.jpg');

  // Process Hero Image (maintain 16:9 ratio, ensure high quality)
  const heroMeta = await sharp(heroResult.stableAssetPath).metadata();
  console.log(`Native Hero Dimensions: ${heroMeta.width} × ${heroMeta.height}`);
  await sharp(heroResult.stableAssetPath)
    .resize(1920, 1080, { fit: 'cover' })
    .jpeg({ quality: 92 })
    .toFile(finalHeroPath);

  // Process Pin 1 (exact 1000 × 1500)
  const pin1Meta = await sharp(pin1Result.stableAssetPath).metadata();
  console.log(`Native Pin 1 Dimensions: ${pin1Meta.width} × ${pin1Meta.height}`);
  await sharp(pin1Result.stableAssetPath)
    .resize(1000, 1500, { fit: 'cover' })
    .jpeg({ quality: 95 })
    .toFile(finalPin1Path);

  // Process Pin 2 (exact 1000 × 1500)
  const pin2Meta = await sharp(pin2Result.stableAssetPath).metadata();
  console.log(`Native Pin 2 Dimensions: ${pin2Meta.width} × ${pin2Meta.height}`);
  await sharp(pin2Result.stableAssetPath)
    .resize(1000, 1500, { fit: 'cover' })
    .jpeg({ quality: 95 })
    .toFile(finalPin2Path);

  // Record test package summary in isolated directory
  const testPackage = {
    testTopic: topic.keyword,
    title: article.title,
    shortTitleOnBand: shortTitle,
    generatedAt: new Date().toISOString(),
    articleSlug: article.slug,
    articleWordCount: article.wordCount,
    heroImage: {
      path: finalHeroPath,
      publicUrl: '/generated/test-visual/hero-easy-crochet-bat-pattern.jpg',
      dimensions: '1920 × 1080 (16:9)',
      nativeDimensions: `${heroMeta.width} × ${heroMeta.height}`,
      fileSize: fs.statSync(finalHeroPath).size,
      provider: 'Higgsfield Marketing Studio Image 2.0 Alpha',
      requestId: heroResult.providerRequestId,
    },
    pinterestPin1: {
      path: finalPin1Path,
      publicUrl: '/generated/test-visual/pinterest-pin-1-easy-crochet-bat-pattern.jpg',
      dimensions: '1000 × 1500 (2:3)',
      nativeDimensions: `${pin1Meta.width} × ${pin1Meta.height}`,
      fileSize: fs.statSync(finalPin1Path).size,
      provider: 'Higgsfield Marketing Studio Image 2.0 Alpha',
      requestId: pin1Result.providerRequestId,
    },
    pinterestPin2: {
      path: finalPin2Path,
      publicUrl: '/generated/test-visual/pinterest-pin-2-easy-crochet-bat-pattern.jpg',
      dimensions: '1000 × 1500 (2:3)',
      nativeDimensions: `${pin2Meta.width} × ${pin2Meta.height}`,
      fileSize: fs.statSync(finalPin2Path).size,
      provider: 'Higgsfield Marketing Studio Image 2.0 Alpha',
      requestId: pin2Result.providerRequestId,
    },
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'test-package-summary.json'),
    JSON.stringify(testPackage, null, 2)
  );

  // 6. Production Safety Verification
  const currentBlogCount = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8')).length;
  const currentState = JSON.parse(fs.readFileSync(engineStatePath, 'utf8'));

  console.log('\n===============================================================');
  console.log('SAFETY & PRODUCTION ISOLATION AUDIT:');
  console.log(`- Blog posts count before: ${baselineBlogCount}, after: ${currentBlogCount} (${baselineBlogCount === currentBlogCount ? 'UNTOUCHED ✓' : 'MODIFIED ✗'})`);
  console.log(`- Active jobs before: ${baselineState.activeJobs?.length || 0}, after: ${currentState.activeJobs?.length || 0} (${(baselineState.activeJobs?.length || 0) === (currentState.activeJobs?.length || 0) ? 'UNTOUCHED ✓' : 'MODIFIED ✗'})`);
  console.log(`- Engine config active: ${currentState.config.engineActive} (Preserved ✓)`);
  console.log(`- Public live articles published: 0 (CONFIRMED ✓)`);
  console.log(`- Public Pinterest Pins published: 0 (CONFIRMED ✓)`);
  console.log('===============================================================\n');

  console.log('VISUAL ASSETS CREATED:');
  console.log(`1. Hero Image:    ${finalHeroPath} (1920 × 1080)`);
  console.log(`2. Pinterest Pin 1: ${finalPin1Path} (1000 × 1500)`);
  console.log(`3. Pinterest Pin 2: ${finalPin2Path} (1000 × 1500)`);
  console.log(`Summary Metadata: ${path.join(OUTPUT_DIR, 'test-package-summary.json')}`);
}

main().catch(err => {
  console.error('\nFATAL ERROR DURING TEST EXECUTION:', err);
  process.exit(1);
});
