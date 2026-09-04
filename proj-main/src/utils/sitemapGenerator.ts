import { PATTERNS_DATA } from '../data/patternsData';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { TOOLS_DATA } from '../data/toolsData';
import { BLOG_DATA } from '../data/blogData';
import { DEFAULT_SITE_PAGES } from '../data/defaultSitePages';

export function generateSitemapXml(
  origin: string = 'https://welovepattern.com', 
  blogPosts?: any[], 
  patternSeoArticles?: any[],
  sitePages?: any[]
): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

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
      lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : today
    }));

  const categoryUrls = CATEGORIES_DATA.map(c => ({
    loc: `${cleanOrigin}/category/${c.id}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: today
  }));

  const patternUrls = PATTERNS_DATA.map(p => {
    let lastmod = today;
    if (patternSeoArticles && Array.isArray(patternSeoArticles)) {
      const art = patternSeoArticles.find(
        a => (a.patternId === p.id || a.patternSlug === p.slug || a.patternId === p.slug) && a.status === 'published'
      );
      if (art && art.updatedAt) {
        lastmod = art.updatedAt.split('T')[0];
      }
    }
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

  const blogUrls = activeBlogPosts.map(b => ({
    loc: `${cleanOrigin}/blog/${b.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: b.date || today
  }));

  const allUrls = [...staticUrls, ...pageUrls, ...categoryUrls, ...patternUrls, ...toolUrls, ...blogUrls];

  const urlElements = allUrls.map(item => `
  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}
