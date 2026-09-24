/**
 * SEO Content Engine - Transparent 100-Point Opportunity Scorer
 * 
 * Evaluates discovered topics across 5 distinct dimensions:
 * 1. Fiber Craft Relevance (0–30 pts) [Hard Gate: non-crochet filtered immediately]
 * 2. Ecosystem / Tool Fit (0–25 pts)
 * 3. Search Momentum / Volume Signal (0–20 pts)
 * 4. Actionability & Maker Search Intent (0–15 pts)
 * 5. Seasonality & Freshness (0–10 pts)
 * 
 * Enforces 60-day duplicate prevention against completed and active jobs.
 */

import { DiscoveredTopic, ContentFormat, SeoEngineDailyState } from '../types';
import { GscSeedKeyword } from '../types';
import { getVerifiedInternalLinkCatalog } from '../generation/internalLinkCatalog';
import { CONTENT_ENGINE_LIMITS } from '../config';

/** Irrelevant terms that disqualify a topic from production immediately */
const DISQUALIFYING_PATTERNS = [
  /medical/i,
  /surgical/i,
  /metal crochet/i,
  /crochet braids/i, // Hair styling, outside fiber craft focus
  /hair extension/i,
  /crypto/i,
  /finance/i,
  /casino/i,
  /software/i
];

/** Core positive fiber craft keywords */
const FIBER_CRAFT_INDICATORS = [
  'crochet', 'yarn', 'stitch', 'stitches', 'hook', 'amigurumi', 'granny square',
  'skein', 'yardage', 'gauge', 'swatch', 'blanket', 'afghan', 'tapestry',
  'single crochet', 'double crochet', 'half double', 'slip stitch', 'magic ring',
  'chain stitch', 'wip', 'tension', 'worsted', 'chunky yarn', 'acrylic yarn'
];

export interface ScoredTopicBreakdown {
  relevanceScore: number;                     // 0-30
  siteFitScore: number;                       // 0-25
  momentumScore: number;                      // 0-20
  actionabilityScore: number;                 // 0-15
  seasonalityScore: number;                   // 0-10
  totalOpportunityScore: number;              // 0-100
  isFilteredOut: boolean;
  filterReason?: string;
  targetFormat: ContentFormat;
  targetToolUrl?: string;
  targetCategoryUrl?: string;
  targetPatternUrls?: string[];
}

/**
 * Calculates current seasonal affinity bonus (0 to 10 points) based on current month.
 */
function calculateSeasonalityScore(keyword: string): number {
  const currentMonth = new Date().getMonth() + 1; // 1 = Jan, 12 = Dec
  const lower = keyword.toLowerCase();

  // Autumn / Winter season (September - February)
  if (currentMonth >= 9 || currentMonth <= 2) {
    if (/blanket|afghan|sweater|cardigan|beanie|hat|scarf|chunky|velvet|cozy|winter|christmas|halloween/i.test(lower)) {
      return 10;
    }
    if (/flower|top|tank|summer|market bag/i.test(lower)) {
      return 4; // Off-peak
    }
    return 7;
  }

  // Spring / Summer season (March - August)
  if (currentMonth >= 3 && currentMonth <= 8) {
    if (/flower|floral|cotton|market bag|tote|crop top|tank|summer|spring|baby/i.test(lower)) {
      return 10;
    }
    if (/chunky blanket|wool sweater|heavy winter/i.test(lower)) {
      return 3;
    }
    return 7;
  }

  return 6;
}

/**
 * Scores a raw keyword topic against the WeLovePattern ecosystem.
 */
