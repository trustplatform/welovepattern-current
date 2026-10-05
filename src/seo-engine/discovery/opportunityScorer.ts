/**
 * SEO Content Engine - Transparent 100-Point Opportunity Scorer
 * 
 * Evaluates discovered topics across explicit content slots:
 * 
 * 1. TRENDING_CROCHET (Slot 1):
 *    - Strict disqualification of all tool/calculator words.
 *    - Scores project interest, seasonal alignment, tutorial/pattern search intent, and crochet fit.
 *    - Category: 'crochet', Format: 'tutorial' | 'guide' | 'pattern_roundup' | 'explainer_comparison'.
 * 
 * 2. TOOL_GUIDE (Slot 2):
 *    - Strictly mapped to real WeLovePattern interactive tools in `src/data/toolsData.ts`.
 *    - Scores problem clarity, calculator/estimator utility, search intent, and tool routing.
 *    - Category: 'tools', Format: 'tool_focus', targetToolUrl: '/tools/[slug]'.
 */

import { DiscoveredTopic, ContentFormat, ArticleContentType, GscSeedKeyword } from '../types';
import { findGscSeedByKeyword, TOOL_SEEDS_CATALOG } from './gscSeedCatalog';
import { getVerifiedInternalLinkCatalog } from '../generation/internalLinkCatalog';
import { TOOLS_DATA } from '../../data/toolsData';

/** Compatibility alias for opportunity scorer */
export function scoreTopicOpportunity(
  keyword: string,
  options?: {
    searchTrendSignal?: number;
    trendDirection?: 'rising' | 'stable' | 'breakout';
    gscSeedMatch?: GscSeedKeyword;
  }
): ScoredTopicBreakdown {
  if (isToolKeyword(keyword)) {
    const matchingTool = TOOLS_DATA.find(t => keyword.toLowerCase().includes(t.slug) || keyword.toLowerCase().includes(t.title.toLowerCase())) || TOOLS_DATA[0];
    return scoreToolGuideTopic(matchingTool.slug, keyword, options);
  }
  return scoreTrendingCrochetTopic(keyword, options);
}

/** Checks if a topic was covered in recent history */
export function isDuplicateTopic(keyword: string, recentKeywords: string[]): boolean {
  const norm = keyword.trim().toLowerCase();
  return recentKeywords.some(k => k.trim().toLowerCase() === norm);
}

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

/** Tool indicator words - STRICTLY FORBIDDEN in Trending Crochet Slot 1 */
export const TOOL_DISQUALIFYING_KEYWORDS = [
  'calculator',
  'estimator',
  'converter',
  'generator',
  'tool',
  'counter',
  'dictionary',
  'organizer',
  'timer',
  'pricing chart',
  'price calculator',
  'cost calculator',
  'gauge calculator',
  'yarn calculator',
  'blanket calculator',
  'how much yarn'
];

/** Core positive fiber craft keywords */
const FIBER_CRAFT_INDICATORS = [
  'crochet', 'yarn', 'stitch', 'stitches', 'hook', 'amigurumi', 'granny square',
  'skein', 'yardage', 'gauge', 'swatch', 'blanket', 'afghan', 'tapestry',
  'single crochet', 'double crochet', 'half double', 'slip stitch', 'magic ring',
  'chain stitch', 'wip', 'tension', 'worsted', 'chunky yarn', 'acrylic yarn',
  'pumpkin', 'ghost', 'halloween', 'autumn', 'fall', 'christmas', 'beanie', 'hat',
  'tote', 'bag', 'cardigan', 'sweater', 'leaf', 'flower', 'motif'
];

export interface ScoredTopicBreakdown {
  contentType: ArticleContentType;
  category: 'crochet' | 'tools';
  relevanceScore: number;                     // 0-30
  siteFitScore: number;                       // 0-25
  momentumScore: number;                      // 0-20
  actionabilityScore: number;                 // 0-15
  seasonalityScore: number;                   // 0-10
  totalOpportunityScore: number;              // 0-100
  isFilteredOut: boolean;
  filterReason?: string;
  targetFormat: ContentFormat;
  toolSlug?: string;
  targetToolUrl?: string;
  targetCategoryUrl?: string;
  targetPatternUrls?: string[];
  freshTrendScore?: number;
  recentTrendScore?: number;
  historicalTrendScore?: number;
  combinedTrendScore?: number;
  trendDirection?: 'rising' | 'stable' | 'breakout';
}

