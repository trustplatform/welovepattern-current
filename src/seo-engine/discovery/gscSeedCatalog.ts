/**
 * SEO Content Engine - Manually Curated Search Console Seed Catalog
 * 
 * NOTE: These are NOT live Search Console API calls or invented metrics.
 * They represent verified high-value search opportunities identified through historical
 * manual analysis of WeLovePattern Search Console data and core site tools.
 * 
 * This catalog acts as the high-priority seed pool for topic scoring and internal tool linking.
 */

import { GscSeedKeyword } from '../types';

export const GSC_SEED_KEYWORDS: GscSeedKeyword[] = [
  {
    keyword: 'gauge swatch calculator',
    targetToolSlug: 'gauge-calculator',
    targetToolTitle: 'Gauge Calculator',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'High intent maker query for comparing swatch measurements against pattern gauge.',
  },
  {
    keyword: 'crochet gauge calculator',
    targetToolSlug: 'gauge-calculator',
    targetToolTitle: 'Gauge Calculator',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Core tool keyword. Directly maps to /tools/gauge-calculator.',
  },
  {
    keyword: 'yarn calculator',
    targetToolSlug: 'yarn-calculator',
    targetToolTitle: 'Yarn Calculator',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Top tier yardage & skein estimation search.',
  },
  {
    keyword: 'crochet blanket yarn calculator',
    targetToolSlug: 'blanket-calculator',
    targetToolTitle: 'Blanket Calculator',
    targetCategory: 'blankets',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Crucial high-intent commercial & maker search combining blanket size with yarn yardage.',
  },
  {
    keyword: 'granny square calculator',
    targetToolSlug: 'granny-square-calculator',
    targetToolTitle: 'Granny Square Calculator',
    targetCategory: 'blankets',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Calculates total motifs needed for baby, throw, and twin blanket layouts.',
  },
  {
    keyword: 'crochet pricing chart',
    targetToolSlug: 'selling-price-calculator',
    targetToolTitle: 'Selling Price Calculator',
    targetCategory: 'tools',
    intent: 'chart',
    priority: 'very_high',
    notes: 'Makers seeking formula for calculating fair market craft pricing.',
  },
  {
    keyword: 'crochet price calculator',
    targetToolSlug: 'selling-price-calculator',
    targetToolTitle: 'Selling Price Calculator',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Direct search query linking to labor cost and material markup calculations.',
  },
  {
    keyword: 'online row counter',
    targetToolSlug: 'row-counter',
    targetToolTitle: 'Row Counter',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Interactive utility search. Links directly to offline-ready interactive row counter.',
  },
  {
    keyword: 'stitch counter online',
    targetToolSlug: 'stitch-counter',
    targetToolTitle: 'Stitch Counter',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'high',
    notes: 'Repeats and shaping count tracker query.',
  },
  {
    keyword: 'us vs uk crochet terms converter',
    targetToolSlug: 'us-uk-crochet-pattern-converter',
    targetToolTitle: 'US ↔ UK Crochet Pattern Converter',
    targetCategory: 'tools',
    intent: 'calculator',
    priority: 'very_high',
    notes: 'Frequent beginner and vintage pattern frustration query. Maps to terminology converter.',
  },
  {
    keyword: 'crochet hook size chart mm',
    targetToolSlug: 'hook-size-converter',
    targetToolTitle: 'Hook Size Converter',
    targetCategory: 'tools',
    intent: 'chart',
    priority: 'high',
    notes: 'Metric to US letter size converter query.',
  },
  {
    keyword: 'yarn weight converter',
    targetToolSlug: 'yarn-weight-converter',
    targetToolTitle: 'Yarn Weight Converter',
    targetCategory: 'tools',
    intent: 'chart',
    priority: 'high',
    notes: 'Standard 8-tier CYC yarn weight chart query (Lace to Jumbo, WPI).',
  },
  {
    keyword: 'crochet blanket border calculator',
    targetToolSlug: 'border-calculator',
    targetToolTitle: 'Border Calculator',
    targetCategory: 'blankets',
    intent: 'calculator',
    priority: 'high',
    notes: 'Solving ruffling and pulling on blanket edging.',
  },
  {
    keyword: 'crochet project tracker',
    targetToolSlug: 'project-tracker',
    targetToolTitle: 'Project Tracker',
    targetCategory: 'tools',
    intent: 'guide',
    priority: 'high',
    notes: 'WIP management and hook/yarn logging search.',
  },
  {
    keyword: 'crochet abbreviation dictionary',
    targetToolSlug: 'abbreviation-dictionary',
    targetToolTitle: 'Crochet Abbreviation Dictionary',
    targetCategory: 'tools',
    intent: 'guide',
    priority: 'high',
    notes: 'Comprehensive stitch abbreviation lookup query.',
  }
];

/** Returns all curated seed keywords */
export function getGscSeedKeywords(): GscSeedKeyword[] {
  return [...GSC_SEED_KEYWORDS];
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
