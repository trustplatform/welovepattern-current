/**
 * SEO Content Engine - Curated Search Opportunities Catalog
 * 
 * STRUCTURED INTO TWO EXPLICIT PRODUCTION SLOTS:
 * 
 * 1. TRENDING_CROCHET_SEEDS (Slot 1: Category: CROCHET):
 *    High-opportunity current search queries for crochet projects, seasonal items,
 *    patterns, tutorials, stitches, and techniques.
 *    STRICT NEGATIVE CONSTRAINT: Zero calculator/tool terms allowed.
 * 
 * 2. TOOL_SEEDS_CATALOG (Slot 2: Category: TOOLS):
 *    Mapped directly to the 19 real interactive tools in `src/data/toolsData.ts`.
 *    Defines the exact maker problem, search intent, and primary query for each tool.
 */

import { GscSeedKeyword } from '../types';
import { TOOLS_DATA } from '../../data/toolsData';

/** High-priority seed queries for Slot 1: TRENDING CROCHET (Zero tool/calculator terms) */
export const TRENDING_CROCHET_SEEDS: GscSeedKeyword[] = [
  // Seasonal & Holiday Crochet (Autumn / Halloween / Fall)
  {
    keyword: 'easy crochet pumpkin pattern free',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'Seasonal high-volume search for beginner-friendly plush ribbed pumpkins.',
  },
  {
    keyword: 'crochet ghost pattern free',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'Viral fall and Halloween crochet plushie search intent.',
  },
  {
    keyword: 'fall crochet projects for beginners',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'High seasonal curation demand for cozy autumn blankets, scarves, and home decor.',
  },
  {
    keyword: 'crochet autumn leaf pattern',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Seasonal motif pattern search for garlands and home decor.',
  },
  {
    keyword: 'crochet halloween granny square',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Trending seasonal granny square variations.',
  },

  // Seasonal & Holiday Crochet (Winter / Christmas / Gift Making)
  {
    keyword: 'crochet christmas tree ornament pattern',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'High holiday seasonal search for handmade holiday tree decor.',
  },
  {
    keyword: 'crochet snowflake pattern easy',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Winter festive decor and gift embellishment search.',
  },
  {
    keyword: 'quick crochet gifts under 1 hour',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'Holiday craft search intent for fast, impressive handmade gifts.',
  },

  // Projects & Patterns (Wearables, Blankets, Accessories)
  {
    keyword: 'classic granny square blanket pattern',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'Timeless high-intent project guide for multi-colored heirloom blankets.',
  },
  {
    keyword: 'how to crochet a chunky ribbed beanie',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'Popular modern cold-weather wearable search.',
  },
  {
    keyword: 'crochet market tote bag pattern',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Durable mesh tote bag tutorial for everyday eco-friendly use.',
  },
  {
    keyword: 'waffle stitch crochet blanket tutorial',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'High-texture cozy blanket technique and sizing guide.',
  },
  {
    keyword: 'crochet bucket hat pattern easy',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Popular stylish beginner wearable project.',
  },

  // Techniques & Stitch Guides
  {
    keyword: 'how to join granny squares seamlessly',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'High-intent problem solver for flat mattress stitch and invisible joins.',
  },
  {
    keyword: 'magic ring crochet tutorial step by step',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'very_high',
    notes: 'Essential foundational technique for circular motifs and amigurumi.',
  },
  {
    keyword: 'invisible decrease crochet amigurumi technique',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Crucial plushie shaping technique to prevent gaps and stuffing leakage.',
  },
  {
    keyword: 'how to block acrylic yarn for crisp stitches',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Steam blocking and wet blocking guide for opening lace and straightening edges.',
  },
  {
    keyword: 'foundation single crochet tutorial no chain',
    targetCategory: 'crochet',
    intent: 'tutorial',
    priority: 'high',
    notes: 'Flexible edge technique avoiding tight foundation chain curling.',
  }
];

/** Dedicated Problem & Question Trend Queries (Crochet challenges, mistakes, fixes, tension, sizing, joining) */
export const CROCHET_PROBLEM_TREND_SEEDS: GscSeedKeyword[] = [
  {
    keyword: 'why is my crochet edge curling up',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'Common beginner tension and foundation chain issue troubleshooting.',
  },
  {
    keyword: 'how to fix uneven crochet edges',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'Fixing accidental stitch dropping, turning chain placement, and row count errors.',
  },
  {
    keyword: 'how to fix tight crochet tension',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Ergonomic hand positioning, yarn feeding, and hook size compensation for tight gauge.',
  },
  {
    keyword: 'how to fix crochet gaps in amigurumi',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Preventing stuffing show-through using yarn under and invisible decrease.',
  },
  {
    keyword: 'how to fix leaning crochet stitches in the round',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Correcting spiral seam diagonal drift in baskets and hats.',
  },
  {
    keyword: 'how to weave in crochet ends so they never unravel',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'very_high',
    notes: 'Secure 3-way direction weaving technique for slippery yarns and garments.',
  },
  {
    keyword: 'why is my crochet circle ruffling or cupping',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Troubleshooting flat circle Pi rate increases for mandalas and hat crowns.',
  },
  {
    keyword: 'how to resize a crochet pattern for different yarn weight',
    targetCategory: 'crochet',
    intent: 'guide',
    priority: 'high',
    notes: 'Adjusting stitch repeats and gauge swatches when substituting yarn.',
  }
];

