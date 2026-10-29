/**
 * Higgsfield Pinterest Creative Director - Comprehensive Unit & Integration Test Suite
 * 
 * Verifies Part 1 implementation:
 * 1. Exactly 3 distinct creative concepts generated for an eligible article:
 *    - Pin 1: Finished Project Showcase (complete finished object, clean single-color background)
 *    - Pin 2: Making Process (close-up, two anatomically correct hands with hook & yarn)
 *    - Pin 3: Styling and Variations (lifestyle setting, color variations, fresh angle)
 * 2. Visual archetypes and composition types correctly assigned across the triplet.
 * 3. Article-aware headline generator creates distinct, concise (<= 36 chars) headlines.
 * 4. Strict enforcement of no unsupported claims:
 *    - "FREE" rejected unless substantiated in research packet or topic.
 *    - "EASY" / "BEGINNER" rejected unless substantiated in research packet or topic.
 *    - Fabricated list numbers rejected unless present in title or article.
 * 5. Graceful handling of missing or incomplete article metadata without throwing exceptions.
 * 6. Prompt rules verification:
 *    - 2:3 vertical aspect ratio (1000 x 1500)
 *    - Photographic dominance (>= 70%)
 *    - Safe-frame margins (>= 10% padding)
 *    - Dedicated headline negative space zone
 *    - High-contrast typography & clean fonts
 *    - Single headline lock (LITERAL TEXT LOCK)
 *    - Zero watermarks, fake buttons, badges, or canvas overlays
 * 7. Design and project identity continuity across all 3 concepts (yarn, hook, product).
 * 8. Zero-overlay direct pass-through via renderSeoPinDirect.
 */

import {
  generatePinterestCreativeConcepts,
  generateArticleAwareHeadlines,
  buildPrimaryHeadline,
  buildHiggsfieldPinPrompt,
  selectDistinctCreativeConceptTriplet,
  DEFAULT_KNOWN_CRAFT_BOARDS
} from '../generation/pinterestCreativeDirector';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';
import { renderSeoPinDirect } from '../../pinterest/renderer/renderSeoPin';

let passed = 0;
let failed = 0;

