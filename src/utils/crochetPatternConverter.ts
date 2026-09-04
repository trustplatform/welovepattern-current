/**
 * US ↔ UK Crochet Pattern Terminology Converter
 * Pure TypeScript deterministic tokenizer and conversion engine.
 * 
 * Preserves:
 * - Line breaks, tabs, and indentation
 * - Numbers, row/round indicators, stitch counts, repeat counts (e.g., "(sc, inc) x 6")
 * - Punctuation, asterisks, parentheses, brackets, slashes
 * - Case formatting (ALL CAPS, Title Case, lowercase)
 * - Compound stitch abbreviations (e.g., sc2tog, FPdc, hdc3tog)
 * - Safe from chaining collisions (e.g., sc -> dc does NOT become tr in the same run)
 */

export type ConversionDirection = 'us-to-uk' | 'uk-to-us';

export interface ConversionRule {
  /** Regex pattern to match with word boundaries or token boundary */
  pattern: RegExp;
  /** Replacement term in lowercase or standard casing format */
  replacement: string;
  /** Label used for conversion summary reporting */
  fromLabel: string;
  toLabel: string;
}

export interface ConversionResult {
  convertedText: string;
  conversionCounts: Record<string, number>;
  totalConverted: number;
}

export interface TerminologyDetectionResult {
  terminology: 'us' | 'uk' | 'unknown';
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  label: string;
  clues: string[];
  explanation: string;
}

/**
 * Match case of replacement to source matched string:
 * - If source is ALL CAPS (e.g., "SC2TOG") -> "DC2TOG"
 * - If source is Title Case (e.g., "Single Crochet") -> "Double Crochet"
 * - If source starts with Upper (e.g., "Sc") -> "Dc"
 * - If source is Post stitch (e.g., "FPdc") -> "FPtr"
 * - Otherwise lowercase (e.g., "sc") -> "dc"
 */
