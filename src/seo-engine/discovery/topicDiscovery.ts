/**
 * SEO Content Engine - Two-Slot Topic Discovery Pipeline Orchestrator
 * 
 * STRICT PRODUCTION CONTRACT:
 * Exactly TWO content slots per daily batch:
 * 
 * SLOT 1: TRENDING CROCHET (Category: CROCHET, Type: TRENDING_CROCHET)
 * - Discovered from current demand/search interest via live DataForSEO Trends / curated trend seeds.
 * - Zero calculator / tool words allowed (e.g. no "yarn calculator").
 * - High search opportunity for projects, seasonal items, patterns, tutorials, techniques.
 * 
 * SLOT 2: TOOL GUIDE (Category: TOOLS, Type: TOOL_GUIDE)
 * - ALWAYS selected from real existing WeLovePattern tools in `src/data/toolsData.ts`.
 * - Rotates through tools based on least-recently-covered history to avoid duplication.
 * - Researches the core user problem solved by the tool.
 */

import { DiscoveredTopic, DataForSeoTrendItem, ArticleContentType } from '../types';
import { TRENDING_CROCHET_SEEDS, CROCHET_PROBLEM_TREND_SEEDS, TOOL_SEEDS_CATALOG } from './gscSeedCatalog';
import { TOOLS_DATA } from '../../data/toolsData';
import { isDataForSeoConfigured, createGoogleTrendsTask, getGoogleTrendsTaskResult, TARGET_MARKET_LOCATIONS, GoogleTrendsTimeRange } from './dataForSeoClient';
import { scoreTrendingCrochetTopic, scoreToolGuideTopic, isToolKeyword } from './opportunityScorer';
import { readEngineState, writeEngineState } from '../queue/engineStorage';
import { CONTENT_ENGINE_LIMITS } from '../config';

export interface RunDiscoveryOptions {
  limit?: number;
  useRealDataForSeo?: boolean;
}

/**
 * Returns set of recently covered keywords, slugs, and tool slugs to prevent cannibalization.
 */
function getRecentHistoricalData(lookbackDays = CONTENT_ENGINE_LIMITS.DUPLICATE_CHECK_LOOKBACK_DAYS): {
  recentKeywords: Set<string>;
  recentToolSlugs: Set<string>;
  recentSlugs: Set<string>;
} {
  const state = readEngineState();
  const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - lookbackMs;

  const recentKeywords = new Set<string>();
  const recentToolSlugs = new Set<string>();
  const recentSlugs = new Set<string>();

  const completedHistory = Array.isArray((state as any).completedJobsHistory) ? (state as any).completedJobsHistory : [];
  for (const job of completedHistory) {
    if (job?.date && new Date(job.date).getTime() > cutoffTime) {
      if (job.keyword) recentKeywords.add(job.keyword.toLowerCase().trim());
      if (job.articleSlug) recentSlugs.add(job.articleSlug.toLowerCase().trim());
    }
  }

  for (const job of (state.activeJobs || [])) {
    if (job?.topic?.keyword) {
      recentKeywords.add(job.topic.keyword.toLowerCase().trim());
    }
    if (job?.topic?.toolSlug) {
      recentToolSlugs.add(job.topic.toolSlug.toLowerCase().trim());
    }
    if (job?.articleContent?.slug) {
      recentSlugs.add(job.articleContent.slug.toLowerCase().trim());
    }
  }

  return { recentKeywords, recentToolSlugs, recentSlugs };
}

/**
 * Discovers the daily topic for SLOT 1: TRENDING CROCHET.
 * Category: 'crochet', Type: 'trending_crochet'.
 * 
 * Supports:
 * - 5 English-speaking markets (USA, UK, Canada, Australia, New Zealand)
 * - 3 distinct Google Trends time windows: 7 days (fresh), 30 days (recent), 90 days (historical)
 * - Weighted combinedTrendScore = 40% 7-day + 35% 30-day + 25% 90-day
 * - Multi-source candidate pool (curated seeds, problem trends, discovered queries)
 * - Strict tool disqualification & 60-day cannibalization guard.
 */