export function scoreTopicOpportunity(
  keyword: string,
  options?: {
    searchTrendSignal?: number;               // 0-100 from DataForSEO
    trendDirection?: 'rising' | 'stable' | 'breakout';
    gscSeedMatch?: GscSeedKeyword;
  }
): ScoredTopicBreakdown {
  const normalized = keyword.trim().toLowerCase();

  // 1. Hard Filter Check
  for (const pattern of DISQUALIFYING_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        relevanceScore: 0,
        siteFitScore: 0,
        momentumScore: 0,
        actionabilityScore: 0,
        seasonalityScore: 0,
        totalOpportunityScore: 0,
        isFilteredOut: true,
        filterReason: `Disqualified by negative term filter: "${normalized}"`,
        targetFormat: 'guide'
      };
    }
  }

  // 2. Fiber Craft Relevance (0-30 pts)
  let relevanceScore = 0;
  let matchesCount = 0;
  for (const indicator of FIBER_CRAFT_INDICATORS) {
    if (normalized.includes(indicator)) {
      matchesCount++;
    }
  }

  if (matchesCount === 0 && !options?.gscSeedMatch) {
    return {
      relevanceScore: 0,
      siteFitScore: 0,
      momentumScore: 0,
      actionabilityScore: 0,
      seasonalityScore: 0,
      totalOpportunityScore: 0,
      isFilteredOut: true,
      filterReason: 'No fiber craft terminology detected',
      targetFormat: 'guide'
    };
  }

  relevanceScore = Math.min(30, 15 + matchesCount * 5);
  if (options?.gscSeedMatch) relevanceScore = 30;

  // 3. Ecosystem / Tool Fit (0-25 pts)
  const catalog = getVerifiedInternalLinkCatalog();
  let siteFitScore = 10; // Base score for relevant craft
  let targetToolUrl: string | undefined;
  let targetCategoryUrl: string | undefined;
  const targetPatternUrls: string[] = [];

  // Check matching tools
  const tools = catalog.filter(c => c.entityType === 'tool');
  for (const tool of tools) {
    if (tool.keywords.some(k => normalized.includes(k) || k.includes(normalized))) {
      siteFitScore = 25; // Perfect tool fit
      targetToolUrl = tool.url;
      break;
    }
  }

  // If GSC seed match specified a tool
  if (options?.gscSeedMatch?.targetToolSlug) {
    siteFitScore = 25;
    targetToolUrl = `/tools/${options.gscSeedMatch.targetToolSlug}`;
  }

  // Check matching categories
  const categories = catalog.filter(c => c.entityType === 'category');
  for (const cat of categories) {
    if (cat.keywords.some(k => normalized.includes(k))) {
      if (siteFitScore < 20) siteFitScore = 20;
      targetCategoryUrl = cat.url;
      break;
    }
  }

  // Find 1-2 complementary patterns
  const patterns = catalog.filter(c => c.entityType === 'pattern');
  for (const pat of patterns) {
    if (targetPatternUrls.length >= 2) break;
    if (pat.keywords.some(k => normalized.includes(k))) {
      targetPatternUrls.push(pat.url);
    }
  }

  // 4. Search Momentum / Volume Signal (0-20 pts)
  let momentumScore = 12;
  if (options?.searchTrendSignal !== undefined) {
    // Scale 0-100 to 0-20
    momentumScore = Math.round((options.searchTrendSignal / 100) * 20);
    if (options.trendDirection === 'breakout') {
      momentumScore = Math.min(20, momentumScore + 4);
    } else if (options.trendDirection === 'rising') {
      momentumScore = Math.min(20, momentumScore + 2);
    }
  } else if (options?.gscSeedMatch) {
    momentumScore = options.gscSeedMatch.priority === 'very_high' ? 20 : 16;
  }

  // 5. Actionability & Maker Intent (0-15 pts)
  let actionabilityScore = 8;
  if (/calculator|converter|chart|formula|how much|size|dimensions/i.test(normalized)) {
    actionabilityScore = 15;
  } else if (/tutorial|how to|guide|step by step|beginner|instructions/i.test(normalized)) {
    actionabilityScore = 14;
  } else if (/pattern|patterns|free pattern|roundup|ideas/i.test(normalized)) {
    actionabilityScore = 12;
  } else if (/vs|difference|compare/i.test(normalized)) {
    actionabilityScore = 13;
  }

  // 6. Seasonality & Freshness (0-10 pts)
  const seasonalityScore = calculateSeasonalityScore(normalized);

  const totalOpportunityScore = relevanceScore + siteFitScore + momentumScore + actionabilityScore + seasonalityScore;

  // Determine Target Content Format
  let targetFormat: ContentFormat = 'guide';
  if (targetToolUrl || /calculator|converter|pricing chart/i.test(normalized)) {
    targetFormat = 'tool_focus';
  } else if (/vs|difference|conversion/i.test(normalized)) {
    targetFormat = 'explainer_comparison';
  } else if (/tutorial|how to|step by step/i.test(normalized)) {
    targetFormat = 'tutorial';
  } else if (/patterns|roundup|best|ideas/i.test(normalized)) {
    targetFormat = 'pattern_roundup';
  }

  return {
    relevanceScore,
    siteFitScore,
    momentumScore,
    actionabilityScore,
    seasonalityScore,
    totalOpportunityScore: Math.min(100, Math.max(0, totalOpportunityScore)),
    isFilteredOut: false,
    targetFormat,
    targetToolUrl,
    targetCategoryUrl,
    targetPatternUrls: targetPatternUrls.length > 0 ? targetPatternUrls : undefined
  };
}

