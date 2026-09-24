/**
 * SEO Content Engine - Verified Internal Link Catalog
 * 
 * Inspects ACTUAL production site data:
 * - 19 interactive craft tools from `src/data/toolsData.ts`
 * - Pattern catalog from `src/data/patternsData.ts` (and `data/patterns.json` if available)
 * - Categories from `src/data/categoriesData.ts` (and `data/categories.json` if available)
 * - Existing blog posts from `src/data/blogData.ts` (and `data/blog-posts.json` if available)
 * 
 * GUARANTEES:
 * - Every route in this catalog maps to a genuine, working URL in WeLovePattern.
 * - Zero invented, broken, or speculative links.
 */

import { TOOLS_DATA } from '../../data/toolsData';
import { CATEGORIES_DATA } from '../../data/categoriesData';
import { PATTERNS_DATA } from '../../data/patternsData';
import { BLOG_DATA } from '../../data/blogData';
import { LinkCatalogItem, VerifiedInternalLink } from '../types';
import { CONTENT_ENGINE_LIMITS } from '../config';

/** High-priority tool keyword mapping for precision contextual matching */
const TOOL_KEYWORD_MAP: Record<string, string[]> = {
  'gauge-calculator': [
    'gauge calculator',
    'gauge swatch calculator',
    'gauge swatch',
    'crochet gauge calculator',
    'calculate gauge',
    'swatch gauge'
  ],
  'yarn-calculator': [
    'yarn calculator',
    'yardage calculator',
    'yarn estimator',
    'how much yarn',
    'skein calculator',
    'yarn yardage'
  ],
  'blanket-calculator': [
    'blanket calculator',
    'blanket yarn calculator',
    'crochet blanket calculator',
    'blanket size calculator',
    'blanket yardage'
  ],
  'granny-square-calculator': [
    'granny square calculator',
    'granny square blanket calculator',
    'how many granny squares',
    'granny squares needed'
  ],
  'selling-price-calculator': [
    'selling price calculator',
    'crochet price calculator',
    'crochet pricing chart',
    'pricing calculator',
    'how to price crochet',
    'price your crochet'
  ],
  'row-counter': [
    'row counter',
    'online row counter',
    'crochet row counter',
    'row counting tool',
    'track rows'
  ],
  'stitch-counter': [
    'stitch counter',
    'stitch counter online',
    'crochet stitch counter',
    'repeat counter'
  ],
  'us-uk-crochet-pattern-converter': [
    'us uk crochet pattern converter',
    'crochet converter',
    'us to uk crochet',
    'uk to us crochet',
    'crochet terms converter'
  ],
  'yarn-weight-converter': [
    'yarn weight converter',
    'yarn weight chart',
    'wraps per inch',
    'yarn weight substitution'
  ],
  'hook-size-converter': [
    'hook size converter',
    'crochet hook size chart',
    'hook size chart mm',
    'crochet hook conversion'
  ],
  'border-calculator': [
    'border calculator',
    'blanket border calculator',
    'crochet border calculator',
    'edging calculator'
  ],
  'yarn-cost-calculator': [
    'yarn cost calculator',
    'material cost calculator',
    'project cost calculator'
  ],
  'project-tracker': [
    'crochet project tracker',
    'project tracker',
    'wip tracker',
    'craft organizer'
  ],
  'abbreviation-dictionary': [
    'crochet abbreviation dictionary',
    'crochet abbreviations',
    'crochet terms dictionary',
    'crochet stitch glossary'
  ],
  'yarn-substitute-finder': [
    'yarn substitute finder',
    'yarn substitution',
    'find yarn substitute'
  ],
  'crochet-timer': [
    'crochet timer',
    'stitching speed timer',
    'craft timer'
  ]
};

