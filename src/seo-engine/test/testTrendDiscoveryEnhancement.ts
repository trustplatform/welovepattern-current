/**
 * Dedicated Validation Suite for Multi-Market & Multi-Window Crochet Trend Discovery
 */

import { discoverTrendingCrochetTopic, discoverToolGuideTopic, discoverDailyTwoSlotTopics } from '../discovery/topicDiscovery';
import { scoreTrendingCrochetTopic } from '../discovery/opportunityScorer';
import { TARGET_MARKET_LOCATIONS } from '../discovery/dataForSeoClient';
import { CROCHET_PROBLEM_TREND_SEEDS, TRENDING_CROCHET_SEEDS } from '../discovery/gscSeedCatalog';

let passedCount = 0;
let failedCount = 0;

function check(assertion: boolean, name: string, details?: any) {
  if (assertion) {
    console.log(`✅ [PASS] ${name}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${name}`, details || '');
    failedCount++;
  }
}

export async function runTrendDiscoveryEnhancementTests(): Promise<boolean> {
  console.log('===============================================================');
  console.log('STARTING TREND DISCOVERY ENHANCEMENT TESTS');
  console.log('===============================================================');

  // Test 1: Verify 5 English-speaking target market location codes
  check(TARGET_MARKET_LOCATIONS.US.code === 2840, 'Target market US is 2840');
  check(TARGET_MARKET_LOCATIONS.UK.code === 2826, 'Target market UK is 2826');
  check(TARGET_MARKET_LOCATIONS.CA.code === 2124, 'Target market CA is 2124');
  check(TARGET_MARKET_LOCATIONS.AU.code === 2036, 'Target market AU is 2036');
  check(TARGET_MARKET_LOCATIONS.NZ.code === 2554, 'Target market NZ is 2554');
  check(Object.keys(TARGET_MARKET_LOCATIONS).length === 5, 'Exactly 5 target English markets configured');

  // Test 2: Verify Multi-Window Combined Trend Score formula (40% 7-day, 35% 30-day, 25% 90-day)
  const scoreResult = scoreTrendingCrochetTopic('how to crochet a blanket for beginners', {
    freshTrendScore: 90,     // 90 * 0.40 = 36
    recentTrendScore: 70,    // 70 * 0.35 = 24.5
    historicalTrendScore: 50 // 50 * 0.25 = 12.5 => Total = 73
  });

  check(scoreResult.combinedTrendScore === 73, `Combined trend score matches 40/35/25 formula: expected 73, got ${scoreResult.combinedTrendScore}`);
  check(scoreResult.totalOpportunityScore >= 0 && scoreResult.totalOpportunityScore <= 100, `Opportunity score remains within 0-100: ${scoreResult.totalOpportunityScore}`);

  // Test 3: Verify Rising vs Breakout classification behavior
  const breakoutResult = scoreTrendingCrochetTopic('easy crochet pumpkin pattern free', {
    freshTrendScore: 95,
    recentTrendScore: 60,
    historicalTrendScore: 30
  });
  check(breakoutResult.trendDirection === 'breakout', 'Fresh surge over baseline correctly classified as "breakout"');

  const stableHighHistoric = scoreTrendingCrochetTopic('easy crochet pumpkin pattern free', {
    freshTrendScore: 40,
    recentTrendScore: 40,
    historicalTrendScore: 90
  });
  check(stableHighHistoric.trendDirection === 'stable', 'High 90-day historical baseline alone does NOT cause "rising" or "breakout"');

  // Test 4: Verify Problem Trends in candidate seeds
  check(CROCHET_PROBLEM_TREND_SEEDS.length >= 5, 'Problem trend seeds catalog populated');
  const problemScore = scoreTrendingCrochetTopic('why is my crochet edge curling up');
  check(problemScore.isFilteredOut === false, 'Crochet problem query passes qualification as trending_crochet');
  check(problemScore.category === 'crochet', 'Problem query categorized as crochet');
  check(problemScore.contentType === 'trending_crochet', 'Problem query content type is trending_crochet');

  // Test 5: Verify Slot 1 vs Slot 2 Separation
  const slot1 = await discoverTrendingCrochetTopic({ useRealDataForSeo: false });
  const slot2 = await discoverToolGuideTopic({ useRealDataForSeo: false });

  check(slot1.contentType === 'trending_crochet', 'Slot 1 strictly remains trending_crochet');
  check(slot1.category === 'crochet', 'Slot 1 strictly remains crochet');
  check(slot2.contentType === 'tool_guide', 'Slot 2 strictly remains tool_guide');
  check(slot2.category === 'tools', 'Slot 2 strictly remains tools');
  check(slot2.toolSlug !== undefined, 'Slot 2 binds to real tool slug');

  // Test 6: Verify Tool keywords cannot enter Slot 1
  const toolCheck1 = scoreTrendingCrochetTopic('crochet yarn calculator for blanket');
  check(toolCheck1.isFilteredOut === true, 'Tool calculator keyword rejected from Slot 1');

  const toolCheck2 = scoreTrendingCrochetTopic('stitch counter online');
  check(toolCheck2.isFilteredOut === true, 'Tool counter keyword rejected from Slot 1');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================\n');

  return failedCount === 0;
}

runTrendDiscoveryEnhancementTests().then(success => {
  if (!success) process.exit(1);
});
