/**
 * Test Pinterest Pin Creative Validator
 * Verifies that non-compliant pins (e.g. woodworking tools, missing CTA, placeholder prompts)
 * are rejected, while genuine crochet creative briefs are accepted.
 */

import { validatePinterestPinCreativeCompliance } from '../validation/pinterestCreativeValidator';
import { generatePinterestCreativeConcepts } from '../generation/pinterestCreativeDirector';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';

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

async function runTests() {
  console.log('===============================================================');
  console.log('TESTING PINTEREST PIN CREATIVE VALIDATOR');
  console.log('===============================================================\n');

  const topic: DiscoveredTopic = {
    id: 'test_topic_ornament',
    keyword: 'crochet christmas tree ornament pattern',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    opportunityScore: 89,
    targetContentFormat: 'pattern_roundup',
    targetCategoryUrl: '/category/crochet',
    targetAudienceLevel: 'all_levels',
    discoveredAt: new Date().toISOString(),
    status: 'selected',
  };

  const article: GeneratedArticle = {
    title: 'Crochet Christmas Tree Ornament Pattern Guide & Techniques',
    slug: 'crochet-christmas-tree-ornament-pattern-guide-techniques',
    excerpt: 'Step-by-step crochet Christmas tree ornament patterns and festive ideas.',
    contentHtml: '<p>Learn how to crochet Christmas tree ornaments.</p>',
    wordCount: 1981,
    category: 'crochet',
    tags: ['Crochet', 'Christmas', 'Ornaments'],
    seoMeta: {
      title: 'Crochet Christmas Tree Ornament Pattern Guide',
      description: 'Festive handmade crochet ornaments.',
      keywords: 'crochet christmas tree ornament pattern',
    },
    internalLinks: [],
    tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };

  const packet: FactualResearchPacket = {
    craftType: 'crochet',
    coreUserProblem: 'Creating handmade crochet Christmas tree ornaments',
    practicalSolutions: ['Use CYC #4 worsted yarn and 4.0 mm hook for firm structure'],
    verifiedMaterials: {
      hookSizes: ['4.0 mm (G-6)'],
      yarnWeights: ['CYC #4 Worsted'],
      stitchTermsStandard: 'US',
      safetyBufferPercent: 10,
    },
    suggestedInternalTools: [],
    suggestedInternalCategories: ['/category/crochet'],
  };

  // Test Case 1: Bad Pin with generic "Craft tool in action" placeholder
  const badPin1: PinterestCreativeConcept = {
    pinNumber: 1,
    conceptAngle: 'Primary Craft Concept',
    visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Craft tool', colorPalette: 'natural', humanElement: 'none' },
    compactHiggsfieldPrompt: 'Craft tool in action',
    typographyOverlay: { primaryHeadline: 'Crochet Tool Guide', ctaBadgeText: 'EXPLORE GUIDE →' },
    destinationUrl: 'https://welovepattern.com/blog/test',
    publishStatus: 'pending',
  };

  const result1 = await validatePinterestPinCreativeCompliance(badPin1, topic, article.title);
  check(!result1.isValid, 'Rejects "Craft tool in action" placeholder prompt');
  check(result1.errors.some(e => e.includes('forbidden placeholder prompt')), 'Identifies forbidden placeholder error');

  // Test Case 2: Bad Pin with woodworking terms
  const badPin2: PinterestCreativeConcept = {
    pinNumber: 1,
    conceptAngle: 'Woodworking Tool',
    visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Wood craft', colorPalette: 'natural', humanElement: 'none' },
    compactHiggsfieldPrompt: 'Photo of a woodworking bench with hand saws, chisels, and wood plane. LITERAL TEXT LOCK: HEADLINE: "TOOLS", CTA: "SEE MORE →". GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper.',
    typographyOverlay: { primaryHeadline: 'Wood Tools', ctaBadgeText: 'SEE MORE →' },
    destinationUrl: 'https://welovepattern.com/blog/test',
    publishStatus: 'pending',
  };

  const result2 = await validatePinterestPinCreativeCompliance(badPin2, topic, article.title);
  check(!result2.isValid, 'Rejects conflicting woodworking craft terms for crochet topic');
  check(result2.errors.some(e => e.includes('woodworking')), 'Identifies woodworking conflict');

  // Test Case 3: Bad Pin with missing CTA arrow
  const badPin3: PinterestCreativeConcept = {
    pinNumber: 1,
    conceptAngle: 'Crochet Ornament',
    visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Crochet', colorPalette: 'natural', humanElement: 'none' },
    compactHiggsfieldPrompt: 'Complete 2:3 vertical editorial Pinterest Pin photograph of artisan crochet Christmas tree ornament in textured wool yarn. LITERAL TEXT LOCK: HEADLINE: "ORNAMENTS", CTA: "READ POST". GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper.',
    typographyOverlay: { primaryHeadline: 'ORNAMENTS', ctaBadgeText: 'READ POST' },
    destinationUrl: 'https://welovepattern.com/blog/test',
    publishStatus: 'pending',
  };

  const result3 = await validatePinterestPinCreativeCompliance(badPin3, topic, article.title);
  check(!result3.isValid, 'Rejects CTA without action arrow "→"');

  // Test Case 4: Genuine Pin generated by Pinterest Creative Director
  const genuineBoard = { id: '123456789012345678', name: 'Crochet Home Decor' };
  const genuinePins = generatePinterestCreativeConcepts(topic, article, packet, genuineBoard, 2);

  const result4Pin1 = await validatePinterestPinCreativeCompliance(genuinePins[0], topic, article.title);
  check(result4Pin1.isValid, 'Accepts genuine Pin 1 generated by Pinterest Creative Director', result4Pin1.errors.join('; '));

  const result4Pin2 = await validatePinterestPinCreativeCompliance(genuinePins[1], topic, article.title);
  check(result4Pin2.isValid, 'Accepts genuine Pin 2 generated by Pinterest Creative Director', result4Pin2.errors.join('; '));

  console.log(`\n===============================================================`);
  console.log(`VALIDATOR TEST RESULTS: Passed: ${passed}, Failed: ${failed}`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running validator tests:', err);
  process.exit(1);
});
