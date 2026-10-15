/**
 * SEO Content Engine - Dynamic Pinterest Board Selector
 * 
 * Provides intelligent, automatic Pinterest board selection based on article category and content.
 * 
 * HIERARCHY:
 * 1. Exact category-to-board mapping:
 *    - 'tools' articles: prefer boards related to crochet tools, calculators, stitch counters, yarn calculators, crochet resources.
 *    - 'crochet' articles: prefer boards related to crochet projects, crochet patterns, tutorials, crochet inspiration.
 * 2. Best semantic match between article topic and available board names.
 * 3. Closest relevant board from the connected account.
 * 4. A configured, verified default Pinterest board if no suitable category-specific board is found.
 * 
 * CRITICAL SAFETY RULES:
 * - Real numeric Pinterest board IDs only (e.g. /^\d{8,25}$/).
 * - Internal mock/placeholder IDs (e.g. 'board_tools', 'board_crochet', 'test_sandbox_fallback_board')
 *   MUST NEVER be sent to the Pinterest API.
 * - Board selection failure MUST NEVER fail or block article publication.
 * - Articles remain published on the website regardless of Pinterest board availability.
 * - Pins with unresolved boards remain in a retryable state with clear diagnostic logs.
 */

import { NormalizedPinterestBoard, fetchPinterestBoards } from '../../pinterest/pinterestApi';
import { DiscoveredTopic } from '../types';

/**
 * Validates whether a board ID string is a genuine numeric Pinterest board ID.
 * Pinterest API v5 board IDs are numeric strings (e.g. 18-19 digits).
 */
export function isRealNumericPinterestBoardId(boardId?: string | null): boolean {
  if (!boardId || typeof boardId !== 'string') return false;
  const trimmed = boardId.trim();
  // Reject placeholder prefixes or non-numeric tokens
  if (trimmed.startsWith('board_') || trimmed.includes('sandbox') || trimmed.includes('placeholder')) {
    return false;
  }
  return /^\d{8,25}$/.test(trimmed);
}

/**
 * Checks if a board ID is an internal placeholder.
 */
export function isPlaceholderBoardId(boardId?: string | null): boolean {
  if (!boardId || typeof boardId !== 'string') return true;
  return !isRealNumericPinterestBoardId(boardId);
}

export interface DynamicBoardSelectionResult {
  success: boolean;
  board?: NormalizedPinterestBoard;
  matchType: 'exact_category' | 'semantic' | 'closest_relevant' | 'verified_fallback' | 'none';
  confidenceScore: number;
  reason: string;
}

// Targeted regex patterns for 'tools' boards
export const TOOLS_BOARD_PATTERNS = [
  /\b(?:tool|tools|calculator|calculators|row counter|stitch counter|yarn calculator|gauge calculator|blanket calculator|border calculator|estimator|conversion|converter|resource|resources|cheat sheet|utility)\b/i,
];

// Targeted regex patterns for 'crochet' project/pattern boards
export const CROCHET_PROJECT_PATTERNS = [
  /\b(?:crochet pattern|crochet patterns|crochet project|crochet projects|crochet tutorial|crochet tutorials|crochet inspiration|crochet stitches|amigurumi|afghan|blanket|granny square|crochet craft|diy crochet)\b/i,
];

/**
 * Scores a candidate board against an article topic and category.
 */
