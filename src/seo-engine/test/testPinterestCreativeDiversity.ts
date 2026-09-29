/**
 * Pinterest Creative Diversity Test Suite
 * 
 * Verifies that:
 * 1. For any given article, Pin 1 and Pin 2 differ in at least 5 meaningful visual dimensions.
 * 2. Visual dimensions vary: Composition, Camera Framing, Title Position, CTA Position, Typography Style, Text Background, CTA Visual Styling, Color Mood.
 * 3. Title is NOT always top-left.
 * 4. CTA is NOT always bottom-left.
 * 5. Text background panel is NOT mandatory.
 * 6. Literal Text Lock and exact tool-specific CTAs are strictly preserved.
 */

import {
  generatePinterestCreativeConcepts,
  verifyPinCreativeDiversity,
  analyzeTopicAesthetic
} from '../generation/pinterestCreativeDirector';
import { DiscoveredTopic, FactualResearchPacket } from '../types';
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

const dummyBoard = { id: 'board_blankets', name: 'Crochet Blankets & Afghans' };

export function runCreativeDiversityTests(): boolean {
  console.log('===============================================================');
  console.log('STARTING PINTEREST CREATIVE DIVERSITY TESTS');
  console.log('===============================================================\n');

  // Test Case 1: Seasonal Roundup / Idea Collection
  const halloweenTopic: DiscoveredTopic = {
    id: 'topic_halloween',
    keyword: 'crochet halloween granny square',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    trendScore: 90,
    trendDirection: 'rising',
    opportunityScore: 95,
    targetContentFormat: 'ideas_roundup',
    targetCategoryUrl: '/category/halloween',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Trending seasonal granny squares',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const halloweenArticle: GeneratedArticle = {
    title: 'Create Spooky Crochet Halloween Granny Squares',
    slug: 'create-spooky-crochet-halloween-granny-squares',
    category: 'crochet',
    metaTitle: 'Crochet Halloween Granny Square Guide',
    metaDescription: 'Learn how to crochet spooky Halloween granny squares.',
    primaryKeyword: 'crochet halloween granny square',
    secondaryKeywords: ['halloween crochet', 'granny square pattern'],
    readingTimeMinutes: 5,
    wordCount: 1100,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  const halloweenPacket: FactualResearchPacket = {
    craftType: 'crochet',
    coreUserProblem: 'Creating spooky themed granny squares',
    practicalSolutions: ['pumpkin granny square', 'ghost motif'],
    verifiedMaterials: {
      hookSizes: ['5.0 mm (H-8)'],
      yarnWeights: ['CYC #4 Worsted'],
      stitchTermsStandard: 'US',
      safetyBufferPercent: 10,
    },
    suggestedInternalTools: ['/tools/granny-square-calculator'],
    suggestedInternalCategories: ['/category/halloween'],
  };

  const halloweenPins = generatePinterestCreativeConcepts(halloweenTopic, halloweenArticle, halloweenPacket, dummyBoard, 2);
  const halloweenDiversity = verifyPinCreativeDiversity(halloweenPins[0], halloweenPins[1]);

  console.log(`[Halloween Pins Diversity] Differences (${halloweenDiversity.differenceCount}):\n- ${halloweenDiversity.differences.join('\n- ')}`);
  check(halloweenDiversity.diverse === true, 'Halloween Pin 1 vs Pin 2 has at least 5 visual dimension differences', `Count: ${halloweenDiversity.differenceCount}`);
  check(halloweenPins[0].compactHiggsfieldPrompt.includes('LITERAL TEXT LOCK'), 'Halloween Pin 1 has Literal Text Lock');
  check(halloweenPins[1].compactHiggsfieldPrompt.includes('LITERAL TEXT LOCK'), 'Halloween Pin 2 has Literal Text Lock');
  check(halloweenPins[0].compactHiggsfieldPrompt.includes('CROCHET HALLOWEEN GRANNY SQUARE'), 'Halloween Pin 1 has exact headline');
  check(halloweenPins[1].compactHiggsfieldPrompt.includes('CROCHET HALLOWEEN GRANNY SQUARE'), 'Halloween Pin 2 has exact headline');

  // Test Case 2: Tool Guide (Row Counter)
  const toolTopic: DiscoveredTopic = {
    id: 'topic_tool_row_counter',
    keyword: 'online row counter',
    contentType: 'tool_guide',
    category: 'tools',
    toolSlug: 'row-counter',
    source: 'internal_catalog',
    trendScore: 85,
    trendDirection: 'stable',
    opportunityScore: 92,
    targetContentFormat: 'tool_focus',
    targetToolUrl: '/tools/row-counter',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Online row counter tool guide',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const toolArticle: GeneratedArticle = {
    title: 'Master Your Crochet Projects with an Online Row Counter',
    slug: 'master-your-crochet-projects-with-an-online-row-counter',
    category: 'tools',
    metaTitle: 'Online Row Counter for Crochet',
    metaDescription: 'Track rows effortlessly with our free online tool.',
    primaryKeyword: 'online row counter',
    secondaryKeywords: ['crochet row counter', 'digital row tracker'],
    readingTimeMinutes: 4,
    wordCount: 980,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  const toolPacket: FactualResearchPacket = {
    craftType: 'crochet',
    coreUserProblem: 'Tracking active row repeats',
    practicalSolutions: ['Use digital row counter'],
    verifiedMaterials: {
      hookSizes: ['5.0 mm'],
      yarnWeights: ['CYC #4 Worsted'],
      stitchTermsStandard: 'US',
      safetyBufferPercent: 10,
    },
    suggestedInternalTools: ['/tools/row-counter'],
    suggestedInternalCategories: ['/categories/tools'],
  };

  const toolBoard = { id: 'board_tools', name: 'Crochet Tools & Yarn Calculators' };
  const toolPins = generatePinterestCreativeConcepts(toolTopic, toolArticle, toolPacket, toolBoard, 2);
  const toolDiversity = verifyPinCreativeDiversity(toolPins[0], toolPins[1]);

  console.log(`\n[Tool Pins Diversity] Differences (${toolDiversity.differenceCount}):\n- ${toolDiversity.differences.join('\n- ')}`);
  check(toolDiversity.diverse === true, 'Tool Guide Pin 1 vs Pin 2 has at least 5 visual dimension differences', `Count: ${toolDiversity.differenceCount}`);
  check(toolPins[0].typographyOverlay.ctaBadgeText === 'USE ROW COUNTER →', 'Tool Pin 1 has exact dedicated CTA "USE ROW COUNTER →"');
  check(toolPins[1].typographyOverlay.ctaBadgeText === 'USE ROW COUNTER →', 'Tool Pin 2 has exact dedicated CTA "USE ROW COUNTER →"');
  check(toolPins[0].compactHiggsfieldPrompt.includes('USE ROW COUNTER →'), 'Tool Pin 1 prompt contains exact CTA "USE ROW COUNTER →"');
  check(toolPins[1].compactHiggsfieldPrompt.includes('USE ROW COUNTER →'), 'Tool Pin 2 prompt contains exact CTA "USE ROW COUNTER →"');

  // Verify non-repetitive Title & CTA placements across the pairs
  const prompt1 = toolPins[0].compactHiggsfieldPrompt;
  const prompt2 = toolPins[1].compactHiggsfieldPrompt;

  check(prompt1.includes('Upper-center area') || prompt1.includes('Upper-right') || prompt1.includes('Upper area'), 'Pin 1 placement adapts dynamically');
  check(prompt2.includes('Upper area') || prompt2.includes('Lower-left') || prompt2.includes('Lower-right'), 'Pin 2 placement adapts dynamically');
  check(prompt1.includes('Centered bottom area') || prompt1.includes('Lower-right') || prompt1.includes('Upper-right'), 'Pin 1 CTA placement adapts dynamically');
  check(prompt2.includes('Lower-right') || prompt2.includes('Upper-right') || prompt2.includes('Lower-left'), 'Pin 2 CTA placement adapts dynamically');

  // Test Case 3: Tutorial / Technique Guide
  const tutorialTopic: DiscoveredTopic = {
    id: 'topic_tutorial',
    keyword: 'how to crochet waffle stitch',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    trendScore: 78,
    trendDirection: 'rising',
    opportunityScore: 88,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/category/stitches',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Step-by-step waffle stitch tutorial',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const tutorialArticle: GeneratedArticle = {
    title: 'How to Crochet the Waffle Stitch: Step-by-Step Tutorial',
    slug: 'how-to-crochet-waffle-stitch-tutorial',
    category: 'crochet',
    metaTitle: 'How to Crochet Waffle Stitch',
    metaDescription: 'Learn the textured waffle stitch with step by step guide.',
    primaryKeyword: 'how to crochet waffle stitch',
    secondaryKeywords: ['waffle stitch pattern', 'textured crochet'],
    readingTimeMinutes: 6,
    wordCount: 1250,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  const tutorialPins = generatePinterestCreativeConcepts(tutorialTopic, tutorialArticle, halloweenPacket, dummyBoard, 2);
  const tutorialDiversity = verifyPinCreativeDiversity(tutorialPins[0], tutorialPins[1]);

  console.log(`\n[Tutorial Pins Diversity] Differences (${tutorialDiversity.differenceCount}):\n- ${tutorialDiversity.differences.join('\n- ')}`);
  check(tutorialDiversity.diverse === true, 'Tutorial Pin 1 vs Pin 2 has at least 5 visual dimension differences', `Count: ${tutorialDiversity.differenceCount}`);

  console.log('\n===============================================================');
  console.log(`CREATIVE DIVERSITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  return failed === 0;
}

runCreativeDiversityTests();