/**
 * Calculates current seasonal affinity bonus (0 to 10 points) based on current month.
 */
function calculateSeasonalityScore(keyword: string): number {
  const currentMonth = new Date().getMonth() + 1; // 1 = Jan, 12 = Dec
  const lower = keyword.toLowerCase();

  // Autumn / Winter season (September - February)
  if (currentMonth >= 9 || currentMonth <= 2) {
    if (/halloween|pumpkin|ghost|fall|autumn|christmas|winter|holiday|beanie|hat|scarf|blanket|afghan|cozy/i.test(lower)) {
      return 10;
    }
    if (/flower|tank|summer|beach|market bag/i.test(lower)) {
      return 4;
    }
    return 8;
  }

  // Spring / Summer season (March - August)
  if (currentMonth >= 3 && currentMonth <= 8) {
    if (/flower|floral|spring|summer|cotton|market bag|tote|crop top|tank|baby/i.test(lower)) {
      return 10;
    }
    if (/chunky blanket|wool sweater|heavy winter|snow/i.test(lower)) {
      return 3;
    }
    return 8;
  }

  return 7;
}

/**
 * Checks if a keyword string contains any tool/calculator terms.
 */
export function isToolKeyword(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return TOOL_DISQUALIFYING_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Scores a candidate topic explicitly for SLOT 1: TRENDING CROCHET.
 * Disqualifies any keyword containing tool/calculator words.
 */
export function scoreTrendingCrochetTopic(
  keyword: string,
  options?: {
    searchTrendSignal?: number;
    trendDirection?: 'rising' | 'stable' | 'breakout';
    freshTrendScore?: number;
    recentTrendScore?: number;
    historicalTrendScore?: number;
    combinedTrendScore?: number;
  }
): ScoredTopicBreakdown {
  const normalized = keyword.trim().toLowerCase();

  // 1. General Disqualification
  for (const pattern of DISQUALIFYING_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        contentType: 'trending_crochet',
        category: 'crochet',
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

  // 2. Strict Slot 1 Tool Disqualification
  if (isToolKeyword(normalized)) {
    return {
      contentType: 'trending_crochet',
      category: 'crochet',
      relevanceScore: 0,
      siteFitScore: 0,
      momentumScore: 0,
      actionabilityScore: 0,
      seasonalityScore: 0,
      totalOpportunityScore: 0,
      isFilteredOut: true,
      filterReason: `Disqualified from Slot 1: Contains tool/calculator term. Tools are reserved for Slot 2.`,
      targetFormat: 'guide'
    };
  }

  // 3. Fiber Craft Relevance (0-30 pts)
  let matchesCount = 0;
  for (const indicator of FIBER_CRAFT_INDICATORS) {
    if (normalized.includes(indicator)) {
      matchesCount++;
    }
  }

  if (matchesCount === 0) {
    return {
      contentType: 'trending_crochet',
      category: 'crochet',
      relevanceScore: 0,
      siteFitScore: 0,
      momentumScore: 0,
      actionabilityScore: 0,
      seasonalityScore: 0,
      totalOpportunityScore: 0,
      isFilteredOut: true,
      filterReason: 'No fiber craft or project terminology detected',
      targetFormat: 'guide'
    };
  }

  const relevanceScore = Math.min(30, 18 + matchesCount * 4);

  // 4. Ecosystem & Category Fit (0-25 pts)
  const catalog = getVerifiedInternalLinkCatalog();
  let siteFitScore = 15;
  let targetCategoryUrl = '/categories/tutorials';
  const targetPatternUrls: string[] = [];

  const categories = catalog.filter(c => c.entityType === 'category');
  for (const cat of categories) {
    if (cat.keywords.some(k => normalized.includes(k))) {
      siteFitScore = 25;
      targetCategoryUrl = cat.url;
      break;
    }
  }

  const patterns = catalog.filter(c => c.entityType === 'pattern');
  for (const pat of patterns) {
    if (targetPatternUrls.length >= 2) break;
    if (pat.keywords.some(k => normalized.includes(k))) {
      targetPatternUrls.push(pat.url);
    }
  }

  // 5. Multi-Window Trend Calculation (0-20 pts)
  // Calculate combinedTrendScore = 40% 7-day (fresh) + 35% 30-day (recent) + 25% 90-day (historical)
  let freshScore = options?.freshTrendScore;
  let recentScore = options?.recentTrendScore;
  let historicalScore = options?.historicalTrendScore ?? options?.searchTrendSignal;

  let combinedTrend = options?.combinedTrendScore;
  if (combinedTrend === undefined) {
    if (freshScore !== undefined && recentScore !== undefined && historicalScore !== undefined) {
      combinedTrend = Math.round(freshScore * 0.40 + recentScore * 0.35 + historicalScore * 0.25);
    } else if (historicalScore !== undefined) {
      combinedTrend = historicalScore;
    } else {
      combinedTrend = 0;
    }
  }
  combinedTrend = Math.min(100, Math.max(0, combinedTrend));

  // Determine trend direction strictly using recent/fresh signals (Never classify rising/breakout solely on high 90-day baseline)
  let derivedDirection: 'rising' | 'stable' | 'breakout' = options?.trendDirection || 'stable';
  if (freshScore !== undefined && recentScore !== undefined && historicalScore !== undefined) {
    if (freshScore > 75 && freshScore > historicalScore * 1.5) {
      derivedDirection = 'breakout';
    } else if (freshScore > 35 && (freshScore > historicalScore * 1.25 || recentScore > historicalScore * 1.2)) {
      derivedDirection = 'rising';
    } else {
      derivedDirection = 'stable';
    }
  }

  let momentumScore = 14;
  if (options?.combinedTrendScore !== undefined || options?.searchTrendSignal !== undefined || options?.freshTrendScore !== undefined) {
    momentumScore = Math.round((combinedTrend / 100) * 20);
    if (derivedDirection === 'breakout') {
      momentumScore = Math.min(20, momentumScore + 4);
    } else if (derivedDirection === 'rising') {
      momentumScore = Math.min(20, momentumScore + 2);
    }
  }

  // 6. Actionability / Craft Project Intent (0-15 pts)
  let actionabilityScore = 12;
  if (/tutorial|step by step|how to|instructions/i.test(normalized)) {
    actionabilityScore = 15;
  } else if (/pattern|patterns|free pattern|ideas|project/i.test(normalized)) {
    actionabilityScore = 14;
  } else if (/technique|stitch|stitches|guide/i.test(normalized)) {
    actionabilityScore = 13;
  }

  // 7. Seasonality (0-10 pts)
  const seasonalityScore = calculateSeasonalityScore(normalized);

  const totalOpportunityScore = relevanceScore + siteFitScore + momentumScore + actionabilityScore + seasonalityScore;

  // Format Determination
  let targetFormat: ContentFormat = 'guide';
  if (/tutorial|how to|step by step/i.test(normalized)) {
    targetFormat = 'tutorial';
  } else if (/pattern|patterns|roundup|best|ideas/i.test(normalized)) {
    targetFormat = 'pattern_roundup';
  } else if (/vs|difference|compare/i.test(normalized)) {
    targetFormat = 'explainer_comparison';
  }

  return {
    contentType: 'trending_crochet',
    category: 'crochet',
    relevanceScore,
    siteFitScore,
    momentumScore,
    actionabilityScore,
    seasonalityScore,
    totalOpportunityScore: Math.min(100, Math.max(0, totalOpportunityScore)),
    isFilteredOut: false,
    targetFormat,
    targetCategoryUrl,
    targetPatternUrls: targetPatternUrls.length > 0 ? targetPatternUrls : undefined,
    freshTrendScore: freshScore,
    recentTrendScore: recentScore,
    historicalTrendScore: historicalScore,
    combinedTrendScore: combinedTrend,
    trendDirection: derivedDirection
  };
}

/**
 * Scores a candidate topic explicitly for SLOT 2: TOOL GUIDE.
 * Strictly verifies and binds to a real tool from `TOOLS_DATA`.
 */
export function scoreToolGuideTopic(
  toolSlug: string,
  customKeyword?: string,
  options?: {
    searchTrendSignal?: number;
    trendDirection?: 'rising' | 'stable' | 'breakout';
  }
): ScoredTopicBreakdown {
  const realTool = TOOLS_DATA.find(t => t.slug === toolSlug);
  if (!realTool) {
    return {
      contentType: 'tool_guide',
      category: 'tools',
      relevanceScore: 0,
      siteFitScore: 0,
      momentumScore: 0,
      actionabilityScore: 0,
      seasonalityScore: 0,
      totalOpportunityScore: 0,
      isFilteredOut: true,
      filterReason: `Tool slug "${toolSlug}" does not exist in WeLovePattern TOOLS_DATA catalog`,
      targetFormat: 'tool_focus'
    };
  }

  const toolMapping = TOOL_SEEDS_CATALOG.find(t => t.toolSlug === toolSlug);
  const keyword = customKeyword || toolMapping?.primaryKeyword || `${realTool.title.toLowerCase()} crochet tool`;

  const relevanceScore = 30; // 100% verified real tool
  const siteFitScore = 25;    // Exact match to real site tool
  
  let momentumScore = 16;
  if (options?.searchTrendSignal !== undefined) {
    momentumScore = Math.round((options.searchTrendSignal / 100) * 20);
    if (options.trendDirection === 'breakout') momentumScore = Math.min(20, momentumScore + 4);
  } else if (realTool.isPopular) {
    momentumScore = 19;
  }

  const actionabilityScore = 15; // Direct problem-solving utility
  const seasonalityScore = 8;    // Tools have evergreen baseline utility with high seasonal spikes

  const totalOpportunityScore = relevanceScore + siteFitScore + momentumScore + actionabilityScore + seasonalityScore;

  return {
    contentType: 'tool_guide',
    category: 'tools',
    relevanceScore,
    siteFitScore,
    momentumScore,
    actionabilityScore,
    seasonalityScore,
    totalOpportunityScore: Math.min(100, Math.max(0, totalOpportunityScore)),
    isFilteredOut: false,
    targetFormat: 'tool_focus',
    toolSlug: realTool.slug,
    targetToolUrl: `/tools/${realTool.slug}`,
    targetCategoryUrl: '/categories/tools'
  };
}

/**
 * Legacy compatibility scorer that routes cleanly to Slot 1 or Slot 2 based on keyword intent.
 */
export function scoreDiscoveredTopic(
  keyword: string,
  trendItem?: { trendScore?: number; trendDirection?: 'rising' | 'stable' | 'breakout' }
): DiscoveredTopic {
  const normalized = keyword.trim().toLowerCase();
  const id = `topic_${Buffer.from(normalized).toString('hex').slice(0, 16)}`;

  if (isToolKeyword(normalized)) {
    // Find matching tool
    const matchingSeed = TOOL_SEEDS_CATALOG.find(t => 
      normalized.includes(t.toolSlug) ||
      normalized.includes(t.primaryKeyword) ||
      t.secondaryKeywords.some(sk => normalized.includes(sk))
    );
    const matchingTool = (matchingSeed ? TOOLS_DATA.find(t => t.slug === matchingSeed.toolSlug) : undefined) ||
      TOOLS_DATA.find(t => normalized.includes(t.slug) || normalized.includes(t.title.toLowerCase())) ||
      TOOLS_DATA[0];

    const breakdown = scoreToolGuideTopic(matchingTool.slug, normalized, {
      searchTrendSignal: trendItem?.trendScore,
      trendDirection: trendItem?.trendDirection
    });

    return {
      id,
      keyword: normalized,
      contentType: 'tool_guide',
      category: 'tools',
      source: trendItem ? 'dataforseo_trends' : 'internal_catalog',
      trendScore: trendItem?.trendScore !== undefined ? trendItem.trendScore : 0,
      trendDirection: trendItem?.trendDirection || 'stable',
      opportunityScore: breakdown.totalOpportunityScore,
      targetContentFormat: 'tool_focus',
      toolSlug: breakdown.toolSlug,
      targetToolUrl: breakdown.targetToolUrl,
      targetCategoryUrl: breakdown.targetCategoryUrl,
      discoveredAt: new Date().toISOString(),
      status: breakdown.isFilteredOut ? 'filtered_out' : 'discovered',
      statusReason: breakdown.filterReason,
    };
  } else {
    const breakdown = scoreTrendingCrochetTopic(normalized, {
      searchTrendSignal: trendItem?.trendScore,
      trendDirection: trendItem?.trendDirection
    });

    return {
      id,
      keyword: normalized,
      contentType: 'trending_crochet',
      category: 'crochet',
      source: trendItem ? 'dataforseo_trends' : 'gsc_seed',
      trendScore: trendItem?.trendScore !== undefined ? trendItem.trendScore : 0,
      trendDirection: trendItem?.trendDirection || 'stable',
      opportunityScore: breakdown.totalOpportunityScore,
      targetContentFormat: breakdown.targetFormat,
      targetCategoryUrl: breakdown.targetCategoryUrl,
      targetPatternUrls: breakdown.targetPatternUrls,
      discoveredAt: new Date().toISOString(),
      status: breakdown.isFilteredOut ? 'filtered_out' : 'discovered',
      statusReason: breakdown.filterReason,
    };
  }
}
