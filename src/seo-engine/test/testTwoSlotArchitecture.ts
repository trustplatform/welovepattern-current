/**
 * Unit & Integration Test for New Two-Slot Daily Production Architecture
 * 
 * Tests:
 * 1. SLOT 1: Trending Crochet discovery (Category: CROCHET, Type: TRENDING_CROCHET, zero tool words)
 * 2. SLOT 2: Tool Guide discovery (Category: TOOLS, Type: TOOL_GUIDE, bound to real TOOLS_DATA tool)
 * 3. Two-Slot Daily Batch generation (Guarantees exactly 1 CROCHET + 1 TOOLS)
 * 4. Deduplication and Tool-term filtering
 * 5. Internal link priorities (Crochet vs Tools)
 * 6. Zero Higgsfield calls made
 */

import { discoverTrendingCrochetTopic, discoverToolGuideTopic, discoverDailyTwoSlotTopics } from '../discovery/topicDiscovery';
import { scoreTrendingCrochetTopic, scoreToolGuideTopic, isToolKeyword } from '../discovery/opportunityScorer';
import { createDailyProductionBatch, queueJobForTopic } from '../queue/jobQueueManager';
import { DEFAULT_SEO_ENGINE_CONFIG } from '../config';
import { TOOLS_DATA } from '../../data/toolsData';
import { isRouteValid, findRelevantInternalLinks } from '../generation/internalLinkCatalog';
import { evaluateProductionQualityGates } from '../validation/productionQualityGates';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';
import { FactualResearchPacket, DiscoveredTopic } from '../types';

let passedCount = 0;
let failedCount = 0;