export interface ToolSeedMapping {
  toolSlug: string;
  toolTitle: string;
  primaryKeyword: string;
  searchIntentProblem: string;
  secondaryKeywords: string[];
}

/** 1:1 mapping of every real WeLovePattern interactive tool to its primary SEO search problem */
export const TOOL_SEEDS_CATALOG: ToolSeedMapping[] = [
  {
    toolSlug: 'gauge-calculator',
    toolTitle: 'Gauge Calculator',
    primaryKeyword: 'crochet gauge calculator',
    searchIntentProblem: 'How to calculate stitch and row adjustments from a gauge swatch so garments fit properly.',
    secondaryKeywords: ['gauge swatch calculator', 'how to calculate crochet gauge', 'swatch gauge calculation', 'crochet gauge conversion']
  },
  {
    toolSlug: 'yarn-calculator',
    toolTitle: 'Yarn Calculator',
    primaryKeyword: 'yarn calculator',
    searchIntentProblem: 'How to estimate total yards/meters and skeins needed before buying yarn for blankets or wearables.',
    secondaryKeywords: ['how much yarn', 'yardage calculator', 'how much yarn do i need', 'yarn estimator', 'skein yardage calculator']
  },
  {
    toolSlug: 'blanket-calculator',
    toolTitle: 'Blanket Calculator',
    primaryKeyword: 'crochet blanket yarn calculator',
    searchIntentProblem: 'Calculating exact yardage, starting chain count, and row dimensions for standard blanket sizes.',
    secondaryKeywords: ['blanket size calculator', 'crochet blanket calculator', 'how much yarn for baby blanket', 'blanket yardage estimator']
  },
  {
    toolSlug: 'granny-square-calculator',
    toolTitle: 'Granny Square Calculator',
    primaryKeyword: 'granny square calculator',
    searchIntentProblem: 'Calculating how many total granny squares are needed to assemble baby, throw, or king-size afghans.',
    secondaryKeywords: ['how many granny squares for a blanket', 'granny square blanket calculator', 'granny square layout chart']
  },
  {
    toolSlug: 'selling-price-calculator',
    toolTitle: 'Selling Price Calculator',
    primaryKeyword: 'crochet price calculator',
    searchIntentProblem: 'How to price handmade crochet items fairly using raw material cost, hourly labor rate, and profit margin.',
    secondaryKeywords: ['crochet pricing chart', 'how to price handmade crochet', 'craft fair price calculator', 'crochet labor cost formula']
  },
  {
    toolSlug: 'row-counter',
    toolTitle: 'Row Counter',
    primaryKeyword: 'online row counter',
    searchIntentProblem: 'Tracking active row repeats and pattern sections without losing count mid-session.',
    secondaryKeywords: ['crochet row counter', 'digital row counter online', 'track crochet rows', 'row counting tool']
  },
  {
    toolSlug: 'stitch-counter',
    toolTitle: 'Stitch Counter',
    primaryKeyword: 'stitch counter online',
    searchIntentProblem: 'Counting individual stitches and complex shaping repeats accurately.',
    secondaryKeywords: ['crochet stitch counter', 'stitch count tracker', 'repeat stitch counter']
  },
  {
    toolSlug: 'us-uk-crochet-pattern-converter',
    toolTitle: 'US ↔ UK Crochet Pattern Converter',
    primaryKeyword: 'us vs uk crochet terms converter',
    searchIntentProblem: 'Translating patterns between American and British terminology without stitch height errors.',
    secondaryKeywords: ['us to uk crochet converter', 'uk to us crochet pattern converter', 'crochet terms translator']
  },
  {
    toolSlug: 'yarn-weight-converter',
    toolTitle: 'Yarn Weight Converter',
    primaryKeyword: 'yarn weight converter',
    searchIntentProblem: 'Standardizing 8-tier CYC yarn weights, wraps per inch (WPI), and finding compatible yarn substitutes.',
    secondaryKeywords: ['yarn weight chart', 'wraps per inch chart', 'yarn category converter', 'yarn weight substitution guide']
  },
  {
    toolSlug: 'hook-size-converter',
    toolTitle: 'Hook Size Converter',
    primaryKeyword: 'crochet hook size chart mm',
    searchIntentProblem: 'Converting metric millimeter hook measurements to US letter sizes and UK vintage numbers.',
    secondaryKeywords: ['crochet hook converter', 'hook size mm to letter', 'metric crochet hook chart']
  },
  {
    toolSlug: 'needle-size-converter',
    toolTitle: 'Needle Size Converter',
    primaryKeyword: 'knitting needle size converter mm to us',
    searchIntentProblem: 'Matching knitting needle metric diameters to US and UK size numbering systems.',
    secondaryKeywords: ['knitting needle chart mm', 'needle size conversion chart', 'metric knitting needle sizes']
  },
  {
    toolSlug: 'border-calculator',
    toolTitle: 'Border Calculator',
    primaryKeyword: 'crochet blanket border calculator',
    searchIntentProblem: 'Determining exact side-edge stitch pick-ups and corner repeats to prevent blanket edging from ruffling.',
    secondaryKeywords: ['crochet edging calculator', 'blanket border stitch calculator', 'how to pick up stitches for border']
  },
  {
    toolSlug: 'yarn-cost-calculator',
    toolTitle: 'Yarn Cost Calculator',
    primaryKeyword: 'yarn cost calculator',
    searchIntentProblem: 'Calculating total material investment per project from skein prices and partial ball usage.',
    secondaryKeywords: ['how to calculate yarn cost', 'cost per yard calculator', 'project material cost calculator']
  },
  {
    toolSlug: 'yarn-substitute-finder',
    toolTitle: 'Yarn Substitute Finder',
    primaryKeyword: 'yarn substitute finder',
    searchIntentProblem: 'Finding alternative yarns with identical gauge, fiber content, and yardage per 100 grams.',
    secondaryKeywords: ['how to substitute yarn', 'yarn replacement finder', 'matching alternative yarns']
  },
  {
    toolSlug: 'pattern-difficulty-checker',
    toolTitle: 'Pattern Difficulty Checker',
    primaryKeyword: 'crochet pattern difficulty checker',
    searchIntentProblem: 'Assessing skill levels (Beginner, Easy, Intermediate, Advanced) based on stitch complexity.',
    secondaryKeywords: ['is this pattern beginner friendly', 'crochet skill level guide', 'crochet pattern rating']
  },
  {
    toolSlug: 'pattern-pdf-organizer',
    toolTitle: 'Pattern PDF Organizer',
    primaryKeyword: 'organize crochet patterns pdf',
    searchIntentProblem: 'Managing and tagging digital PDF craft files for quick offline reference.',
    secondaryKeywords: ['digital pattern organizer', 'how to organize pdf crochet patterns', 'pattern library management']
  },
  {
    toolSlug: 'crochet-timer',
    toolTitle: 'Crochet Timer',
    primaryKeyword: 'crochet project timer',
    searchIntentProblem: 'Logging total stitching time and calculating stitching speed (rows per hour).',
    secondaryKeywords: ['craft time tracker', 'crochet speed calculator', 'how long does it take to crochet a blanket']
  },
  {
    toolSlug: 'pattern-library',
    toolTitle: 'Pattern Library / Collections',
    primaryKeyword: 'crochet pattern library organizer',
    searchIntentProblem: 'Grouping saved patterns into custom seasonal project folders.',
    secondaryKeywords: ['save crochet patterns online', 'organize pattern queue', 'crochet project queue']
  },
  {
    toolSlug: 'abbreviation-dictionary',
    toolTitle: 'Crochet Abbreviation Dictionary',
    primaryKeyword: 'crochet abbreviation dictionary',
    searchIntentProblem: 'Quickly looking up US and UK stitch abbreviations, chart symbols, and terms.',
    secondaryKeywords: ['crochet stitch abbreviations list', 'what does dc mean in crochet', 'crochet terminology glossary']
  }
];