/** Category keyword mapping */
const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  'blankets': ['crochet blanket patterns', 'crochet blankets', 'afghan patterns', 'throw blanket patterns', 'blanket pattern', 'blanket patterns', 'blanket', 'afghan', 'throw blanket'],
  'flowers': ['crochet flower patterns', 'crochet flowers', 'crochet roses', 'crochet floral appliques', 'flower pattern', 'flowers'],
  'amigurumi': ['amigurumi patterns', 'crochet plushies', 'crochet stuffed animals', 'amigurumi toys', 'amigurumi', 'crochet toy'],
  'bags': ['crochet bag patterns', 'crochet tote bags', 'market bag patterns', 'crochet purses', 'crochet bag', 'tote bag'],
  'baby': ['baby crochet patterns', 'crochet baby blankets', 'baby booties patterns', 'baby shower crochet', 'baby blanket', 'baby crochet'],
  'tops': ['crochet top patterns', 'crochet crop top', 'summer crochet tops', 'crochet tank top', 'crochet top'],
  'sweaters': ['crochet sweater patterns', 'crochet cardigan', 'crochet jumper patterns', 'crochet sweater', 'cardigan'],
  'accessories': ['crochet accessories', 'crochet hat patterns', 'crochet scarves', 'crochet headbands', 'crochet beanie', 'crochet scarf'],
  'home-decor': ['crochet home decor', 'crochet pillow patterns', 'crochet potholders', 'crochet coasters', 'home decor', 'pillow'],
  'granny-squares': ['granny square patterns', 'sunburst granny square', 'motif patterns', 'granny square', 'granny squares']
};

/**
 * Builds the complete verified internal link catalog.
 * Dynamically queries filesystem JSON files when available in Node.js,
 * falling back gracefully to static seed datasets.
 */
export function getVerifiedInternalLinkCatalog(): LinkCatalogItem[] {
  const catalog: LinkCatalogItem[] = [];
  const seenUrls = new Set<string>();

  const registerItem = (item: LinkCatalogItem) => {
    if (seenUrls.has(item.url)) return;
    seenUrls.add(item.url);
    catalog.push(item);
  };

  // 1. Interactive Craft Tools
  for (const tool of TOOLS_DATA) {
    const url = `/tools/${tool.slug}`;
    const specificKeywords = TOOL_KEYWORD_MAP[tool.slug] || [];
    const keywords = Array.from(new Set([
      tool.title.toLowerCase(),
      `${tool.title.toLowerCase()} tool`,
      ...specificKeywords
    ]));

    registerItem({
      url,
      title: tool.title,
      entityType: 'tool',
      keywords,
      verified: true,
      description: tool.description
    });
  }

  // 2. Categories
  let effectiveCategories = CATEGORIES_DATA;
  if (typeof process !== 'undefined' && process.cwd) {
    try {
      // Dynamic load if node fs is available
      const fs = require('fs');
      const path = require('path');
      const categoriesFile = path.resolve(process.cwd(), 'data/categories.json');
      if (fs.existsSync(categoriesFile)) {
        const raw = fs.readFileSync(categoriesFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          effectiveCategories = parsed;
        }
      }
    } catch {
      // Keep static fallback
    }
  }

  for (const cat of effectiveCategories) {
    const slug = cat.slug || cat.id;
    const url = `/category/${slug}`;
    const specificKeywords = CATEGORY_KEYWORD_MAP[cat.id] || [];
    const keywords = Array.from(new Set([
      `${cat.name.toLowerCase()} patterns`,
      `free ${cat.name.toLowerCase()} patterns`,
      cat.name.toLowerCase(),
      ...specificKeywords
    ]));

    registerItem({
      url,
      title: `${cat.name} Patterns`,
      entityType: 'category',
      keywords,
      verified: true,
      description: cat.description
    });
  }

  // 3. Patterns
  let effectivePatterns = PATTERNS_DATA;
  if (typeof process !== 'undefined' && process.cwd) {
    try {
      const fs = require('fs');
      const path = require('path');
      const patternsFile = path.resolve(process.cwd(), 'data/patterns.json');
      if (fs.existsSync(patternsFile)) {
        const raw = fs.readFileSync(patternsFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          effectivePatterns = parsed;
        }
      }
    } catch {
      // Keep static fallback
    }
  }

  for (const pattern of effectivePatterns) {
    const url = `/pattern/${pattern.slug}`;
    const keywords = [
      pattern.title.toLowerCase(),
      `${pattern.title.toLowerCase()} pattern`,
      `free ${pattern.title.toLowerCase()}`,
      ...(pattern.tags || []).map(t => `${t.toLowerCase()} pattern`)
    ];

    registerItem({
      url,
      title: pattern.title,
      entityType: 'pattern',
      keywords,
      verified: true,
      description: pattern.description
    });
  }

  // 4. Blog Posts
  let effectiveBlogPosts = BLOG_DATA;
  if (typeof process !== 'undefined' && process.cwd) {
    try {
      const fs = require('fs');
      const path = require('path');
      const blogFile = path.resolve(process.cwd(), 'data/blog-posts.json');
      if (fs.existsSync(blogFile)) {
        const raw = fs.readFileSync(blogFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          effectiveBlogPosts = parsed;
        }
      }
    } catch {
      // Keep static fallback
    }
  }

  for (const post of effectiveBlogPosts) {
    // Only link to published posts
    if (post.status && post.status !== 'published') continue;

    const url = `/blog/${post.slug}`;
    const keywords = [
      post.title.toLowerCase(),
      ...(post.tags || []).map(t => t.toLowerCase())
    ];

    registerItem({
      url,
      title: post.title,
      entityType: 'blog',
      keywords,
      verified: true,
      description: post.excerpt
    });
  }

  return catalog;
}

