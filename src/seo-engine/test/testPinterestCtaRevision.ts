/**
 * Pinterest CTA & Typography Revision Test
 * Verifies:
 * 1. Stitch Counter CTA maps to "TRY STITCH COUNTER →" (never "CALCULATE YARN FREE →")
 * 2. Tool identity semantic validation passes across all tools in TOOLS_DATA
 * 3. Typography rules in prompt require Montserrat ExtraBold 800 (~24px)
 * 4. Zero Higgsfield network calls made
 */

import {
  buildTrafficOrientedCta,
  deriveToolSpecificCta,
  validateToolCtaSemanticMatch,
  buildHiggsfieldPinPrompt,
  analyzeTopicAesthetic,
  generatePinterestCreativeConcepts
} from '../generation/pinterestCreativeDirector';
import { TOOLS_DATA } from '../../data/toolsData';
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

const dummyPacket: FactualResearchPacket = {
  craftType: 'crochet',
  coreUserProblem: 'Tracking stitch counts',
  practicalSolutions: ['Use digital stitch counter'],
  verifiedMaterials: {
    hookSizes: ['5.0mm'],
    yarnWeights: ['Worsted #4'],
    stitchTermsStandard: 'US',
    safetyBufferPercent: 10,
  },
  suggestedInternalTools: ['/tools/stitch-counter'],
  suggestedInternalCategories: ['/categories/tools'],
};