export function scoreBoardRelevance(
  board: NormalizedPinterestBoard,
  topic: DiscoveredTopic | { keyword: string; [k: string]: any },
  category: string
): number {
  const boardName = (board.name || '').toLowerCase();
  const boardDesc = (board.description || '').toLowerCase();
  const kw = (topic?.keyword || '').toLowerCase();
  const isTool = category === 'tools' || Boolean((topic as any)?.toolSlug);

  if (isTool) {
    // 1. Exact tools board match
    const hasToolInName = TOOLS_BOARD_PATTERNS.some(p => p.test(boardName));
    if (hasToolInName) return 95;

    const hasToolInDesc = TOOLS_BOARD_PATTERNS.some(p => p.test(boardDesc));
    if (hasToolInDesc) return 85;

    // Reject unrelated project boards for tool topics
    const isUnrelatedProjectBoard = /\b(?:accessories|bags|clothing|sweater|wearable|amigurumi|toys|dolls|flowers|baby)\b/i.test(boardName);
    if (isUnrelatedProjectBoard) return 0;

    // General craft anchor
    if (/\b(?:crochet|yarn|craft|handmade)\b/i.test(boardName)) return 30;

    return 0;
  } else {
    // Crochet project/pattern/tutorial topic
    // Reject pure calculator/tools boards for crochet project topics
    const isPureToolsBoard = TOOLS_BOARD_PATTERNS.some(p => p.test(boardName));
    if (isPureToolsBoard) return 0;

    // Specific keyword match in board name (e.g. "granny square", "blanket", "beanie")
    const words = kw.split(/\s+/).filter(w => w.length > 3 && !['easy', 'free', 'pattern', 'crochet', 'best', 'your', 'with'].includes(w));
    const hasSpecificKeyword = words.some(w => boardName.includes(w));
    if (hasSpecificKeyword) return 92;

    // Pattern / Project / Tutorial boards
    const hasPatternInName = CROCHET_PROJECT_PATTERNS.some(p => p.test(boardName));
    if (hasPatternInName) return 90;

    const hasPatternInDesc = CROCHET_PROJECT_PATTERNS.some(p => p.test(boardDesc));
    if (hasPatternInDesc) return 80;

    // General crochet board
    if (/\b(?:crochet|yarn|craft|diy|handmade)\b/i.test(boardName)) return 65;

    return 0;
  }
}

/**
 * Intelligent, automatic Pinterest board selection following the 4-tier hierarchy:
 * 1. Exact category-to-board mapping.
 * 2. Best semantic match between article topic and available board names.
 * 3. Closest relevant board from the connected account.
 * 4. A configured, verified default Pinterest board.
 * 
 * Never returns or approves placeholder IDs like 'board_tools'.
 */
export function selectBestPinterestBoard(params: {
  topic: DiscoveredTopic | { keyword: string; [k: string]: any };
  category: 'tools' | 'crochet' | string;
  availableBoards: NormalizedPinterestBoard[];
  fallbackBoard?: { id: string; name: string };
  allowMockIdsInTest?: boolean;
}): DynamicBoardSelectionResult {
  const { topic, category, availableBoards, fallbackBoard, allowMockIdsInTest } = params;

  // Filter available boards to those with valid IDs (numeric in production, or mock if allowed in test)
  const validCandidateBoards = (availableBoards || []).filter(b => {
    if (!b || !b.id || !b.name) return false;
    if (allowMockIdsInTest) return true;
    return isRealNumericPinterestBoardId(b.id);
  });

  const isToolsCategory = category === 'tools' || Boolean((topic as any)?.toolSlug);

  // -----------------------------------------------------------------
  // LEVEL 1: Exact Category-to-Board Mapping
  // -----------------------------------------------------------------
  if (isToolsCategory) {
    const exactToolBoards = validCandidateBoards
      .filter(b => TOOLS_BOARD_PATTERNS.some(p => p.test(b.name)))
      .sort((a, b) => scoreBoardRelevance(b, topic, category) - scoreBoardRelevance(a, topic, category));

    if (exactToolBoards.length > 0) {
      const bestToolBoard = exactToolBoards[0];
      return {
        success: true,
        board: bestToolBoard,
        matchType: 'exact_category',
        confidenceScore: 95,
        reason: `Exact category match: Selected tools board "${bestToolBoard.name}" (ID: ${bestToolBoard.id}) for tools article.`,
      };
    }
  } else {
    // Crochet project/pattern/tutorial category
    const exactCrochetBoards = validCandidateBoards
      .filter(b => CROCHET_PROJECT_PATTERNS.some(p => p.test(b.name)) && !TOOLS_BOARD_PATTERNS.some(p => p.test(b.name)))
      .sort((a, b) => scoreBoardRelevance(b, topic, category) - scoreBoardRelevance(a, topic, category));

    if (exactCrochetBoards.length > 0) {
      const bestCrochetBoard = exactCrochetBoards[0];
      return {
        success: true,
        board: bestCrochetBoard,
        matchType: 'exact_category',
        confidenceScore: 95,
        reason: `Exact category match: Selected crochet board "${bestCrochetBoard.name}" (ID: ${bestCrochetBoard.id}) for crochet article.`,
      };
    }
  }

  // -----------------------------------------------------------------
  // LEVEL 2: Best Semantic Match between Article Topic and Available Boards
  // -----------------------------------------------------------------
  const scoredBoards = validCandidateBoards.map(b => ({
    board: b,
    score: scoreBoardRelevance(b, topic, category),
  })).sort((a, b) => b.score - a.score);

  const bestSemantic = scoredBoards[0];
  if (bestSemantic && bestSemantic.score >= 70) {
    return {
      success: true,
      board: bestSemantic.board,
      matchType: 'semantic',
      confidenceScore: bestSemantic.score,
      reason: `Semantic match (${bestSemantic.score}/100): Selected board "${bestSemantic.board.name}" (ID: ${bestSemantic.board.id}) for topic "${topic.keyword}".`,
    };
  }

  // -----------------------------------------------------------------
  // LEVEL 3: Closest Relevant Board from Connected Account
  // -----------------------------------------------------------------
  // Look for any general crochet or craft board in the user's account
  const closestRelevant = validCandidateBoards.find(b => {
    const name = b.name.toLowerCase();
    if (isToolsCategory) {
      // For tools, accept general crochet/resources, avoid specific project boards if possible
      return /\b(?:crochet|resources|craft|yarn)\b/i.test(name);
    }
    return /\b(?:crochet|yarn|craft|handmade|diy)\b/i.test(name) && !TOOLS_BOARD_PATTERNS.some(p => p.test(name));
  });

  if (closestRelevant) {
    return {
      success: true,
      board: closestRelevant,
      matchType: 'closest_relevant',
      confidenceScore: 65,
      reason: `Closest relevant board from connected account: Selected "${closestRelevant.name}" (ID: ${closestRelevant.id}).`,
    };
  }

  // -----------------------------------------------------------------
  // LEVEL 4: Configured Verified Default Pinterest Board
  // -----------------------------------------------------------------
  if (fallbackBoard?.id && (allowMockIdsInTest || isRealNumericPinterestBoardId(fallbackBoard.id))) {
    return {
      success: true,
      board: {
        id: fallbackBoard.id,
        name: fallbackBoard.name || 'Verified Default Board',
      },
      matchType: 'verified_fallback',
      confidenceScore: 60,
      reason: `Verified default fallback: Using configured board "${fallbackBoard.name}" (ID: ${fallbackBoard.id}).`,
    };
  }

  // -----------------------------------------------------------------
  // FAILURE TO RESOLVE: Retain in retryable state without publishing placeholder
  // -----------------------------------------------------------------
  return {
    success: false,
    matchType: 'none',
    confidenceScore: 0,
    reason: `No suitable Pinterest board found in connected account for category "${category}" (topic: "${topic.keyword}").`,
  };
}