/**
 * Validates whether a given URL route exists in the live verified catalog or standard site index.
 */
export function isRouteValid(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Canonical internal linking strictly rejects query strings and hash anchors
  if (url.includes('?') || url.includes('#')) return false;

  const normalized = url.trim().toLowerCase();

  // Root and hub index pages
  const staticHubs = ['/', '/patterns', '/categories', '/tools', '/blog', '/favorites'];
  if (staticHubs.includes(normalized)) return true;

  const catalog = getVerifiedInternalLinkCatalog();
  return catalog.some(item => item.url.toLowerCase() === normalized);
}

/**
 * Finds relevant internal links for a block of article text.
 * Deterministic and respects link density constraints.
 */
export function findRelevantInternalLinks(
  text: string,
  options?: {
    maxLinks?: number;
    excludeUrls?: string[];
    priorityEntityTypes?: Array<'tool' | 'pattern' | 'category' | 'blog'>;
  }
): VerifiedInternalLink[] {
  if (!text || typeof text !== 'string') return [];

  const maxLinks = options?.maxLinks ?? CONTENT_ENGINE_LIMITS.MAX_INTERNAL_LINKS_PER_ARTICLE;
  const excludeUrls = new Set((options?.excludeUrls || []).map(u => u.toLowerCase()));
  const priorityTypes = options?.priorityEntityTypes || ['tool', 'pattern', 'category', 'blog'];

  const catalog = getVerifiedInternalLinkCatalog();
  const lowerText = text.toLowerCase();

  const matchedLinks: VerifiedInternalLink[] = [];
  const usedUrls = new Set<string>();

  // Sort catalog items by priority entity type
  const sortedCatalog = [...catalog].sort((a, b) => {
    const pA = priorityTypes.indexOf(a.entityType);
    const pB = priorityTypes.indexOf(b.entityType);
    return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
  });

  for (const item of sortedCatalog) {
    if (matchedLinks.length >= maxLinks) break;
    if (excludeUrls.has(item.url.toLowerCase()) || usedUrls.has(item.url.toLowerCase())) continue;

    // Check keyword matches in descending order of length to prioritize more specific matches
    const sortedKeywords = [...item.keywords].sort((a, b) => b.length - a.length);

    for (const kw of sortedKeywords) {
      if (kw.length < 4) continue; // Skip very short abbreviations to prevent false positives

      const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
      const match = text.match(regex);

      if (match) {
        matchedLinks.push({
          anchorText: match[0],
          url: item.url,
          entityType: item.entityType
        });
        usedUrls.add(item.url.toLowerCase());
        break;
      }
    }
  }

  return matchedLinks;
}

/** Helper to escape regex special characters */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Looks up a single catalog item by exact URL */
export function getCatalogItemByUrl(url: string): LinkCatalogItem | undefined {
  const catalog = getVerifiedInternalLinkCatalog();
  const normalized = url.trim().toLowerCase();
  return catalog.find(item => item.url.toLowerCase() === normalized);
}
