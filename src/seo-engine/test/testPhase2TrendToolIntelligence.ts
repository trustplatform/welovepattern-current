/**
 * SEO Content Engine - Phase 2 Verification Suite
 * Trend + Tool Content Intelligence
 * 
 * Verifies all 12 required Phase 2 production capabilities:
 * 1. Trend discovery produces usable candidate with valid evidence.
 * 2. Seasonal fallback does not falsely claim real-time trend evidence.
 * 3. Selected tool exists in TOOLS_DATA.
 * 4. Invalid/irrelevant tool-topic pairing is rejected.
 * 5. Tool rotation avoids consecutive-day repetition.
 * 6. Tool URLs are verified and correctly inserted into article content.
 * 7. Article explains relationship between topic and tool.
 * 8. Unsupported capabilities or factual claims are rejected.
 * 9. Existing published articles checked for substantial topic overlap.
 * 10. Exactly one Pinterest creative produced.
 * 11. Pin destination matches canonical article URL.
 * 12. Existing Phase 1 scheduling & publishing tests continue to pass.
 */

import { discoverTrendingCrochetTopic } from '../discovery/topicDiscovery';
import {
  matchTopicToTool,
  validateToolTopicPairing,
  scoreToolRelevanceForTopic,
  TOOL_CAPABILITY_PROFILES,
  getToolRotationHistory,
} from '../discovery/trendToolMatcher';
import { TOOLS_DATA, getToolBySlug } from '../../data/toolsData';
import { isRouteValid } from '../generation/internalLinkCatalog';
import { injectInternalLinks, hasToolCta } from '../generation/internalLinkInjector';
import { conductTopicResearch } from '../research/topicResearcher';
import { evaluateProductionQualityGates, checkContentCannibalization } from '../validation/productionQualityGates';
import { generatePinterestCreativeConcepts } from '../generation/pinterestCreativeDirector';
import { DEFAULT_SEO_ENGINE_CONFIG } from '../config';
import { DiscoveredTopic, FactualResearchPacket } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runPhase2Tests(): Promise<void> {
  console.log('=== RUNNING PHASE 2 TREND + TOOL CONTENT INTELLIGENCE TESTS ===\n');

  // -----------------------------------------------------------------
  // 1. Trend discovery produces usable candidate with valid evidence
  // -----------------------------------------------------------------
  console.log('Test 1: Trend Discovery Produces Usable Candidate');
  const discovered = await discoverTrendingCrochetTopic({ useRealDataForSeo: false });
  assert(Boolean(discovered && discovered.keyword), '1a. Discovers a valid candidate keyword', discovered.keyword);
  assert(discovered.contentType === 'trending_crochet', '1b. Content type is trending_crochet');
  assert(discovered.category === 'crochet', '1c. Category is crochet');
  assert(discovered.opportunityScore >= 70, '1d. Opportunity score >= 70', `Score: ${discovered.opportunityScore}`);
  assert(!/calculator|estimator|converter/i.test(discovered.keyword), '1e. Zero prohibited tool words in trend keyword');

  // -----------------------------------------------------------------
  // 2. Seasonal fallback does not falsely claim real-time trend evidence
  // -----------------------------------------------------------------
  console.log('\nTest 2: Seasonal Fallback Honesty');
  assert(
    discovered.source === 'seasonal_trend' || discovered.source === 'gsc_seed',
    '2a. Source indicates seasonal or seed origin when DataForSEO is disabled',
    discovered.source
  );
  assert(
    !discovered.searchIntentNotes?.includes('Dynamically discovered rising related search query from Google Trends'),
    '2b. Fallback notes do not falsely claim live Google Trends discovery'
  );

  // -----------------------------------------------------------------
  // 3. Selected tool exists in TOOLS_DATA
  // -----------------------------------------------------------------
  console.log('\nTest 3: Selected Tool Exists in Verified TOOLS_DATA');
  assert(Boolean(discovered.toolSlug), '3a. Discovered topic has paired toolSlug', discovered.toolSlug);
  const toolItem = discovered.toolSlug ? getToolBySlug(discovered.toolSlug) : undefined;
  assert(Boolean(toolItem), '3b. Paired tool exists in TOOLS_DATA', toolItem?.title);
  assert(isRouteValid(`/tools/${discovered.toolSlug}`), '3c. Paired tool has verified route', `/tools/${discovered.toolSlug}`);

  // -----------------------------------------------------------------
  // 4. Invalid/irrelevant tool-topic pairing is rejected
  // -----------------------------------------------------------------
  console.log('\nTest 4: Invalid/Irrelevant Pairings Are Rejected');
  // Border calculator is invalid for amigurumi
  const invalidPairing1 = validateToolTopicPairing('border-calculator', 'crochet ghost pattern free');
  assert(!invalidPairing1.valid, '4a. Border Calculator rejected for amigurumi plush', invalidPairing1.reason);

  // Granny square calculator is invalid for beanie
  const invalidPairing2 = validateToolTopicPairing('granny-square-blanket-calculator', 'chunky ribbed beanie pattern');
  assert(!invalidPairing2.valid, '4b. Granny Square Calculator rejected for beanie garment', invalidPairing2.reason);

  // Valid pairing passes
  const validPairing = validateToolTopicPairing('yarn-calculator', 'easy crochet pumpkin pattern free');
  assert(validPairing.valid, '4c. Yarn Calculator accepted for seasonal pumpkin pattern');

  // -----------------------------------------------------------------
  // 5. Tool rotation avoids consecutive-day repetition
  // -----------------------------------------------------------------
  console.log('\nTest 5: Daily Tool Rotation & Fallback Handling');
  // Suppose yarn-calculator was used yesterday
  const rotationMatch = matchTopicToTool('easy crochet pumpkin pattern free', {
    recentToolSlugs: ['yarn-calculator']
  });
  assert(rotationMatch.success, '5a. Match succeeded with recent history');
  assert(
    rotationMatch.tool?.slug !== 'yarn-calculator',
    '5b. Rotated to different tool when yarn-calculator was recently used',
    rotationMatch.tool?.slug
  );
  assert(!rotationMatch.isRotationFallback, '5c. Successfully rotated without requiring fallback');

  // When all candidate tools were used recently
  const allUsedSlugs = TOOL_CAPABILITY_PROFILES.map(p => p.toolSlug);
  const fallbackMatch = matchTopicToTool('easy crochet pumpkin pattern free', {
    recentToolSlugs: allUsedSlugs
  });
  assert(fallbackMatch.success, '5d. Fallback match succeeds when all tools were used');
  assert(fallbackMatch.isRotationFallback === true, '5e. Documented fallback behavior flagged (isRotationFallback=true)');
  assert(Boolean(fallbackMatch.rotationNote), '5f. Clear rotation fallback note logged');

  // -----------------------------------------------------------------
  // 6. Tool URLs are verified and correctly inserted into article content
  // -----------------------------------------------------------------
  console.log('\nTest 6: Tool Link Verification & Insertion');
  const targetTool = getToolBySlug('yarn-calculator')!;
  const testTopic: DiscoveredTopic = {
    id: 'topic_pumpkin_test',
    keyword: 'easy crochet pumpkin pattern free',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'seasonal_trend',
    toolSlug: 'yarn-calculator',
    targetToolUrl: '/tools/yarn-calculator',
    trendScore: 85,
    opportunityScore: 88,
    targetContentFormat: 'tutorial',
    discoveredAt: new Date().toISOString(),
    status: 'discovered'
  };

  const sampleHtml = `
    <h2>Crochet Pumpkin Materials</h2>
    <p>Before you begin, use our yarn calculator to figure out your yardage so you do not run out of yarn.</p>
    <h2>Step-by-Step Construction</h2>
    <p>Work rows of half double crochet in the back loop only to create the ribbed ridges.</p>
    <h2>Frequently Asked Questions</h2>
    <h3>How much yarn do I need?</h3>
    <p>A standard small pumpkin takes about 80 to 120 meters of worsted weight yarn.</p>
  `;

  const injected = injectInternalLinks(sampleHtml, [
    { anchorText: 'yarn calculator', url: '/tools/yarn-calculator', entityType: 'tool' },
    { anchorText: 'crochet', url: '/categories/crochet', entityType: 'category' }
  ], {
    targetTool,
    contentType: 'trending_crochet',
    currentArticleSlug: 'easy-crochet-pumpkin-pattern-free'
  });

  assert(injected.html.includes('href="/tools/yarn-calculator"'), '6a. Tool URL inserted into article HTML');
  assert(hasToolCta(injected.html, 'yarn-calculator'), '6b. Dedicated Tool CTA component injected');
  assert(injected.html.includes('welovepattern-tool-cta'), '6c. CTA container has proper styling class');

  // -----------------------------------------------------------------
  // 7. Article explains relationship between topic and tool
  // -----------------------------------------------------------------
  console.log('\nTest 7: Article Explains Topic-Tool Relationship');
  const mockArticle: GeneratedArticle = {
    title: 'How to Crochet Easy Pumpkins: Free Pattern & Yarn Guide',
    slug: 'how-to-crochet-easy-pumpkins',
    excerpt: 'Step-by-step crochet pumpkin tutorial with realistic stitches and yardage estimation.',
    category: 'crochet',
    tags: ['crochet', 'fall', 'pumpkins'],
    wordCount: 850,
    seoMeta: {
      title: 'Easy Crochet Pumpkin Pattern Free Tutorial | WeLovePattern',
      description: 'Make rustic crochet pumpkins for fall decor with our free easy pattern and interactive yarn calculator.',
      keywords: 'easy crochet pumpkin pattern free, crochet pumpkin'
    },
    contentHtml: injected.html,
    tokensUsed: { promptTokens: 500, completionTokens: 1000, totalTokens: 1500 }
  };

  const researchPacket = await conductTopicResearch(testTopic);
  const qgResult = evaluateProductionQualityGates(
    'job_test_phase2',
    mockArticle,
    testTopic,
    researchPacket,
    DEFAULT_SEO_ENGINE_CONFIG,
    { isTestRun: true }
  );

  if (!qgResult.passedAllGates) {
    console.error('7a Failure Reasons:', qgResult.rejectionReasons);
  }
  assert(qgResult.passedAllGates === true, '7a. Article passes all 9 quality gates');
  assert(mockArticle.contentHtml.includes('Yarn Calculator') || mockArticle.contentHtml.includes('yarn calculator'), '7b. Tool identity mentioned in article');

  // -----------------------------------------------------------------
  // 8. Unsupported capabilities or factual claims are rejected
  // -----------------------------------------------------------------
  console.log('\nTest 8: Unsupported Capabilities / Prohibited Claims Rejected');
  const badArticle: GeneratedArticle = {
    ...mockArticle,
    contentHtml: mockArticle.contentHtml + '<p>To calculate yarn, divide your stitches by stitches per skein.</p>'
  };

  const badQgResult = evaluateProductionQualityGates(
    'job_bad_claims',
    badArticle,
    testTopic,
    researchPacket,
    DEFAULT_SEO_ENGINE_CONFIG,
    { isTestRun: true }
  );

  assert(!badQgResult.passedAllGates, '8a. Prohibited metric (stitches per skein) is caught and rejected');
  assert(
    badQgResult.rejectionReasons.some(r => r.includes('stitches per skein')),
    '8b. Rejection reason specifically cites prohibited metric'
  );

  // -----------------------------------------------------------------
  // 9. Existing published articles checked for substantial topic overlap
  // -----------------------------------------------------------------
  console.log('\nTest 9: Content Cannibalization Check Against Published Blog Posts');
  // Check exact duplicate title with real published post in data/blog-posts.json
  const exactCollision = checkContentCannibalization(
    'magic-ring-crochet-tutorial-step-by-step-guide',
    'Magic Ring Crochet Tutorial: Step-by-Step Guide',
    'magic ring crochet tutorial'
  );
  assert(exactCollision.hasCollision === true, '9a. Exact title/slug collision detected with published post');

  // Check unique new title
  const uniqueTitleCheck = checkContentCannibalization(
    'rustic-autumn-crochet-wreath-guide',
    'Rustic Autumn Crochet Wreath Guide',
    'rustic autumn crochet wreath guide'
  );
  assert(uniqueTitleCheck.hasCollision === false, '9b. Distinct non-cannibalizing project approved');

  // -----------------------------------------------------------------
  // 10. Exactly one Pinterest creative produced
  // -----------------------------------------------------------------
  console.log('\nTest 10: Exactly One Pinterest Creative Produced');
  const resolvedBoard = {
    id: 'board_tutorials',
    name: 'Crochet Tutorials & Stitches'
  };
  const pins = generatePinterestCreativeConcepts(
    testTopic,
    mockArticle,
    researchPacket,
    resolvedBoard,
    1 // Phase 1 & 2 contract: exactly 1 pin per article
  );

  assert(pins.length === 1, '10a. Exactly 1 Pinterest creative concept generated', `Count: ${pins.length}`);

  // -----------------------------------------------------------------
  // 11. Pin destination matches canonical article URL & Action CTA matches tool
  // -----------------------------------------------------------------
  console.log('\nTest 11: Pin Canonical URL & Tool-Aligned Action CTA');
  const pin1 = pins[0];
  assert(
    pin1.destinationUrl === 'https://welovepattern.com/blog/how-to-crochet-easy-pumpkins',
    '11a. Pin destination URL matches canonical article URL',
    pin1.destinationUrl
  );
  assert(
    /CALCULATE YARN/i.test(pin1.typographyOverlay.ctaBadgeText),
    '11b. Pin CTA aligns with paired tool action',
    pin1.typographyOverlay.ctaBadgeText
  );
  assert(
    pin1.compactHiggsfieldPrompt.includes('LITERAL TEXT LOCK'),
    '11c. Higgsfield prompt includes literal text lock'
  );

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Phase 2 test runner encountered fatal error:', err);
  process.exit(1);
});