export function preserveCase(source: string, replacement: string): string {
  if (!source || !replacement) return replacement;

  // Check if source is ALL UPPERCASE (letters only)
  const lettersOnly = source.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase()) {
    return replacement.toUpperCase();
  }

  // Check if source starts with FP / BP prefix (e.g. FPdc, BPhdc)
  if (/^[FB]P[a-z]+/i.test(source) && /^[fb]p/i.test(replacement)) {
    const prefix = source.slice(0, 2); // 'FP' or 'BP' or 'fp'
    const remainder = replacement.slice(2);
    const sourceRemainder = source.slice(2);
    if (sourceRemainder === sourceRemainder.toUpperCase()) {
      return prefix + remainder.toUpperCase();
    } else if (sourceRemainder[0] === sourceRemainder[0]?.toUpperCase()) {
      return prefix + remainder.charAt(0).toUpperCase() + remainder.slice(1).toLowerCase();
    } else {
      return prefix + remainder.toLowerCase();
    }
  }

  // Check if Title Case (e.g. "Double Crochet")
  if (source.includes(' ')) {
    const sourceWords = source.split(' ');
    const isTitle = sourceWords.every(w => w.length > 0 && w[0] === w[0]?.toUpperCase());
    if (isTitle) {
      return replacement
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Check if First Letter Capitalized (e.g., "Dc", "Htr")
  if (source.charAt(0) === source.charAt(0).toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }

  return replacement.toLowerCase();
}

/**
 * US to UK Conversion Rules (ordered from longest phrases to shortest abbreviations)
 */
const US_TO_UK_RULES: ConversionRule[] = [
  // Full phrase stitches
  { pattern: /\bhalf\s+double\s+crochet\b/gi, replacement: 'half treble crochet', fromLabel: 'half double crochet', toLabel: 'half treble crochet' },
  { pattern: /\bdouble\s+treble\s+crochet\b/gi, replacement: 'triple treble crochet', fromLabel: 'double treble crochet', toLabel: 'triple treble crochet' },
  { pattern: /\btriple\s+crochet\b/gi, replacement: 'double treble crochet', fromLabel: 'triple crochet', toLabel: 'double treble crochet' },
  { pattern: /\bsingle\s+crochet\b/gi, replacement: 'double crochet', fromLabel: 'single crochet', toLabel: 'double crochet' },
  { pattern: /\bdouble\s+crochet\b/gi, replacement: 'treble crochet', fromLabel: 'double crochet', toLabel: 'treble crochet' },
  { pattern: /\btreble\s+crochet\b/gi, replacement: 'double treble crochet', fromLabel: 'treble crochet', toLabel: 'double treble crochet' },
  { pattern: /\bhalf\s+double\b/gi, replacement: 'half treble', fromLabel: 'half double', toLabel: 'half treble' },

  // Slip stitch variants
  { pattern: /\bsl\s+st\b/gi, replacement: 'ss', fromLabel: 'sl st', toLabel: 'ss' },
  { pattern: /\bslst\b/gi, replacement: 'ss', fromLabel: 'slst', toLabel: 'ss' },
  { pattern: /\bsl-st\b/gi, replacement: 'ss', fromLabel: 'sl-st', toLabel: 'ss' },

  // Compound 3-together decreases
  { pattern: /\bsc3tog\b/gi, replacement: 'dc3tog', fromLabel: 'sc3tog', toLabel: 'dc3tog' },
  { pattern: /\bhdc3tog\b/gi, replacement: 'htr3tog', fromLabel: 'hdc3tog', toLabel: 'htr3tog' },
  { pattern: /\bdc3tog\b/gi, replacement: 'tr3tog', fromLabel: 'dc3tog', toLabel: 'tr3tog' },
  { pattern: /\btr3tog\b/gi, replacement: 'dtr3tog', fromLabel: 'tr3tog', toLabel: 'dtr3tog' },
  { pattern: /\bdtr3tog\b/gi, replacement: 'trtr3tog', fromLabel: 'dtr3tog', toLabel: 'trtr3tog' },

  // Compound 2-together decreases
  { pattern: /\bsc2tog\b/gi, replacement: 'dc2tog', fromLabel: 'sc2tog', toLabel: 'dc2tog' },
  { pattern: /\bhdc2tog\b/gi, replacement: 'htr2tog', fromLabel: 'hdc2tog', toLabel: 'htr2tog' },
  { pattern: /\bdc2tog\b/gi, replacement: 'tr2tog', fromLabel: 'dc2tog', toLabel: 'tr2tog' },
  { pattern: /\btr2tog\b/gi, replacement: 'dtr2tog', fromLabel: 'tr2tog', toLabel: 'dtr2tog' },
  { pattern: /\bdtr2tog\b/gi, replacement: 'trtr2tog', fromLabel: 'dtr2tog', toLabel: 'trtr2tog' },

  // Front / Back post stitches
  { pattern: /\bFPsc\b/gi, replacement: 'FPdc', fromLabel: 'FPsc', toLabel: 'FPdc' },
  { pattern: /\bBPsc\b/gi, replacement: 'BPdc', fromLabel: 'BPsc', toLabel: 'BPdc' },
  { pattern: /\bFPhdc\b/gi, replacement: 'FPhtr', fromLabel: 'FPhdc', toLabel: 'FPhtr' },
  { pattern: /\bBPhdc\b/gi, replacement: 'BPhtr', fromLabel: 'BPhdc', toLabel: 'BPhtr' },
  { pattern: /\bFPdc\b/gi, replacement: 'FPtr', fromLabel: 'FPdc', toLabel: 'FPtr' },
  { pattern: /\bBPdc\b/gi, replacement: 'BPtr', fromLabel: 'BPdc', toLabel: 'BPtr' },
  { pattern: /\bFPtr\b/gi, replacement: 'FPdtr', fromLabel: 'FPtr', toLabel: 'FPdtr' },
  { pattern: /\bBPtr\b/gi, replacement: 'BPdtr', fromLabel: 'BPtr', toLabel: 'BPdtr' },
  { pattern: /\bFPdtr\b/gi, replacement: 'FPtrtr', fromLabel: 'FPdtr', toLabel: 'FPtrtr' },
  { pattern: /\bBPdtr\b/gi, replacement: 'BPtrtr', fromLabel: 'BPdtr', toLabel: 'BPtrtr' },

  // Base stitch abbreviations (isolated tokens only)
  { pattern: /\bhdc\b/gi, replacement: 'htr', fromLabel: 'hdc', toLabel: 'htr' },
  { pattern: /\bdtr\b/gi, replacement: 'trtr', fromLabel: 'dtr', toLabel: 'trtr' },
  { pattern: /\btr\b/gi, replacement: 'dtr', fromLabel: 'tr', toLabel: 'dtr' },
  { pattern: /\bdc\b/gi, replacement: 'tr', fromLabel: 'dc', toLabel: 'tr' },
  { pattern: /\bsc\b/gi, replacement: 'dc', fromLabel: 'sc', toLabel: 'dc' },

  // Contextual pattern terminology
  { pattern: /\bskip\s+(?=next|\d+|the|st\b|sts\b|stitch\b|stitches\b|ch\b|space\b|sp\b)/gi, replacement: 'miss ', fromLabel: 'skip', toLabel: 'miss' },
  { pattern: /\bsk\s+(?=next|\d+|the|st\b|sts\b|stitch\b|stitches\b|ch\b|space\b|sp\b)/gi, replacement: 'miss ', fromLabel: 'sk', toLabel: 'miss' },
  { pattern: /\bgauge\b(?=\s*:|\s+swatch|\s+is|\s+in\b|\s+of\b)/gi, replacement: 'tension', fromLabel: 'gauge', toLabel: 'tension' }
];

/**
 * UK to US Conversion Rules (ordered from longest phrases to shortest abbreviations)
 */
const UK_TO_US_RULES: ConversionRule[] = [
  // Full phrase stitches
  { pattern: /\bhalf\s+treble\s+crochet\b/gi, replacement: 'half double crochet', fromLabel: 'half treble crochet', toLabel: 'half double crochet' },
  { pattern: /\btriple\s+treble\s+crochet\b/gi, replacement: 'double treble crochet', fromLabel: 'triple treble crochet', toLabel: 'double treble crochet' },
  { pattern: /\bdouble\s+treble\s+crochet\b/gi, replacement: 'treble crochet', fromLabel: 'double treble crochet', toLabel: 'treble crochet' },
  { pattern: /\btreble\s+crochet\b/gi, replacement: 'double crochet', fromLabel: 'treble crochet', toLabel: 'double crochet' },
  { pattern: /\bdouble\s+crochet\b/gi, replacement: 'single crochet', fromLabel: 'double crochet', toLabel: 'single crochet' },
  { pattern: /\bhalf\s+treble\b/gi, replacement: 'half double', fromLabel: 'half treble', toLabel: 'half double' },

  // Slip stitch variants
  { pattern: /\bss\b/gi, replacement: 'sl st', fromLabel: 'ss', toLabel: 'sl st' },

  // Compound 3-together decreases
  { pattern: /\btrtr3tog\b/gi, replacement: 'dtr3tog', fromLabel: 'trtr3tog', toLabel: 'dtr3tog' },
  { pattern: /\bdtr3tog\b/gi, replacement: 'tr3tog', fromLabel: 'dtr3tog', toLabel: 'tr3tog' },
  { pattern: /\btr3tog\b/gi, replacement: 'dc3tog', fromLabel: 'tr3tog', toLabel: 'dc3tog' },
  { pattern: /\bhtr3tog\b/gi, replacement: 'hdc3tog', fromLabel: 'htr3tog', toLabel: 'hdc3tog' },
  { pattern: /\bdc3tog\b/gi, replacement: 'sc3tog', fromLabel: 'dc3tog', toLabel: 'sc3tog' },

  // Compound 2-together decreases
  { pattern: /\btrtr2tog\b/gi, replacement: 'dtr2tog', fromLabel: 'trtr2tog', toLabel: 'dtr2tog' },
  { pattern: /\bdtr2tog\b/gi, replacement: 'tr2tog', fromLabel: 'dtr2tog', toLabel: 'tr2tog' },
  { pattern: /\btr2tog\b/gi, replacement: 'dc2tog', fromLabel: 'tr2tog', toLabel: 'dc2tog' },
  { pattern: /\bhtr2tog\b/gi, replacement: 'hdc2tog', fromLabel: 'htr2tog', toLabel: 'hdc2tog' },
  { pattern: /\bdc2tog\b/gi, replacement: 'sc2tog', fromLabel: 'dc2tog', toLabel: 'sc2tog' },

  // Front / Back post stitches
  { pattern: /\bFPtrtr\b/gi, replacement: 'FPdtr', fromLabel: 'FPtrtr', toLabel: 'FPdtr' },
  { pattern: /\bBPtrtr\b/gi, replacement: 'BPdtr', fromLabel: 'BPtrtr', toLabel: 'BPdtr' },
  { pattern: /\bFPdtr\b/gi, replacement: 'FPtr', fromLabel: 'FPdtr', toLabel: 'FPtr' },
  { pattern: /\bBPdtr\b/gi, replacement: 'BPtr', fromLabel: 'BPdtr', toLabel: 'BPtr' },
  { pattern: /\bFPtr\b/gi, replacement: 'FPdc', fromLabel: 'FPtr', toLabel: 'FPdc' },
  { pattern: /\bBPtr\b/gi, replacement: 'BPdc', fromLabel: 'BPtr', toLabel: 'BPdc' },
  { pattern: /\bFPhtr\b/gi, replacement: 'FPhdc', fromLabel: 'FPhtr', toLabel: 'FPhdc' },
  { pattern: /\bBPhtr\b/gi, replacement: 'BPhdc', fromLabel: 'BPhtr', toLabel: 'BPhdc' },
  { pattern: /\bFPdc\b/gi, replacement: 'FPsc', fromLabel: 'FPdc', toLabel: 'FPsc' },
  { pattern: /\bBPdc\b/gi, replacement: 'BPsc', fromLabel: 'BPdc', toLabel: 'BPsc' },

  // Base stitch abbreviations (isolated tokens only)
  { pattern: /\btrtr\b/gi, replacement: 'dtr', fromLabel: 'trtr', toLabel: 'dtr' },
  { pattern: /\bdtr\b/gi, replacement: 'tr', fromLabel: 'dtr', toLabel: 'tr' },
  { pattern: /\bhtr\b/gi, replacement: 'hdc', fromLabel: 'htr', toLabel: 'hdc' },
  { pattern: /\btr\b/gi, replacement: 'dc', fromLabel: 'tr', toLabel: 'dc' },
  { pattern: /\bdc\b/gi, replacement: 'sc', fromLabel: 'dc', toLabel: 'sc' },

  // Contextual pattern terminology
  { pattern: /\bmiss\s+(?=next|\d+|the|st\b|sts\b|stitch\b|stitches\b|ch\b|space\b|sp\b)/gi, replacement: 'skip ', fromLabel: 'miss', toLabel: 'skip' },
  { pattern: /\btension\b(?=\s*:|\s+swatch|\s+is|\s+in\b|\s+of\b)/gi, replacement: 'gauge', fromLabel: 'tension', toLabel: 'gauge' }
];

/**
 * Executes a collision-safe deterministic conversion on the pattern text.
 * Uses a placeholder token substitution map so earlier replacements cannot be
 * re-substituted by later rules in the same pass.
 */
export function convertPattern(text: string, direction: ConversionDirection): ConversionResult {
  if (!text || typeof text !== 'string') {
    return { convertedText: '', conversionCounts: {}, totalConverted: 0 };
  }

  const rules = direction === 'us-to-uk' ? US_TO_UK_RULES : UK_TO_US_RULES;
  const placeholders: Map<string, string> = new Map();
  const conversionCounts: Record<string, number> = {};
  let totalConverted = 0;
  let placeholderIndex = 0;

  // Clone text for tokenization
  let processed = text;

  // Single-pass replacement using indexed unique placeholders
  for (const rule of rules) {
    processed = processed.replace(rule.pattern, (match) => {
      const key = `__CR_CONV_PH_${placeholderIndex++}__`;
      const convertedValue = preserveCase(match, rule.replacement);
      placeholders.set(key, convertedValue);

      const reportKey = `${rule.fromLabel} → ${rule.toLabel}`;
      conversionCounts[reportKey] = (conversionCounts[reportKey] || 0) + 1;
      totalConverted++;

      return key;
    });
  }

  // Restore placeholders with converted terms
  for (const [placeholder, replacement] of placeholders.entries()) {
    processed = processed.replaceAll(placeholder, replacement);
  }

  return {
    convertedText: processed,
    conversionCounts,
    totalConverted
  };
}

/**
 * Inspects pattern text and detects whether it is likely written in US or UK crochet terminology.
 * Analyzes definitive clues (sc, hdc, gauge vs htr, dtr, tension, miss) and returns explanation.
 */
export function detectPatternTerminology(text: string): TerminologyDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      terminology: 'unknown',
      confidence: 'unknown',
      label: 'No pattern text provided',
      clues: [],
      explanation: 'Paste your crochet pattern to detect its terminology.'
    };
  }

  const clean = text.toLowerCase();

  const usClues: string[] = [];
  const ukClues: string[] = [];

  // Definitive US clues (terms that DO NOT exist in UK crochet)
  if (/\bsc\b|\bsingle\s+crochet\b|\bsc2tog\b|\bsc3tog\b|\bfpsc\b|\bbpsc\b/.test(clean)) {
    usClues.push('Single crochet (sc / sc2tog)');
  }
  if (/\bhdc\b|\bhalf\s+double\b|\bhdc2tog\b|\bhdc3tog\b|\bfphdc\b|\bbphdc\b/.test(clean)) {
    usClues.push('Half double crochet (hdc)');
  }
  if (/\bgauge\s*:|\bgauge\s+swatch|\bgauge\s+is/.test(clean)) {
    usClues.push('Term "gauge"');
  }
  if (/\bskip\s+(?:next|\d+|the|st|sts)/.test(clean)) {
    usClues.push('Term "skip"');
  }

  // Definitive UK clues (terms that DO NOT exist in US crochet or distinct UK indicators)
  if (/\bhtr\b|\bhalf\s+treble\b|\bhtr2tog\b|\bhtr3tog\b|\bfphtr\b|\bbphtr\b/.test(clean)) {
    ukClues.push('Half treble crochet (htr)');
  }
  if (/\btrtr\b|\btriple\s+treble\b|\btrtr2tog\b/.test(clean)) {
    ukClues.push('Triple treble crochet (trtr)');
  }
  if (/\btension\s*:|\btension\s+swatch|\btension\s+is/.test(clean)) {
    ukClues.push('Term "tension"');
  }
  if (/\bmiss\s+(?:next|\d+|the|st|sts)/.test(clean)) {
    ukClues.push('Term "miss" (for skip)');
  }
  if (/\bcast\s+off\b/.test(clean)) {
    ukClues.push('Term "cast off" (for fasten off)');
  }

  // Ambiguous terms check (terms that exist in both but mean different heights)
  const hasDc = /\bdc\b|\bdouble\s+crochet\b|\bdc2tog\b/.test(clean);
  const hasTr = /\btr\b|\btreble\s+crochet\b|\btr2tog\b/.test(clean);
  const hasDtr = /\bdtr\b|\bdouble\s+treble\b/.test(clean);

  // Scoring
  const usScore = usClues.length * 3;
  const ukScore = ukClues.length * 3;

  if (usScore > ukScore && usScore >= 3) {
    const confidence = usScore >= 6 ? 'high' : 'medium';
    return {
      terminology: 'us',
      confidence,
      label: 'Likely US Crochet Terminology',
      clues: usClues,
      explanation: `Detected US-specific indicators: ${usClues.join(', ')}.`
    };
  }

  if (ukScore > usScore && ukScore >= 3) {
    const confidence = ukScore >= 6 ? 'high' : 'medium';
    return {
      terminology: 'uk',
      confidence,
      label: 'Likely UK Crochet Terminology',
      clues: ukClues,
      explanation: `Detected UK-specific indicators: ${ukClues.join(', ')}.`
    };
  }

  // If dc / tr found without sc or htr
  if (hasDc && !usClues.length && !ukClues.length) {
    return {
      terminology: 'unknown',
      confidence: 'low',
      label: 'Ambiguous Pattern (Contains "dc" or "tr")',
      clues: ['dc', 'tr'],
      explanation: 'Contains "dc" or "tr" without unambiguous indicators like "sc" or "htr". Check if the designer mentions US or UK terminology.'
    };
  }

  return {
    terminology: 'unknown',
    confidence: 'unknown',
    label: 'Terminology could not be determined confidently',
    clues: [],
    explanation: 'No clear US (e.g. sc, hdc) or UK (e.g. htr, tension) stitch keywords were detected.'
  };
}