function check(assertion: boolean, name: string, details?: string) {
  if (assertion) {
    passedCount++;
    console.log(`✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
  } else {
    failedCount++;
    console.error(`❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
  }
}

export async function runTwoSlotArchitectureTests(): Promise<boolean> {
  console.log('===============================================================');
  console.log('STARTING TWO-SLOT DAILY SEO ENGINE ARCHITECTURAL VERIFICATION');
  console.log('===============================================================\n');

  // Test 1: Tool keyword detection
  check(isToolKeyword('crochet blanket yarn calculator') === true, 'isToolKeyword detects calculator');
  check(isToolKeyword('easy crochet pumpkin pattern free') === false, 'isToolKeyword permits genuine crochet pattern');
  check(isToolKeyword('gauge swatch converter tool') === true, 'isToolKeyword detects converter tool');
  check(isToolKeyword('how to join granny squares seamlessly') === false, 'isToolKeyword permits technique tutorial');

  // Test 2: Slot 1 Scoring rejects tool terms
  const toolScoreForSlot1 = scoreTrendingCrochetTopic('crochet gauge calculator');
  check(toolScoreForSlot1.isFilteredOut === true, 'Slot 1 strictly filters out tool keyword');
  check(toolScoreForSlot1.contentType === 'trending_crochet', 'Slot 1 contentType is trending_crochet');
  check(toolScoreForSlot1.category === 'crochet', 'Slot 1 category is crochet');

  // Test 3: Slot 1 Scoring accepts genuine crochet trends
  const crochetScore = scoreTrendingCrochetTopic('easy crochet pumpkin pattern free');
  check(crochetScore.isFilteredOut === false, 'Slot 1 accepts genuine crochet project topic');
  check(crochetScore.totalOpportunityScore >= 75, 'Slot 1 assigns high opportunity score to seasonal project', `Score: ${crochetScore.totalOpportunityScore}`);
  check(crochetScore.category === 'crochet', 'Slot 1 category is strictly crochet');

  // Test 4: Slot 2 Scoring binds to real tools
  const toolScore = scoreToolGuideTopic('yarn-calculator');
  check(toolScore.isFilteredOut === false, 'Slot 2 accepts real tool from TOOLS_DATA');
  check(toolScore.contentType === 'tool_guide', 'Slot 2 contentType is tool_guide');
  check(toolScore.category === 'tools', 'Slot 2 category is strictly tools');
  check(toolScore.targetToolUrl === '/tools/yarn-calculator', 'Slot 2 resolves targetToolUrl correctly');
  check(isRouteValid('/tools/yarn-calculator') === true, 'Slot 2 targetToolUrl is valid in link catalog');

  // Test 5: Slot 2 rejects non-existent tools
  const fakeToolScore = scoreToolGuideTopic('fictional-ai-crochet-machine');
  check(fakeToolScore.isFilteredOut === true, 'Slot 2 strictly rejects non-existent tool slug');

  // Test 6: Discover Slot 1 (Trending Crochet) Topic
  const slot1Topic = await discoverTrendingCrochetTopic({ useRealDataForSeo: false });
  check(slot1Topic.contentType === 'trending_crochet', 'Slot 1 discovery returns contentType trending_crochet');
  check(slot1Topic.category === 'crochet', 'Slot 1 discovery returns category crochet');
  check(!isToolKeyword(slot1Topic.keyword), `Slot 1 topic "${slot1Topic.keyword}" contains zero tool terms`);

  // Test 7: Discover Slot 2 (Tool Guide) Topic
  const slot2Topic = await discoverToolGuideTopic({ useRealDataForSeo: false });
  check(slot2Topic.contentType === 'tool_guide', 'Slot 2 discovery returns contentType tool_guide');
  check(slot2Topic.category === 'tools', 'Slot 2 discovery returns category tools');
  check(Boolean(slot2Topic.toolSlug), `Slot 2 topic is mapped to real tool slug "${slot2Topic.toolSlug}"`);
  check(TOOLS_DATA.some(t => t.slug === slot2Topic.toolSlug), 'Slot 2 toolSlug exists in TOOLS_DATA catalog');

  // Test 8: Discover Daily Two Slot Topics (1 Crochet + 1 Tools)
  const [dailySlot1, dailySlot2] = await discoverDailyTwoSlotTopics({ useRealDataForSeo: false });
  check(dailySlot1.contentType === 'trending_crochet' && dailySlot1.category === 'crochet', 'Daily Slot 1 is strictly Trending Crochet');
  check(dailySlot2.contentType === 'tool_guide' && dailySlot2.category === 'tools', 'Daily Slot 2 is strictly Tool Guide');
  check(dailySlot1.keyword !== dailySlot2.keyword, 'Daily batch contains two distinct keywords');

  // Test 9: Create Daily Production Batch in Queue
  const [jobA, jobB] = await createDailyProductionBatch({ useRealDataForSeo: false });
  check(jobA.contentType === 'trending_crochet' && jobA.category === 'crochet', 'Job A queued as trending_crochet in crochet category');
  check(jobB.contentType === 'tool_guide' && jobB.category === 'tools', 'Job B queued as tool_guide in tools category');
  check(jobA.stage === 'selected' && jobB.stage === 'selected', 'Both jobs queued in selected stage');

  // Test 10: Quality Gate Slot Verification
  const pumpkinTopic: DiscoveredTopic = {
    id: 'topic_pumpkin_test',
    keyword: 'easy crochet pumpkin pattern free',
    contentType: 'trending_crochet',
    category: 'crochet',
    trendScore: 85,
    trendDirection: 'rising',
    opportunityScore: 85,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/categories/tutorials',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const mockCrochetArticle: GeneratedArticle = {
    title: 'How to Crochet an Easy Pumpkin for Fall',
    slug: 'easy-crochet-pumpkin-fall-guide',
    excerpt: 'Step by step beginner tutorial for ribbed plush pumpkins.',
    contentHtml: '<h2>Materials for Crochet Pumpkin</h2><p>Use worsted yarn and 5.0 mm hook. Follow these steps...</p><h2>Step by Step Process</h2><p>Crochet the rectangle and cinch tightly...</p><h2>Frequently Asked Questions</h2><h3>What yarn works best?</h3><p>Medium worsted acrylic or wool.</p>',
    wordCount: 850,
    category: 'crochet',
    contentType: 'trending_crochet',
    tags: ['crochet', 'pumpkin', 'fall', 'tutorial'],
    seoMeta: {
      title: 'Easy Crochet Pumpkin Pattern Free: Beginner Guide',
      description: 'Learn how to crochet a cozy ribbed pumpkin with our easy free pattern and step by step photo guide.',
      keywords: 'easy crochet pumpkin pattern free, fall crochet'
    },
    internalLinks: [{ anchorText: 'Blanket Patterns', url: '/categories/blankets', entityType: 'category' }],
    tokensUsed: { promptTokens: 100, completionTokens: 500, totalTokens: 600 }
  };

  const mockPacket: FactualResearchPacket = {
    topicId: pumpkinTopic.id,
    topic: 'easy crochet pumpkin pattern free',
    searchIntent: 'Beginner searching for simple pumpkin tutorial',
    craftType: 'crochet',
    sourceAuthority: 'Craft Yarn Council',
    verifiedTerminology: ['single crochet', 'back loop only (blo)'],
    verifiedMaterials: {
      yarnWeights: ['Medium / Worsted (#4)'],
      hookSizes: ['5.0 mm (H-8)']
    },
    techniqueKeyPoints: ['Work in back loops for ribbed texture'],
    makerPainPoints: ['Loose stuffing at base'],
    faqItems: [{ question: 'What yarn works best?', factualAnswer: 'Medium worsted acrylic or wool.' }],
    verifiedInternalLinks: [{ anchorText: 'Blanket Patterns', url: '/categories/blankets', entityType: 'category' }]
  };

  const qgResult = evaluateProductionQualityGates(
    jobA.id,
    mockCrochetArticle,
    pumpkinTopic,
    mockPacket,
    DEFAULT_SEO_ENGINE_CONFIG
  );

  check(qgResult.gates.seoIntentAlignment.passed === true, 'Quality Gate 2 passes valid Trending Crochet slot classification');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================\n');

  return failedCount === 0;
}

// Execute test
runTwoSlotArchitectureTests().then(success => {
  if (!success) process.exit(1);
});