export async function discoverTrendingCrochetTopic(options: RunDiscoveryOptions = {}): Promise<DiscoveredTopic> {
  const { recentKeywords } = getRecentHistoricalData();
  const state = readEngineState();
  const cfg = state.config;

  const freshWeight = typeof cfg?.freshTrendWeight === 'number' ? cfg.freshTrendWeight : 0.40;
  const recentWeight = typeof cfg?.recentTrendWeight === 'number' ? cfg.recentTrendWeight : 0.35;
  const histWeight = typeof cfg?.historicalTrendWeight === 'number' ? cfg.historicalTrendWeight : 0.25;

  const isProblemEnabled = cfg?.problemTrendsEnabled !== false;
  const isGscSeedsEnabled = cfg?.gscSeedCatalogEnabled !== false;
  const isCuratedSeedsEnabled = cfg?.curatedSeedsEnabled !== false;

  // 1. Build unified candidate pool across sources (curated seeds + problem trends)
  const combinedSeedPool: { keyword: string; source: 'gsc_seed' | 'problem_trend' }[] = [];

  if (isGscSeedsEnabled || isCuratedSeedsEnabled) {
    combinedSeedPool.push(...TRENDING_CROCHET_SEEDS.map(s => ({ ...s, source: 'gsc_seed' as const })));
  }
  if (isProblemEnabled) {
    combinedSeedPool.push(...CROCHET_PROBLEM_TREND_SEEDS.map(s => ({ ...s, source: 'problem_trend' as const })));
  }

  // Fallback if all disabled
  if (combinedSeedPool.length === 0) {
    combinedSeedPool.push(...TRENDING_CROCHET_SEEDS.map(s => ({ ...s, source: 'gsc_seed' as const })));
  }

  const availableCandidates = combinedSeedPool.filter(s => 
    !recentKeywords.has(s.keyword.toLowerCase().trim()) &&
    !isToolKeyword(s.keyword)
  );

  const candidatePool = availableCandidates.length > 0 ? availableCandidates : combinedSeedPool;
  const candidateKeywords = candidatePool.slice(0, 8).map(s => s.keyword);

  // Map to store rich multi-window trend data per keyword
  const trendDataMap = new Map<string, DataForSeoTrendItem>();
  const discoveredRelatedQueries: string[] = [];

  // 2. Query DataForSEO across target markets and windows if configured
  if (options.useRealDataForSeo !== false && isDataForSeoConfigured() && candidateKeywords.length > 0 && cfg?.dataForSeoEnabled !== false) {
    try {
      const topBatch = candidateKeywords.slice(0, 5);
      const targetCountry = (cfg?.discoveryCountry || 'US').toUpperCase();
      const locationCode = TARGET_MARKET_LOCATIONS[targetCountry]?.code || TARGET_MARKET_LOCATIONS.US.code;

      // Submit primary 90-day task (historical baseline)
      const task90Promise = createGoogleTrendsTask(topBatch, {
        locationCode,
        timeRange: 'past_90_days'
      });

      // Submit 7-day task (fresh momentum)
      const task7Promise = createGoogleTrendsTask(topBatch, {
        locationCode,
        timeRange: 'past_7_days'
      });

      // Submit 30-day task (recent sustained)
      const task30Promise = createGoogleTrendsTask(topBatch, {
        locationCode,
        timeRange: 'past_30_days'
      });

      const [post90, post7, post30] = await Promise.all([task90Promise, task7Promise, task30Promise]);

      // Poll results
      const res90Map = new Map<string, number>();
      const res7Map = new Map<string, number>();
      const res30Map = new Map<string, number>();

      for (let i = 0; i < 5; i++) {
        await new Promise(res => setTimeout(res, 2500));
        
        if (post90?.taskId && res90Map.size === 0) {
          const g90 = await getGoogleTrendsTaskResult(post90.taskId);
          if (g90.isReady && g90.items.length > 0) {
            g90.items.forEach(it => {
              res90Map.set(it.keyword.toLowerCase(), it.trendScore);
              if (it.relatedQueries) discoveredRelatedQueries.push(...it.relatedQueries);
            });
          }
        }

        if (post7?.taskId && res7Map.size === 0) {
          const g7 = await getGoogleTrendsTaskResult(post7.taskId);
          if (g7.isReady && g7.items.length > 0) {
            g7.items.forEach(it => res7Map.set(it.keyword.toLowerCase(), it.trendScore));
          }
        }

        if (post30?.taskId && res30Map.size === 0) {
          const g30 = await getGoogleTrendsTaskResult(post30.taskId);
          if (g30.isReady && g30.items.length > 0) {
            g30.items.forEach(it => res30Map.set(it.keyword.toLowerCase(), it.trendScore));
          }
        }

        if (res90Map.size > 0 && res7Map.size > 0 && res30Map.size > 0) {
          break;
        }
      }

      // Populate trend data map with multi-window calculation
      for (const kw of topBatch) {
        const lower = kw.toLowerCase();
        const fresh = res7Map.get(lower) ?? 0;
        const recent = res30Map.get(lower) ?? 0;
        const historical = res90Map.get(lower) ?? 0;

        // Weighted calculation based on config
        const combined = Math.round(fresh * freshWeight + recent * recentWeight + historical * histWeight);

        let direction: 'rising' | 'stable' | 'breakout' = 'stable';
        if (fresh > 75 && fresh > historical * 1.5) {
          direction = 'breakout';
        } else if (fresh > 35 && (fresh > historical * 1.25 || recent > historical * 1.2)) {
          direction = 'rising';
        }

        trendDataMap.set(lower, {
          keyword: kw,
          trendScore: combined,
          combinedTrendScore: combined,
          freshTrendScore: fresh,
          recentTrendScore: recent,
          historicalTrendScore: historical,
          trendDirection: direction
        });
      }
    } catch (err: any) {
      console.warn('[TopicDiscovery] DataForSEO trend query for Crochet slot encountered error:', err?.message || err);
    }
  }

  // 3. Score all candidates
  const scoredCandidates: DiscoveredTopic[] = [];

  // Evaluate candidate pool
  for (const seed of candidatePool.slice(0, 8)) {
    const kw = seed.keyword;
    const trendItem = trendDataMap.get(kw.toLowerCase());
    const breakdown = scoreTrendingCrochetTopic(kw, {
      searchTrendSignal: trendItem?.trendScore,
      freshTrendScore: trendItem?.freshTrendScore,
      recentTrendScore: trendItem?.recentTrendScore,
      historicalTrendScore: trendItem?.historicalTrendScore,
      combinedTrendScore: trendItem?.combinedTrendScore,
      trendDirection: trendItem?.trendDirection
    });

    if (!breakdown.isFilteredOut) {
      const id = `topic_crochet_${Buffer.from(kw.toLowerCase()).toString('hex').slice(0, 12)}`;
      scoredCandidates.push({
        id,
        keyword: kw,
        contentType: 'trending_crochet',
        category: 'crochet',
        source: trendItem ? 'dataforseo_trends' : (seed.source || 'gsc_seed'),
        trendScore: breakdown.combinedTrendScore ?? trendItem?.trendScore ?? 80,
        freshTrendScore: breakdown.freshTrendScore ?? trendItem?.freshTrendScore,
        recentTrendScore: breakdown.recentTrendScore ?? trendItem?.recentTrendScore,
        historicalTrendScore: breakdown.historicalTrendScore ?? trendItem?.historicalTrendScore,
        combinedTrendScore: breakdown.combinedTrendScore ?? trendItem?.combinedTrendScore,
        trendDirection: breakdown.trendDirection || trendItem?.trendDirection || 'stable',
        opportunityScore: breakdown.totalOpportunityScore,
        targetContentFormat: breakdown.targetFormat,
        targetCategoryUrl: breakdown.targetCategoryUrl || '/categories/crochet',
        targetPatternUrls: breakdown.targetPatternUrls,
        targetAudienceLevel: 'all_levels',
        searchIntentNotes: seed.notes || 'Current Trending Crochet search opportunity (Slot 1)',
        discoveredAt: new Date().toISOString(),
        status: 'discovered',
      });
    }
  }

  // Also evaluate newly discovered related queries from DataForSEO
  for (const rq of discoveredRelatedQueries) {
    const norm = rq.toLowerCase().trim();
    if (!recentKeywords.has(norm) && !isToolKeyword(norm)) {
      const breakdown = scoreTrendingCrochetTopic(norm);
      if (!breakdown.isFilteredOut && breakdown.totalOpportunityScore >= 70) {
        const id = `topic_crochet_${Buffer.from(norm).toString('hex').slice(0, 12)}`;
        scoredCandidates.push({
          id,
          keyword: norm,
          contentType: 'trending_crochet',
          category: 'crochet',
          source: 'fresh_trend',
          trendScore: 85,
          freshTrendScore: 85,
          recentTrendScore: 80,
          historicalTrendScore: 70,
          combinedTrendScore: 80,
          trendDirection: 'rising',
          opportunityScore: breakdown.totalOpportunityScore,
          targetContentFormat: breakdown.targetFormat,
          targetCategoryUrl: breakdown.targetCategoryUrl || '/categories/crochet',
          targetPatternUrls: breakdown.targetPatternUrls,
          targetAudienceLevel: 'all_levels',
          searchIntentNotes: 'Dynamically discovered rising related search query from Google Trends',
          discoveredAt: new Date().toISOString(),
          status: 'discovered',
        });
      }
    }
  }

  // Sort by opportunity score descending
  scoredCandidates.sort((a, b) => b.opportunityScore - a.opportunityScore);
  const bestTopic = scoredCandidates[0] || {
    id: `topic_crochet_${Date.now()}`,
    keyword: candidateKeywords[0] || 'easy crochet pumpkin pattern free',
    contentType: 'trending_crochet',
    category: 'crochet',
    source: 'gsc_seed',
    trendScore: 85,
    freshTrendScore: 85,
    recentTrendScore: 80,
    historicalTrendScore: 75,
    combinedTrendScore: 81,
    trendDirection: 'rising',
    opportunityScore: 88,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/categories/tutorials',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: 'Fallback qualified trending crochet topic',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  return bestTopic;
}

/**
 * Discovers the daily topic for SLOT 2: TOOL GUIDE.
 * Category: 'tools', Type: 'tool_guide'.
 * Selects a real WeLovePattern tool from `TOOLS_DATA` using rotation/priority.
 */
export async function discoverToolGuideTopic(options: RunDiscoveryOptions = {}): Promise<DiscoveredTopic> {
  const { recentToolSlugs, recentKeywords } = getRecentHistoricalData();

  // 1. Select the least recently covered real tool from TOOLS_DATA
  const availableTools = TOOLS_DATA.filter(t => !recentToolSlugs.has(t.slug.toLowerCase()));
  const candidateTools = availableTools.length > 0 ? availableTools : TOOLS_DATA;

  // Prioritize popular tools first, then others
  const prioritizedTools = [...candidateTools].sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return 0;
  });

  const selectedTool = prioritizedTools[0];
  const toolMapping = TOOL_SEEDS_CATALOG.find(m => m.toolSlug === selectedTool.slug) || {
    toolSlug: selectedTool.slug,
    toolTitle: selectedTool.title,
    primaryKeyword: `${selectedTool.title.toLowerCase()} crochet tool`,
    searchIntentProblem: selectedTool.description,
    secondaryKeywords: []
  };

  let trendScore = selectedTool.isPopular ? 85 : 75;
  let trendDirection: 'rising' | 'stable' | 'breakout' = 'stable';

  // 2. Query DataForSEO for the tool's primary query if enabled
  if (options.useRealDataForSeo !== false && isDataForSeoConfigured()) {
    try {
      const postResult = await createGoogleTrendsTask([toolMapping.primaryKeyword]);
      if (postResult?.taskId) {
        for (let i = 0; i < 4; i++) {
          await new Promise(res => setTimeout(res, 2500));
          const getResult = await getGoogleTrendsTaskResult(postResult.taskId);
          if (getResult.isReady && getResult.items.length > 0) {
            const item = getResult.items[0];
            trendScore = item.trendScore;
            trendDirection = item.trendDirection;
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[TopicDiscovery] DataForSEO trend query for tool "${selectedTool.slug}" encountered error:`, err?.message || err);
    }
  }

  // 3. Score the Tool topic
  const breakdown = scoreToolGuideTopic(selectedTool.slug, toolMapping.primaryKeyword, {
    searchTrendSignal: trendScore,
    trendDirection
  });

  const id = `topic_tool_${selectedTool.slug.replace(/-/g, '_')}_${Buffer.from(toolMapping.primaryKeyword).toString('hex').slice(0, 8)}`;

  const toolTopic: DiscoveredTopic = {
    id,
    keyword: toolMapping.primaryKeyword,
    contentType: 'tool_guide',
    category: 'tools',
    source: 'internal_catalog',
    trendScore,
    trendDirection,
    opportunityScore: breakdown.totalOpportunityScore,
    targetContentFormat: 'tool_focus',
    toolSlug: selectedTool.slug,
    targetToolUrl: `/tools/${selectedTool.slug}`,
    targetCategoryUrl: '/categories/tools',
    targetAudienceLevel: 'all_levels',
    searchIntentNotes: `Tool Guide for real WeLovePattern interactive tool: ${selectedTool.title}. Problem: ${toolMapping.searchIntentProblem}`,
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  return toolTopic;
}

/**
 * Discovers exactly TWO daily production topics:
 * Slot 1: 1 x TRENDING CROCHET (Category: CROCHET)
 * Slot 2: 1 x TOOL GUIDE (Category: TOOLS)
 */
export async function discoverDailyTwoSlotTopics(options: RunDiscoveryOptions = {}): Promise<[DiscoveredTopic, DiscoveredTopic]> {
  const [slot1Crochet, slot2Tool] = await Promise.all([
    discoverTrendingCrochetTopic(options),
    discoverToolGuideTopic(options)
  ]);

  // Strict Contract Verification
  if (slot1Crochet.contentType !== 'trending_crochet' || slot1Crochet.category !== 'crochet') {
    throw new Error(`Slot 1 topic invalid: Expected contentType 'trending_crochet' and category 'crochet', got '${slot1Crochet.contentType}' / '${slot1Crochet.category}'.`);
  }

  if (slot2Tool.contentType !== 'tool_guide' || slot2Tool.category !== 'tools' || !slot2Tool.toolSlug) {
    throw new Error(`Slot 2 topic invalid: Expected contentType 'tool_guide', category 'tools', and real toolSlug, got '${slot2Tool.contentType}' / '${slot2Tool.category}' / '${slot2Tool.toolSlug}'.`);
  }

  if (isToolKeyword(slot1Crochet.keyword)) {
    throw new Error(`Slot 1 topic "${slot1Crochet.keyword}" contains a prohibited tool term.`);
  }

  // Update atomic engine state with discovered topics
  const state = readEngineState();
  const existingTopics = state.todayDiscoveredTopics || [];
  const updatedTopics = [
    slot1Crochet,
    slot2Tool,
    ...existingTopics.filter(t => t.id !== slot1Crochet.id && t.id !== slot2Tool.id)
  ].slice(0, 50);

  state.todayDiscoveredTopics = updatedTopics;
  writeEngineState(state);

  return [slot1Crochet, slot2Tool];
}

/**
 * Runs the topic discovery pipeline end-to-end and returns discovered topics.
 */
export async function runTopicDiscoveryPipeline(options: RunDiscoveryOptions = {}): Promise<DiscoveredTopic[]> {
  const [slot1, slot2] = await discoverDailyTwoSlotTopics(options);
  return [slot1, slot2];
}
