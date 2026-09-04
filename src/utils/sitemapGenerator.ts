import { PATTERNS_DATA } from '../data/patternsData';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { TOOLS_DATA } from '../data/toolsData';
import { BLOG_DATA } from '../data/blogData';
import { DEFAULT_SITE_PAGES } from '../data/defaultSitePages';
import { SITE_URL } from '../constants';
import { normalizeSiteOrigin } from './seoRouting';

/**
 * Validates and formats a date to W3C / ISO-8601 YYYY-MM-DD format for XML sitemaps.
 * Returns null if the date cannot be reliably parsed or is invalid.
 */
export function formatSitemapDate(rawDate?: unknown): string | null {
  if (!rawDate) return null;

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed) return null;

    // Fast path: already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = new Date(`${trimmed}T00:00:00Z`);
      if (!isNaN(parsed.getTime())) {
        return trimmed;
      }
    }
  }

  try {
    const parsed = new Date(rawDate as string | number | Date);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export function generateSitemapXml(
  origin: string = SITE_URL, 
  blogPosts?: any[], 
  patternSeoArticles?: any[],
  sitePages?: any[],
  patterns?: any[]
): string {
  const cleanOrigin = normalizeSiteOrigin(origin);
  const today = formatSitemapDate(new Date()) || new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${cleanOrigin}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${cleanOrigin}/patterns`, priority: '0.9', changefreq: 'daily', lastmod: today },
    { loc: `${cleanOrigin}/categories`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${cleanOrigin}/tools`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${cleanOrigin}/blog`, priority: '0.8', changefreq: 'weekly', lastmod: today },
  ];

  const pagesPool = sitePages && Array.isArray(sitePages) ? sitePages : DEFAULT_SITE_PAGES;
  const pageUrls = pagesPool
    .filter(p => !p.isNoIndex)
    .map(p => ({
      loc: `${cleanOrigin}/${p.slug}`,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: formatSitemapDate(p.updatedAt || p.createdAt) || today
    }));

  const categoryUrls = CATEGORIES_DATA.map(c => ({
    loc: `${cleanOrigin}/category/${c.id}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: today
  }));

  const patternsPool = patterns && Array.isArray(patterns) && patterns.length > 0 ? patterns : PATTERNS_DATA;

  const patternUrls = patternsPool.map(p => {
    let rawDate: unknown = today;
    if (patternSeoArticles && Array.isArray(patternSeoArticles)) {
      const art = patternSeoArticles.find(
        a => (a.patternId === p.id || a.patternSlug === p.slug || a.patternId === p.slug) && a.status === 'published'
      );
      if (art && (art.updatedAt || art.createdAt)) {
        rawDate = art.updatedAt || art.createdAt;
      }
    }
    const lastmod = formatSitemapDate(rawDate) || today;
    return {
      loc: `${cleanOrigin}/pattern/${p.slug}`,
      priority: '0.9',
      changefreq: 'weekly',
      lastmod
    };
  });

  const toolUrls = TOOLS_DATA.map(t => ({
    loc: `${cleanOrigin}/tools/${t.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: today
  }));

  const activeBlogPosts = blogPosts && Array.isArray(blogPosts)
    ? blogPosts.filter(b => b.status === 'published')
    : BLOG_DATA;

  const blogUrls = activeBlogPosts.map(b => {
    const rawDate = b.updatedAt || b.date || b.createdAt;
    const lastmod = formatSitemapDate(rawDate) || today;
    return {
      loc: `${cleanOrigin}/blog/${b.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod
    };
  });

  const allUrls = [...staticUrls, ...pageUrls, ...categoryUrls, ...patternUrls, ...toolUrls, ...blogUrls];

  const urlElements = allUrls.map(item => {
    const lastmodTag = item.lastmod ? `\n    <lastmod>${item.lastmod}</lastmod>` : '';
    return `
  <url>
    <loc>${item.loc}</loc>${lastmodTag}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}