/**
 * Convenience helper that evaluates a keyword and returns a fully-formed DiscoveredTopic.
 */
export function scoreDiscoveredTopic(
  keyword: string,
  trendItem?: { trendScore?: number; trendDirection?: 'rising' | 'stable' | 'breakout' }
): DiscoveredTopic {
  const breakdown = scoreTopicOpportunity(keyword, {
    searchTrendSignal: trendItem?.trendScore,
    trendDirection: trendItem?.trendDirection
  });

  return {
    id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    keyword: keyword.trim(),
    trendScore: trendItem?.trendScore ?? 0,
    trendDirection: trendItem?.trendDirection ?? 'stable',
    opportunityScore: breakdown.totalOpportunityScore,
    targetContentFormat: breakdown.targetFormat,
    targetToolUrl: breakdown.targetToolUrl,
    targetCategoryUrl: breakdown.targetCategoryUrl,
    targetPatternUrls: breakdown.targetPatternUrls,
    targetAudienceLevel: /beginner|easy/i.test(keyword) ? 'beginner' : 'all_levels',
    searchIntentNotes: breakdown.isFilteredOut
      ? (breakdown.filterReason || 'Filtered out')
      : `Scored: ${breakdown.totalOpportunityScore}/100. Format: ${breakdown.targetFormat}`,
    discoveredAt: new Date().toISOString(),
    status: breakdown.isFilteredOut ? 'filtered_out' : 'discovered'
  };
}

/**
 * Computes token overlap between two keyword strings.
 */
function computeKeywordIntentOverlap(kwA: string, kwB: string): number {
  const stopWords = new Set(['how', 'much', 'many', 'to', 'for', 'the', 'a', 'an', 'in', 'of', 'and', 'with', 'your']);
  const tokensA = new Set(kwA.toLowerCase().split(/[\s_-]+/).filter(t => t.length > 2 && !stopWords.has(t)));
  const tokensB = new Set(kwB.toLowerCase().split(/[\s_-]+/).filter(t => t.length > 2 && !stopWords.has(t)));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Checks whether a topic was already published or queued within the duplicate lookback window,
 * or duplicates search intent of an existing published article.
 */
export function isDuplicateTopic(
  keyword: string,
  state: SeoEngineDailyState,
  lookbackDays: number = CONTENT_ENGINE_LIMITS.DUPLICATE_CHECK_LOOKBACK_DAYS
): boolean {
  const normalized = keyword.trim().toLowerCase();
  const cutoffTime = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  // 1. Check active jobs (exact or semantic intent overlap >= 75%)
  for (const job of state.activeJobs) {
    const jobKw = job.topic.keyword.trim().toLowerCase();
    if (jobKw === normalized) return true;
    if (computeKeywordIntentOverlap(jobKw, normalized) >= 0.75) return true;
  }

  // 2. Check completed historical jobs
  for (const history of state.completedJobsHistory) {
    const jobTime = new Date(history.date).getTime();
    const histKw = history.keyword.trim().toLowerCase();
    if (histKw === normalized) return true;
    if (jobTime >= cutoffTime && computeKeywordIntentOverlap(histKw, normalized) >= 0.75) {
      return true;
    }
  }

  // 3. Check published catalog to prevent cannibalization
  const catalog = getVerifiedInternalLinkCatalog();
  const blogItems = catalog.filter(c => c.entityType === 'blog');
  for (const item of blogItems) {
    if (computeKeywordIntentOverlap(item.title.toLowerCase(), normalized) >= 0.8) {
      return true;
    }
  }

  return false;
}

/**
 * Selects the top N topics from a candidate pool that meet the minimum opportunity score
 * and are not duplicates.
 */
export function selectBestTopics(
  candidates: DiscoveredTopic[],
  state: SeoEngineDailyState,
  limitCount: number = 4,
  minScore: number = 65
): DiscoveredTopic[] {
  // Filter eligible topics
  const eligible = candidates.filter(topic => {
    if (topic.opportunityScore < minScore) return false;
    if (topic.status === 'filtered_out') return false;
    if (isDuplicateTopic(topic.keyword, state)) return false;
    return true;
  });

  // Sort descending by opportunity score
  eligible.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const selected = eligible.slice(0, limitCount);

  for (const item of selected) {
    item.status = 'selected';
  }

  return selected;
}