function check(assertion: boolean, name: string, details?: string) {
  if (assertion) {
    passed++;
    console.log(`✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
  }
}

export function runHiggsfieldDirectorTests(): boolean {
  console.log('===============================================================');
  console.log('STARTING HIGGSFIELD PINTEREST CREATIVE DIRECTOR TESTS (PART 1)');
  console.log('===============================================================\n');

  const dummyBoard = DEFAULT_KNOWN_CRAFT_BOARDS[0];

  const sampleTopic: DiscoveredTopic = {
    id: 'topic_pumpkin_01',
    keyword: 'crochet pumpkin pattern',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    trendScore: 92,
    trendDirection: 'rising',
    opportunityScore: 88,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/category/crochet',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Fall seasonal crochet pumpkin projects',
    discoveredAt: new Date().toISOString(),
  };

  const sampleArticle: GeneratedArticle = {
    title: 'How to Crochet a Ribbed Pumpkin for Autumn Decor',
    slug: 'how-to-crochet-ribbed-pumpkin-autumn-decor',
    metaDescription: 'Step-by-step tutorial for crocheting cozy textured pumpkins.',
    category: 'Home Decor',
    content: '<p>Learn how to make a charming ribbed pumpkin using worsted weight yarn.</p>',
    sections: [
      { heading: 'Materials Needed', body: '5mm hook, rust orange yarn, fiberfill, cinnamon stick.' },
      { heading: 'Step by Step Instructions', body: 'Crochet a textured ribbed rectangle and cinch the ends.' },
    ],
    readingTimeMinutes: 5,
    primaryKeyword: 'crochet pumpkin pattern',
    secondaryKeywords: ['autumn decor', 'diy pumpkin'],
    internalLinks: [],
  };

  const samplePacket: FactualResearchPacket = {
    topicId: 'topic_pumpkin_01',
    primaryKeyword: 'crochet pumpkin pattern',
    searchIntent: 'Learn how to crochet autumn ribbed pumpkins',
    craftType: 'crochet',
    difficultyLevel: 'intermediate', // Not beginner!
    recommendedYarnWeight: 'worsted',
    recommendedHookSize: '5.0 mm (H-8)',
    estimatedYarnYardage: '120 yards',
    averageCompletionTime: '2 hours',
    keyTechniques: ['ribbed back-loop single crochet', 'cinching and shaping'],
    materialsList: ['Worsted weight rust yarn', '5.0 mm crochet hook', 'Cinnamon stick stem', 'Tapestry needle'],
    commonPitfalls: ['Stuffing too loosely', 'Uneven tension on ribbing'],
    isPatternFree: false, // Not free!
    relatedTools: [
      { toolId: 'yarn-calculator', name: 'Yarn Yardage Calculator', slug: 'yarn-calculator', relevanceScore: 85 }
    ],
    verifiedAt: new Date().toISOString(),
  };

  // -------------------------------------------------------------------------
  // Group 1: Exactly Three Distinct Creative Concepts Generated
  // -------------------------------------------------------------------------
  console.log('--- Group 1: 3-Pin Triplet Concept Generation ---');
  const triplet = generatePinterestCreativeConcepts(sampleTopic, sampleArticle, samplePacket, dummyBoard);

  check(Array.isArray(triplet) && triplet.length === 3, 'Generates exactly 3 concepts by default', `Count: ${triplet.length}`);
  check(triplet[0].pinNumber === 1, 'Pin 1 has pinNumber = 1');
  check(triplet[1].pinNumber === 2, 'Pin 2 has pinNumber = 2');
  check(triplet[2].pinNumber === 3, 'Pin 3 has pinNumber = 3');

  // Verify Concept Angles
  check(
    triplet[0].conceptAngle === 'Finished Project Showcase & Pattern Feature',
    'Pin 1 has Finished Project Showcase angle',
    triplet[0].conceptAngle
  );
  check(
    triplet[1].conceptAngle === 'Maker Hands in Action & Step-by-Step Technique',
    'Pin 2 has Maker Hands in Action angle',
    triplet[1].conceptAngle
  );
  check(
    triplet[2].conceptAngle === 'Styling, Variations & Creative Inspiration',
    'Pin 3 has Styling, Variations & Creative Inspiration angle',
    triplet[2].conceptAngle
  );

  // Verify Visual Archetype Specifications
  check(
    triplet[0].visualStyle.humanElement === 'none',
    'Pin 1 has humanElement = none (pure finished product focus)'
  );
  check(
    triplet[1].visualStyle.humanElement === 'hands_only' && triplet[1].visualStyle.compositionType === 'hands_crafting',
    'Pin 2 has humanElement = hands_only and compositionType = hands_crafting'
  );
  check(
    triplet[2].visualStyle.compositionType === 'lifestyle_scene',
    'Pin 3 composition represents lifestyle styling scene'
  );

  // -------------------------------------------------------------------------
  // Group 2: Article-Aware Headlines (Distinct, <= 36 chars, Editorial)
  // -------------------------------------------------------------------------
  console.log('\n--- Group 2: Article-Aware Headline Generation ---');
  const headlines = generateArticleAwareHeadlines(sampleTopic, sampleArticle, samplePacket);

  check(Boolean(headlines.pin1Headline), 'Pin 1 headline is populated', headlines.pin1Headline);
  check(Boolean(headlines.pin2Headline), 'Pin 2 headline is populated', headlines.pin2Headline);
  check(Boolean(headlines.pin3Headline), 'Pin 3 headline is populated', headlines.pin3Headline);

  check(headlines.pin1Headline.length <= 36, 'Pin 1 headline <= 36 characters', `Len: ${headlines.pin1Headline.length} ("${headlines.pin1Headline}")`);
  check(headlines.pin2Headline.length <= 36, 'Pin 2 headline <= 36 characters', `Len: ${headlines.pin2Headline.length} ("${headlines.pin2Headline}")`);
  check(headlines.pin3Headline.length <= 36, 'Pin 3 headline <= 36 characters', `Len: ${headlines.pin3Headline.length} ("${headlines.pin3Headline}")`);

  check(
    headlines.pin1Headline !== headlines.pin2Headline &&
    headlines.pin2Headline !== headlines.pin3Headline &&
    headlines.pin1Headline !== headlines.pin3Headline,
    'All three pin headlines are distinct from each other'
  );

  // -------------------------------------------------------------------------
  // Group 3: Strict Enforcement of No Unsupported Claims
  // -------------------------------------------------------------------------
  console.log('\n--- Group 3: Zero Hallucination & Unsupported Claims Enforcement ---');

  // Case 3A: When packet.isPatternFree = false and title has no "free", Pin 1 must NOT contain "FREE"
  check(
    !headlines.pin1Headline.includes('FREE') && !headlines.pin2Headline.includes('FREE'),
    'Rejects "FREE" claim when not substantiated in research packet',
    `P1: "${headlines.pin1Headline}"`
  );

  // Case 3B: When difficulty is intermediate, headline must NOT claim "EASY" or "BEGINNER"
  check(
    !headlines.pin1Headline.includes('EASY') && !headlines.pin1Headline.includes('BEGINNER'),
    'Rejects "EASY" / "BEGINNER" claim when difficultyLevel is intermediate',
    `P1: "${headlines.pin1Headline}"`
  );

  // Case 3C: When substantiated (isPatternFree: true, difficultyLevel: 'beginner')
  const freeBeginnerPacket: FactualResearchPacket = {
    ...samplePacket,
    isPatternFree: true,
    difficultyLevel: 'beginner',
  };
  const substantiatedHeadlines = generateArticleAwareHeadlines(sampleTopic, sampleArticle, freeBeginnerPacket);
  check(
    substantiatedHeadlines.pin1Headline.includes('FREE') || substantiatedHeadlines.pin1Headline.includes('EASY'),
    'Accepts substantiated claims when packet explicitly confirms free / beginner status',
    `P1: "${substantiatedHeadlines.pin1Headline}"`
  );

  // Case 3D: Rejects fabricated numbers unless present in title
  check(
    !/\b\d+\b/.test(headlines.pin1Headline) && !/\b\d+\b/.test(headlines.pin2Headline),
    'Does not invent arbitrary numbers in Pin 1 or Pin 2 when title has none'
  );

  // Case 3E: When title explicitly has a number (e.g. 10 Pumpkin Ideas), Pin 3 reflects that substantiated number
  const listArticle: GeneratedArticle = {
    ...sampleArticle,
    title: '12 Cozy Crochet Pumpkin Ideas for Halloween',
  };
  const listHeadlines = generateArticleAwareHeadlines(sampleTopic, listArticle, samplePacket);
  check(
    listHeadlines.pin3Headline.includes('12'),
    'Substantiated number from title is preserved in Pin 3 headline',
    listHeadlines.pin3Headline
  );

  // -------------------------------------------------------------------------
  // Group 4: Graceful Handling of Missing Metadata
  // -------------------------------------------------------------------------
  console.log('\n--- Group 4: Missing Metadata & Fallback Resilience ---');
  let fallbackThrew = false;
  let fallbackHeadlines: any = null;

  try {
    const emptyTopic: DiscoveredTopic = {
      id: 'topic_empty',
      keyword: '',
      contentType: 'trending_crochet',
      category: '',
      source: 'gsc_seed',
      trendScore: 50,
      trendDirection: 'stable',
      opportunityScore: 50,
      targetContentFormat: 'tutorial',
      targetCategoryUrl: '',
      targetAudienceLevel: 'all_levels',
      searchIntentNotes: '',
      discoveredAt: new Date().toISOString(),
    };
    const emptyArticle: GeneratedArticle = {
      title: '',
      slug: 'empty-slug',
      metaDescription: '',
      category: '',
      content: '',
      sections: [],
      readingTimeMinutes: 1,
      primaryKeyword: '',
      secondaryKeywords: [],
      internalLinks: [],
    };
    fallbackHeadlines = generateArticleAwareHeadlines(emptyTopic, emptyArticle, undefined);
  } catch (err) {
    fallbackThrew = true;
  }

  check(!fallbackThrew, 'Handles completely empty keyword, title, and undefined packet without throwing');
  check(
    Boolean(fallbackHeadlines?.pin1Headline) && fallbackHeadlines.pin1Headline.length <= 36,
    'Produces safe fallback headline for Pin 1',
    fallbackHeadlines?.pin1Headline
  );
  check(
    Boolean(fallbackHeadlines?.pin2Headline) && fallbackHeadlines.pin2Headline.length <= 36,
    'Produces safe fallback headline for Pin 2',
    fallbackHeadlines?.pin2Headline
  );
  check(
    Boolean(fallbackHeadlines?.pin3Headline) && fallbackHeadlines.pin3Headline.length <= 36,
    'Produces safe fallback headline for Pin 3',
    fallbackHeadlines?.pin3Headline
  );

  // -------------------------------------------------------------------------
  // Group 5: Higgsfield Prompt Rules & Archetype Content
  // -------------------------------------------------------------------------
  console.log('\n--- Group 5: Higgsfield Prompt Specifications ---');
  const p1Prompt = triplet[0].compactHiggsfieldPrompt;
  const p2Prompt = triplet[1].compactHiggsfieldPrompt;
  const p3Prompt = triplet[2].compactHiggsfieldPrompt;

  // Pin 1 Archetype Brief
  check(
    p1Prompt.includes('PIN ARCHETYPE: FINISHED PROJECT SHOWCASE (PIN 1)'),
    'Pin 1 prompt contains Finished Project Showcase brief'
  );
  check(
    p1Prompt.includes('CLEAN CONSTRASTING SINGLE-COLOR BACKGROUND'),
    'Pin 1 prompt requires clean contrasting single-color background'
  );

  // Pin 2 Archetype Brief
  check(
    p2Prompt.includes('PIN ARCHETYPE: MAKING PROCESS'),
    'Pin 2 prompt contains Making Process brief'
  );
  check(
    p2Prompt.includes('ANATOMICALLY NATURAL HUMAN HANDS') || p2Prompt.includes('anatomically correct fingers'),
    'Pin 2 prompt specifies anatomically correct real human hands'
  );
  check(
    p2Prompt.includes('physically plausible stitches') && p2Prompt.includes('natural yarn tension'),
    'Pin 2 prompt requires physically plausible stitches & tension'
  );

  // Pin 3 Archetype Brief
  check(
    p3Prompt.includes('PIN ARCHETYPE: STYLING'),
    'Pin 3 prompt contains Styling and Variations brief'
  );
  check(
    p3Prompt.includes('REALISTIC LIFESTYLE SETTING & FRESH VISUAL ANGLE'),
    'Pin 3 prompt specifies realistic lifestyle setting or fresh visual angle'
  );

  // Shared Quality, Safe-Frame, and Typography Requirements across all 3 prompts
  [triplet[0], triplet[1], triplet[2]].forEach((pin, idx) => {
    const prompt = pin.compactHiggsfieldPrompt;
    const num = idx + 1;
    check(
      prompt.includes('2:3 VERTICAL ASPECT RATIO: Target vertical 1000 × 1500 resolution'),
      `Pin ${num} enforces 2:3 vertical aspect ratio (1000 x 1500)`
    );
    check(
      prompt.includes('PHOTOGRAPHIC DOMINANCE: Pure authentic photography must dominate at least 70%'),
      `Pin ${num} enforces photographic dominance >= 70%`
    );
    check(
      prompt.includes('SAFE-FRAME MARGINS & EDGES: Maintain at least 10% safe-frame padding'),
      `Pin ${num} enforces >= 10% safe-frame padding from all canvas edges`
    );
    check(
      prompt.includes('DEDICATED HEADLINE ZONE: Position the headline in a dedicated negative space area'),
      `Pin ${num} enforces dedicated headline negative space zone`
    );
    check(
      prompt.includes('HIGH CONTRAST TYPOGRAPHY'),
      `Pin ${num} enforces high contrast typography`
    );
    check(
      prompt.includes('ONE SINGLE CLEAR HEADLINE ONLY'),
      `Pin ${num} prohibits subtitles and enforces single clear headline`
    );
    check(
      prompt.includes('LITERAL TEXT LOCK — TYPOGRAPHY MUST RENDER THE FOLLOWING STRINGS CHARACTER-FOR-CHARACTER'),
      `Pin ${num} preserves strict LITERAL TEXT LOCK`
    );
    check(
      prompt.includes('GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper'),
      `Pin ${num} preserves GLOBAL HARD PROHIBITION against paper wash/pigments/banners`
    );
  });

  // -------------------------------------------------------------------------
  // Group 6: Design and Product Continuity Across All 3 Pins
  // -------------------------------------------------------------------------
  console.log('\n--- Group 6: Project Identity & Continuity ---');
  // All 3 prompts should mention the subject context (pumpkin in this case)
  check(
    p1Prompt.toLowerCase().includes('pumpkin') &&
    p2Prompt.toLowerCase().includes('pumpkin') &&
    p3Prompt.toLowerCase().includes('pumpkin'),
    'Project identity (pumpkin) is strictly preserved across all 3 Pin prompts'
  );

  // All 3 prompts should specify DESIGN CONTINUITY
  check(
    p1Prompt.includes('DESIGN CONTINUITY') &&
    p2Prompt.includes('DESIGN CONTINUITY') &&
    p3Prompt.includes('DESIGN CONTINUITY'),
    'All 3 Pin prompts enforce design continuity in yarn color, weight, and texture'
  );

  // -------------------------------------------------------------------------
  // Group 7: Direct Pass-Through Renderer (Zero Local Overlays)
  // -------------------------------------------------------------------------
  console.log('\n--- Group 7: Direct Pass-Through Renderer Guarantee ---');
  const mockPinWithAsset: PinterestCreativeConcept = {
    ...triplet[0],
    stableAssetPath: '/public/generated/pinterest/seo-pins/pin-sample-01.png',
    stablePublicUrl: '/generated/pinterest/seo-pins/pin-sample-01.png',
  };

  const renderResult = renderSeoPinDirect(mockPinWithAsset);
  check(
    renderResult.hasLocalOverlay === false,
    'renderSeoPinDirect guarantees hasLocalOverlay = false'
  );
  check(
    renderResult.width === 1000 && renderResult.height === 1500,
    'renderSeoPinDirect maintains target 1000 x 1500 resolution dimensions',
    `${renderResult.width}x${renderResult.height}`
  );
  check(
    renderResult.assetPath === mockPinWithAsset.stableAssetPath,
    'renderSeoPinDirect passes through exact assetPath from Higgsfield output'
  );

  // Throws if stableAssetPath is missing
  let threwWithoutAsset = false;
  try {
    renderSeoPinDirect({ ...triplet[0], stableAssetPath: undefined });
  } catch (err: any) {
    threwWithoutAsset = true;
  }
  check(threwWithoutAsset, 'renderSeoPinDirect throws if stableAssetPath is missing');

  console.log('\n===============================================================');
  console.log(`HIGGSFIELD DIRECTOR TESTS COMPLETE: ${passed} passed, ${failed} failed`);
  console.log('===============================================================\n');

  return failed === 0;
}

if (process.argv[1] && process.argv[1].endsWith('testHiggsfieldPinterestDirector.ts')) {
  const success = runHiggsfieldDirectorTests();
  process.exit(success ? 0 : 1);
}