/** Full seed pool for backward compatibility */
export const GSC_SEED_KEYWORDS: GscSeedKeyword[] = [
  ...TRENDING_CROCHET_SEEDS,
  ...TOOL_SEEDS_CATALOG.map(t => ({
    keyword: t.primaryKeyword,
    targetToolSlug: t.toolSlug,
    targetToolTitle: t.toolTitle,
    targetCategory: 'tools',
    intent: 'calculator' as const,
    priority: 'very_high' as const,
    notes: t.searchIntentProblem
  }))
];

/** Returns all curated seed keywords */
export function getGscSeedKeywords(): GscSeedKeyword[] {
  return [...GSC_SEED_KEYWORDS, ...CROCHET_PROBLEM_TREND_SEEDS];
}

/** Returns dedicated problem trend seeds */
export function getCrochetProblemSeeds(): GscSeedKeyword[] {
  return [...CROCHET_PROBLEM_TREND_SEEDS];
}

/** Looks up seed keyword by exact match or normalized lowercase match */
export function findGscSeedByKeyword(keyword: string): GscSeedKeyword | undefined {
  const normalized = keyword.trim().toLowerCase();
  return GSC_SEED_KEYWORDS.find(item => item.keyword.toLowerCase() === normalized);
}

/** Filters seed keywords that target a specific tool slug */
export function getSeedsForTool(toolSlug: string): GscSeedKeyword[] {
  return GSC_SEED_KEYWORDS.filter(item => item.targetToolSlug === toolSlug);
}

/** Returns the complete tool seeds catalog */
export function getToolSeedsCatalog(): ToolSeedMapping[] {
  return [...TOOL_SEEDS_CATALOG];
}

/** Returns trending crochet seeds (guaranteed zero tool words) */
export function getTrendingCrochetSeeds(): GscSeedKeyword[] {
  return [...TRENDING_CROCHET_SEEDS];
}
