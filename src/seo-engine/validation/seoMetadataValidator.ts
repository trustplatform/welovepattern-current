/**
 * SEO Content Engine - Intent-Aware SEO Metadata Validator
 * 
 * Enforces search-intent alignment, natural editorial phrasing, and SERP snippet quality.
 * 
 * CORE PRINCIPLES:
 * 1. Exact keyword inclusion is a SIGNAL, not an unconditional requirement.
 * 2. Rewards natural, intent-aligned language over robotic exact-match token stuffing.
 * 3. Supports craft synonyms (e.g. yarn ↔ yardage, blanket ↔ afghan, calculator ↔ estimator).
 * 4. Recognizes awkward phrasing where natural reformulations better serve the maker.
 * 5. Prohibits sensationalist clickbait while ensuring compelling value propositions.
 * 6. Hard SERP bounds: Title 25–70 chars (sweet spot 45–65), Meta 70–165 chars (sweet spot 120–155).
 */

import { DiscoveredTopic } from '../types';

export type SearchIntentType = 
  | 'tool_query'
  | 'tutorial_query'
  | 'informational_query'
  | 'seasonal_query'
  | 'pattern_roundup'
  | 'commercial_intent';

export interface SeoMetadataValidationResult {
  isValid: boolean;
  titleValid: boolean;
  metaValid: boolean;
  intentAlignmentScore: number;             // 0-100
  detectedIntent: SearchIntentType;
  errors: string[];
  warnings: string[];
  notes: string[];
}

const CLICKBAIT_STOPWORDS = [
  'shocking',
  'unbelievable',
  'mind-blowing',
  'insane',
  'you won\'t believe',
  'secret trick that experts hate',
  'miracle hack',
  'guaranteed #1'
];

/** Semantic craft synonym graph for intent matching */
const CRAFT_SYNONYMS: Record<string, string[]> = {
  calculator: ['calculator', 'estimator', 'estimate', 'calculate', 'how much', 'how many', 'yardage math', 'sizing chart'],
  yarn: ['yarn', 'yardage', 'skein', 'skeins', 'balls', 'meters', 'yards', 'fiber', 'wool'],
  blanket: ['blanket', 'afghan', 'throw', 'lapghan', 'bedspread', 'coverlet'],
  hook: ['hook', 'hooks', 'hook size', 'metric hook', 'mm'],
  pricing: ['pricing', 'price', 'selling price', 'cost', 'charge', 'how to price', 'selling'],
  gauge: ['gauge', 'tension', 'swatch', 'gauge swatch', 'stitch count', 'row count'],
  granny: ['granny square', 'granny squares', 'motif', 'motifs'],
  tutorial: ['tutorial', 'how to', 'step by step', 'guide', 'instructions', 'learn', 'beginner'],
  pattern: ['pattern', 'patterns', 'free pattern', 'roundup', 'collection', 'designs'],
};

/**
 * Detects the dominant search intent from the keyword and target format.
 */
export function detectSearchIntent(keyword: string, targetFormat?: string): SearchIntentType {
  const kw = keyword.toLowerCase();

  if (/calculator|converter|chart|estimate|how much|how many|pricing|cost/i.test(kw) || targetFormat === 'tool_focus') {
    return 'tool_query';
  }
  if (/tutorial|how to|step by step|beginner|instructions|technique|method/i.test(kw) || targetFormat === 'tutorial') {
    return 'tutorial_query';
  }
  if (/christmas|winter|summer|halloween|autumn|fall|spring|holiday|seasonal/i.test(kw)) {
    return 'seasonal_query';
  }
  if (/pattern|patterns|ideas|roundup|best|designs|free pattern/i.test(kw) || targetFormat === 'pattern_roundup') {
    return 'pattern_roundup';
  }
  if (/buy|price|sell|cost|where to/i.test(kw)) {
    return 'commercial_intent';
  }

  return 'informational_query';
}

/**
 * Validates SEO Title and Meta Description with intent-awareness.
 */