// -----------------------------------------------------------------
// SAFE BOARD DISCOVERY & CACHING
// -----------------------------------------------------------------

interface BoardCache {
  boards: NormalizedPinterestBoard[];
  cachedAt: number;
}

let memoryBoardCache: BoardCache | null = null;
let mockBoardCatalog: NormalizedPinterestBoard[] | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache TTL

/**
 * Sets mock Pinterest boards for offline testing without calling external APIs.
 */
export function setMockPinterestBoards(boards: NormalizedPinterestBoard[] | null): void {
  mockBoardCatalog = boards;
}

/**
 * Retrieves Pinterest boards with memory caching to avoid excessive API requests.
 * Offline-safe: does not call external APIs if mock boards are provided or in tests.
 */
export async function getConnectedPinterestBoards(options?: {
  forceRefresh?: boolean;
  mockBoards?: NormalizedPinterestBoard[];
}): Promise<NormalizedPinterestBoard[]> {
  if (options?.mockBoards) {
    return options.mockBoards;
  }
  if (mockBoardCatalog !== null) {
    return mockBoardCatalog;
  }

  const now = Date.now();
  if (!options?.forceRefresh && memoryBoardCache && (now - memoryBoardCache.cachedAt < CACHE_TTL_MS)) {
    return memoryBoardCache.boards;
  }

  try {
    const result = await fetchPinterestBoards();
    if (result.success && Array.isArray(result.boards)) {
      memoryBoardCache = {
        boards: result.boards,
        cachedAt: now,
      };
      return result.boards;
    }
  } catch (err: any) {
    console.warn('[PinterestBoardSelector] Failed to fetch connected boards:', err?.message || err);
  }

  return memoryBoardCache?.boards || [];
}

/**
 * Resets the in-memory board cache (used for tests or when account is reconnected).
 */
export function clearPinterestBoardCache(): void {
  memoryBoardCache = null;
  mockBoardCatalog = null;
}