export function runPinterestCtaRevisionTests(): boolean {
  console.log('===============================================================');
  console.log('STARTING PINTEREST CTA & TYPOGRAPHY REVISION TESTS');
  console.log('===============================================================\n');

  // Test 1: Stitch Counter specifically
  const stitchTopic: DiscoveredTopic = {
    id: 'topic_stitch_test',
    keyword: 'stitch counter online',
    contentType: 'tool_guide',
    category: 'tools',
    toolSlug: 'stitch-counter',
    source: 'gsc_seed',
    trendScore: 70,
    trendDirection: 'steady',
    opportunityScore: 85,
    targetContentFormat: 'tool_focus',
    targetToolUrl: '/tools/stitch-counter',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Online stitch counter tool guide',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const stitchArticle: GeneratedArticle = {
    title: 'Mastering Crochet with Our Online Stitch Counter',
    slug: 'mastering-crochet-with-our-online-stitch-counter',
    category: 'tools',
    metaTitle: 'Mastering Crochet with Our Online Stitch Counter',
    metaDescription: 'Keep track of every stitch and round with our free online stitch counter.',
    primaryKeyword: 'stitch counter online',
    secondaryKeywords: ['crochet stitch counter', 'digital stitch counter'],
    readingTimeMinutes: 4,
    wordCount: 950,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  const stitchCta = buildTrafficOrientedCta(stitchTopic, stitchArticle, 1, 'flatlay_projects');
  console.log(`[Stitch Counter Result] CTA: "${stitchCta}"`);

  check(stitchCta === 'TRY STITCH COUNTER →', 'Stitch Counter gets dedicated tool CTA', `Received: "${stitchCta}"`);
  check(!stitchCta.includes('CALCULATE YARN'), 'Stitch Counter never receives yarn calculation CTA');
  check(!stitchCta.includes('ESTIMATOR'), 'Stitch Counter never receives estimator CTA');

  // Test 2: Semantic Validation Function
  const validStitch = validateToolCtaSemanticMatch('TRY STITCH COUNTER →', 'stitch-counter', 'Stitch Counter');
  check(validStitch.valid === true, 'Semantic validation approves valid stitch counter CTA');

  const invalidStitch = validateToolCtaSemanticMatch('CALCULATE YARN FREE →', 'stitch-counter', 'Stitch Counter');
  check(invalidStitch.valid === false, 'Semantic validation rejects "CALCULATE YARN FREE →" on stitch counter', invalidStitch.reason);

  const invalidConverter = validateToolCtaSemanticMatch('CALCULATE YARN FREE →', 'hook-size-converter', 'Hook Size Converter');
  check(invalidConverter.valid === false, 'Semantic validation rejects "CALCULATE YARN FREE →" on hook size converter', invalidConverter.reason);

  // Test 3: Tool Catalog Coverage
  for (const tool of TOOLS_DATA) {
    const cta = deriveToolSpecificCta(tool.slug, tool.title);
    const validation = validateToolCtaSemanticMatch(cta, tool.slug, tool.title);
    check(validation.valid === true, `Tool CTA for "${tool.title}" (${tool.slug}) -> "${cta}" is semantically valid`);
  }

  // Test 4: Direct Pinterest Creative Concepts Generation & Cross-Tool Isolation
  const yarnCalcTopic: DiscoveredTopic = {
    id: 'topic_yarn_calc_test',
    keyword: 'yarn calculator for blanket',
    contentType: 'tool_guide',
    category: 'tools',
    toolSlug: 'yarn-calculator',
    source: 'gsc_seed',
    trendScore: 80,
    trendDirection: 'steady',
    opportunityScore: 90,
    targetContentFormat: 'tool_focus',
    targetToolUrl: '/tools/yarn-calculator',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Yarn calculator tool guide',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const yarnCalcArticle: GeneratedArticle = {
    title: 'How Much Yarn Do I Need? Free Crochet Yarn Calculator',
    slug: 'how-much-yarn-do-i-need-calculator',
    category: 'tools',
    metaTitle: 'Free Crochet Yarn Calculator: Yardage Estimator',
    metaDescription: 'Calculate exact yarn yardage for any blanket, sweater, or hat.',
    primaryKeyword: 'yarn calculator for blanket',
    secondaryKeywords: ['crochet yarn calculator', 'yardage calculator'],
    readingTimeMinutes: 5,
    wordCount: 1100,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: '',
    internalLinks: [],
  };

  const dummyBoard = { id: 'board_tools', name: 'Crochet Tools & Yarn Calculators' };

  const stitchConcepts = generatePinterestCreativeConcepts(stitchTopic, stitchArticle, dummyPacket, dummyBoard, 2);
  const yarnConcepts = generatePinterestCreativeConcepts(yarnCalcTopic, yarnCalcArticle, dummyPacket, dummyBoard, 2);

  check(stitchConcepts[0].typographyOverlay.ctaBadgeText === 'TRY STITCH COUNTER →', 'Pin 1 Stitch Concept CTA is "TRY STITCH COUNTER →"');
  check(stitchConcepts[1].typographyOverlay.ctaBadgeText === 'TRY STITCH COUNTER →', 'Pin 2 Stitch Concept CTA is "TRY STITCH COUNTER →"');
  check(yarnConcepts[0].typographyOverlay.ctaBadgeText === 'CALCULATE YARN FREE →', 'Pin 1 Yarn Calc Concept CTA is "CALCULATE YARN FREE →"');
  check(yarnConcepts[1].typographyOverlay.ctaBadgeText === 'CALCULATE YARN FREE →', 'Pin 2 Yarn Calc Concept CTA is "CALCULATE YARN FREE →"');
  check(stitchConcepts[0].compactHiggsfieldPrompt.includes('TRY STITCH COUNTER →'), 'Stitch Pin prompt includes exact CTA "TRY STITCH COUNTER →"');
  check(!stitchConcepts[0].compactHiggsfieldPrompt.includes('CALCULATE YARN'), 'Stitch Pin prompt does not contain "CALCULATE YARN"');

  // Test 5: Typography in Prompt
  const theme = analyzeTopicAesthetic(stitchTopic, stitchArticle, dummyPacket);
  const prompt = buildHiggsfieldPinPrompt('flatlay_projects', 'STITCH COUNTER ONLINE', stitchCta, theme, stitchTopic, stitchArticle, dummyPacket);

  check(prompt.includes('Montserrat ExtraBold'), 'Prompt specifies Montserrat ExtraBold font');
  check(prompt.includes('font-weight 800'), 'Prompt specifies font-weight 800');
  check(prompt.includes('24px'), 'Prompt specifies approximate 24px visual size');
  check(prompt.includes('letter spacing 1.2–1.5px'), 'Prompt specifies 1.2-1.5px letter spacing');
  check(prompt.includes('line height 1.0–1.1'), 'Prompt specifies 1.0-1.1 line height');
  check(prompt.includes('LITERAL TEXT LOCK'), 'Prompt preserves Literal Text Lock');
  check(prompt.includes(`CTA — EXACT LITERAL STRING:\n"TRY STITCH COUNTER →"`), 'Prompt locks exact tool CTA string');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  return failed === 0;
}

runPinterestCtaRevisionTests();