export function validateSeoMetadata(
  title: string,
  metaDescription: string,
  topic: DiscoveredTopic
): SeoMetadataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  let titleValid = true;
  let metaValid = true;

  const cleanTitle = (title || '').trim();
  const cleanMeta = (metaDescription || '').trim();
  const titleLower = cleanTitle.toLowerCase();
  const metaLower = cleanMeta.toLowerCase();
  const kwLower = topic.keyword.toLowerCase();

  const detectedIntent = detectSearchIntent(topic.keyword, topic.targetContentFormat);

  // 1. TITLE LENGTH CHECKS
  if (!cleanTitle || cleanTitle.length < 25) {
    titleValid = false;
    errors.push(`SEO Title is too short (${cleanTitle.length} chars, minimum 25 chars required).`);
  } else if (cleanTitle.length > 70) {
    titleValid = false;
    errors.push(`SEO Title exceeds SERP cutoff limit (${cleanTitle.length} chars, maximum 70 chars allowed).`);
  } else if (cleanTitle.length > 65) {
    warnings.push(`SEO Title is slightly long (${cleanTitle.length} chars, optimal SERP display is 45-60 chars).`);
  } else {
    notes.push(`SEO Title length (${cleanTitle.length} chars) is well-optimized.`);
  }

  // 2. TITLE CLICKBAIT CHECKS
  for (const stopword of CLICKBAIT_STOPWORDS) {
    if (titleLower.includes(stopword)) {
      titleValid = false;
      errors.push(`SEO Title contains prohibited clickbait phrase: "${stopword}".`);
    }
  }

  // 3. INTENT & CONCEPTUAL ALIGNMENT EVALUATION
  let intentScore = 0;

  // Direct exact match
  if (titleLower.includes(kwLower)) {
    intentScore += 50;
    notes.push(`SEO Title contains exact query string: "${topic.keyword}".`);
  } else {
    // Check conceptual term coverage using synonym graph
    const rawTokens = kwLower.split(/\s+/).filter(w => !['for', 'the', 'a', 'an', 'in', 'to', 'of', 'and', 'do', 'i', 'how', 'much', 'is', 'your'].includes(w));
    let matchedConcepts = 0;

    for (const token of rawTokens) {
      // Direct token match
      if (titleLower.includes(token)) {
        matchedConcepts++;
        continue;
      }

      // Check synonyms
      let synonymMatched = false;
      for (const [concept, syns] of Object.entries(CRAFT_SYNONYMS)) {
        if (syns.includes(token)) {
          if (syns.some(s => titleLower.includes(s))) {
            synonymMatched = true;
            matchedConcepts++;
            notes.push(`SEO Title uses natural synonym for "${token}" (${concept} concept).`);
            break;
          }
        }
      }
    }

    const coverageRatio = rawTokens.length > 0 ? (matchedConcepts / rawTokens.length) : 1;
    if (coverageRatio >= 0.7) {
      intentScore += 45;
      notes.push(`SEO Title naturally covers ${Math.round(coverageRatio * 100)}% of query concepts without mechanical stuffing.`);
    } else if (coverageRatio >= 0.4) {
      intentScore += 25;
      warnings.push(`SEO Title has partial query coverage (${Math.round(coverageRatio * 100)}%).`);
    } else {
      titleValid = false;
      errors.push(`SEO Title fails intent alignment: misses key search concepts from query "${topic.keyword}".`);
    }
  }

  // Intent-specific title elements
  if (detectedIntent === 'tool_query') {
    if (/calculator|estimator|chart|calculate|how much|formula/i.test(titleLower)) {
      intentScore += 25;
      notes.push('SEO Title explicitly features tool value proposition.');
    } else {
      warnings.push('SEO Title could emphasize interactive calculator/tool benefits.');
    }
  } else if (detectedIntent === 'tutorial_query') {
    if (/tutorial|how to|step by step|guide|beginner|learn/i.test(titleLower)) {
      intentScore += 25;
      notes.push('SEO Title clearly signals step-by-step instructional tutorial.');
    }
  } else if (detectedIntent === 'seasonal_query') {
    if (/winter|summer|fall|spring|holiday|christmas|halloween/i.test(titleLower) || /cozy|warm/i.test(titleLower)) {
      intentScore += 25;
      notes.push('SEO Title aligns with seasonal search context.');
    }
  } else {
    intentScore += 20;
  }

  // 4. META DESCRIPTION LENGTH CHECKS
  if (!cleanMeta || cleanMeta.length < 70) {
    metaValid = false;
    errors.push(`Meta Description is too brief (${cleanMeta.length} chars, minimum 70 chars required).`);
  } else if (cleanMeta.length > 165) {
    metaValid = false;
    errors.push(`Meta Description exceeds snippet truncation limit (${cleanMeta.length} chars, maximum 165 chars allowed).`);
  } else if (cleanMeta.length < 115) {
    warnings.push(`Meta Description could be more informative (${cleanMeta.length} chars, optimal 120-155 chars).`);
  } else {
    notes.push(`Meta Description length (${cleanMeta.length} chars) is optimal.`);
  }

  // 5. META DESCRIPTION INTENT & VALUE PROPOSITION
  if (/lorem ipsum|todo|insert description|draft/i.test(cleanMeta)) {
    metaValid = false;
    errors.push('Meta Description contains placeholder text.');
  }

  // Check if meta description includes actionable solution / value proposition
  if (/calculate|discover|learn|find|guide|chart|step|free|tips|easy|size/i.test(metaLower)) {
    intentScore += 25;
    notes.push('Meta Description provides clear maker action prompt.');
  }

  const finalIntentScore = Math.min(100, intentScore);

  return {
    isValid: titleValid && metaValid && errors.length === 0,
    titleValid,
    metaValid,
    intentAlignmentScore: finalIntentScore,
    detectedIntent,
    errors,
    warnings,
    notes,
  };
}
