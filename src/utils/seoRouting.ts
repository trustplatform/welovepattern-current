import { PATTERNS_DATA } from '../data/patternsData';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { TOOLS_DATA } from '../data/toolsData';
import { BLOG_DATA } from '../data/blogData';
import { DEFAULT_SITE_PAGES } from '../data/defaultSitePages';
import { SITE_URL, DEFAULT_OG_IMAGE } from '../constants';

export { SITE_URL };

/**
 * Normalizes any origin string to ensure production URLs are strictly https://welovepattern.com.
 * Production canonical URLs, structured schemas, and OpenGraph URLs MUST always use SITE_URL.
 */
export function normalizeSiteOrigin(_origin?: string): string {
  return SITE_URL;
}

export interface RouteState {
  view: string;
  patternSlug?: string;
  categoryParam?: string;
  toolParam?: string;
  blogParam?: string;
  pageSlug?: string;
  isNotFound?: boolean;
}

export function parsePathname(
  pathname: string, 
  customBlogPosts?: any[], 
  customCategories?: any[],
  customSitePages?: any[],
  customPatterns?: any[]
): RouteState {
  let path = (pathname || '/').split('?')[0].split('#')[0];
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  if (path === '' || path === '/') {
    return { view: 'home' };
  }
  if (path === '/patterns') {
    return { view: 'patterns' };
  }
  if (path.startsWith('/pattern/')) {
    const slug = decodeURIComponent(path.replace('/pattern/', ''));
    const patternsPool = customPatterns && Array.isArray(customPatterns) && customPatterns.length > 0 ? customPatterns : PATTERNS_DATA;
    const exists = patternsPool.some(p => p.slug === slug);
    if (!exists) {
      return { view: 'not-found', isNotFound: true };
    }
    return { view: 'pattern-detail', patternSlug: slug };
  }
  if (path === '/categories') {
    return { view: 'categories' };
  }
  if (path.startsWith('/category/')) {
    const catSlug = decodeURIComponent(path.replace('/category/', ''));
    const categoriesPool = customCategories && Array.isArray(customCategories) && customCategories.length > 0 ? customCategories : CATEGORIES_DATA;
    const exists = categoriesPool.some(c => c.id === catSlug || c.slug === catSlug);
    if (!exists) {
      return { view: 'not-found', isNotFound: true };
    }
    return { view: 'patterns', categoryParam: catSlug };
  }
  if (path === '/tools') {
    return { view: 'tools' };
  }
  if (path.startsWith('/tools/')) {
    const toolSlug = decodeURIComponent(path.replace('/tools/', ''));
    const exists = TOOLS_DATA.some(t => t.slug === toolSlug);
    if (!exists) {
      return { view: 'not-found', isNotFound: true };
    }
    return { view: 'tools', toolParam: toolSlug };
  }
  if (path === '/blog') {
    return { view: 'blog' };
  }
  if (path.startsWith('/blog/')) {
    const blogSlug = decodeURIComponent(path.replace('/blog/', ''));
    const postsPool = customBlogPosts && Array.isArray(customBlogPosts) ? customBlogPosts : BLOG_DATA;
    const exists = postsPool.some(b => b.slug === blogSlug && b.status === 'published');
    if (!exists) {
      return { view: 'not-found', isNotFound: true };
    }
    return { view: 'blog', blogParam: blogSlug };
  }
  if (path === '/favorites') {
    return { view: 'favorites' };
  }
  if (path === '/profile') {
    return { view: 'profile' };
  }
  if (path === '/admin55') {
    return { view: 'admin' };
  }

  // Footer & Legal Site Pages
  if (path === '/privacy-policy' || path === '/privacy') {
    return { view: 'page', pageSlug: 'privacy-policy' };
  }
  if (path === '/terms-of-service' || path === '/terms') {
    return { view: 'page', pageSlug: 'terms-of-service' };
  }
  if (path === '/sitemap' || path === '/sitemap-and-schema') {
    return { view: 'page', pageSlug: 'sitemap' };
  }

  // Custom pages check
  const sitePagesPool = customSitePages && Array.isArray(customSitePages) ? customSitePages : DEFAULT_SITE_PAGES;
  const pageMatch = sitePagesPool.find((p: any) => `/${p.slug}` === path || `/${p.id}` === path);
  if (pageMatch) {
    return { view: 'page', pageSlug: pageMatch.slug || pageMatch.id };
  }

  return { view: 'not-found', isNotFound: true };
}

export function getPathnameForView(view: string, param?: string): string {
  if (view === 'home') return '/';
  if (view === 'patterns') {
    if (param) return `/category/${param}`;
    return '/patterns';
  }
  if (view === 'pattern-detail') {
    if (param) return `/pattern/${param}`;
    return '/patterns';
  }
  if (view === 'categories') {
    if (param) return `/category/${param}`;
    return '/categories';
  }
  if (view === 'tools') {
    if (param) return `/tools/${param}`;
    return '/tools';
  }
  if (view === 'blog') {
    if (param) return `/blog/${param}`;
    return '/blog';
  }
  if (view === 'favorites') return '/favorites';
  if (view === 'profile') return '/profile';
  if (view === 'admin') return '/admin55';
  if (view === 'page') {
    if (param === 'privacy-policy' || param === 'privacy') return '/privacy-policy';
    if (param === 'terms-of-service' || param === 'terms') return '/terms-of-service';
    if (param === 'sitemap' || param === 'sitemap-and-schema') return '/sitemap';
    if (param) return `/${param}`;
    return '/privacy-policy';
  }
  return '/';
}

function escapeAttr(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function generateSeoHead(
  pathname: string, 
  origin: string = SITE_URL, 
  customBlogPosts?: any[], 
  customCategories?: any[],
  customPatternSeoArticles?: any[],
  customSitePages?: any[],
  customPatterns?: any[]
): string {
  const route = parsePathname(pathname, customBlogPosts, customCategories, customSitePages, customPatterns);
  const cleanOrigin = normalizeSiteOrigin(origin);

  let title = 'WeLovePattern - Free Crochet Patterns & Tools';
  let description = 'Explore 100% free crochet patterns, 19+ interactive craft calculators, row counters, yarn converters, and step-by-step guides for makers of all ages.';
  let keywords = 'free crochet patterns, crochet calculators, row counter, yarn weight converter, amigurumi patterns, granny square pattern';
  let canonicalUrl = `${cleanOrigin}${pathname.split('?')[0]}`;
  let imageUrl = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80';
  let ogType = 'website';
  let isNoIndex = false;
  let jsonLdSchemas: any[] = [];

  if (route.isNotFound || route.view === 'not-found') {
    title = '404 Page Not Found | WeLovePattern';
    description = 'The page or craft tool you requested could not be found on WeLovePattern.';
    isNoIndex = true;
    canonicalUrl = `${cleanOrigin}${pathname.split('?')[0]}`;
  } else if (route.view === 'page' && route.pageSlug) {
    const pagesPool = customSitePages && Array.isArray(customSitePages) ? customSitePages : DEFAULT_SITE_PAGES;
    const page = pagesPool.find((p: any) => p.slug === route.pageSlug || p.id === route.pageSlug) || DEFAULT_SITE_PAGES[0];
    
    title = page.seoTitle || `${page.title} | WeLovePattern`;
    description = page.seoDescription || `Read ${page.title} on WeLovePattern. 100% free crochet patterns, tools, and guides.`;
    canonicalUrl = page.canonicalUrl || `${cleanOrigin}/${page.slug}`;
    isNoIndex = Boolean(page.isNoIndex);

    // Breadcrumbs schema
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
        { '@type': 'ListItem', 'position': 2, 'name': page.title, 'item': canonicalUrl }
      ]
    });

    // WebPage schema
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': page.title,
      'description': description,
      'url': canonicalUrl,
      'publisher': {
        '@type': 'Organization',
        'name': 'WeLovePattern',
        'url': cleanOrigin
      }
    });
  } else if (route.view === 'pattern-detail' && route.patternSlug) {
    const patternsPool = customPatterns && Array.isArray(customPatterns) && customPatterns.length > 0 ? customPatterns : PATTERNS_DATA;
    const pattern = patternsPool.find(p => p.slug === route.patternSlug) || patternsPool[0] || PATTERNS_DATA[0];
    title = `${pattern.title} - Free Crochet Pattern | WeLovePattern`;
    description = pattern.seoMeta?.metaDescription || pattern.subtitle || pattern.description;
    keywords = pattern.tags ? pattern.tags.join(', ') : keywords;
    imageUrl = pattern.image;
    canonicalUrl = `${cleanOrigin}/pattern/${pattern.slug}`;
    ogType = 'article';

    // Check if custom published SEO article exists for this pattern
    if (customPatternSeoArticles && Array.isArray(customPatternSeoArticles)) {
      const seoArticle = customPatternSeoArticles.find(
        (a: any) => (a.patternId === pattern.id || a.patternSlug === pattern.slug || a.patternId === pattern.slug) && a.status === 'published'
      );
      if (seoArticle) {
        if (seoArticle.seoTitle && seoArticle.seoTitle.trim()) {
          title = `${seoArticle.seoTitle.trim()} | WeLovePattern`;
        }
        if (seoArticle.seoDescription && seoArticle.seoDescription.trim()) {
          description = seoArticle.seoDescription.trim();
        }
        if (seoArticle.keywords && seoArticle.keywords.trim()) {
          keywords = `${pattern.tags ? pattern.tags.join(', ') : ''}, ${seoArticle.keywords.trim()}`;
        }
        if (seoArticle.canonicalUrl && seoArticle.canonicalUrl.trim()) {
          canonicalUrl = seoArticle.canonicalUrl.trim();
        }
        if (seoArticle.featuredImage && seoArticle.featuredImage.trim()) {
          imageUrl = seoArticle.featuredImage.trim();
        }
      }
    }

    // BreadcrumbList schema
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Patterns', 'item': `${cleanOrigin}/patterns` },
        { '@type': 'ListItem', 'position': 3, 'name': pattern.category, 'item': `${cleanOrigin}/category/${pattern.category}` },
        { '@type': 'ListItem', 'position': 4, 'name': pattern.title, 'item': `${cleanOrigin}/pattern/${pattern.slug}` }
      ]
    });

    // HowTo / CreativeWork schema
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': pattern.title,
      'description': pattern.description,
      'image': pattern.image,
      'totalTime': `PT${pattern.estimatedTimeHours || 4}H`,
      'estimatedCost': {
        '@type': 'MonetaryAmount',
        'currency': 'USD',
        'value': '0'
      },
      'supply': (pattern.materials || []).map(m => ({ '@type': 'HowToSupply', 'name': m })),
      'tool': [
        { '@type': 'HowToTool', 'name': `Hook Size: ${pattern.hookSize}` },
        { '@type': 'HowToTool', 'name': `Yarn Weight: ${pattern.yarnWeight}` }
      ],
      'step': (pattern.steps || []).map((s, idx) => ({
        '@type': 'HowToStep',
        'position': idx + 1,
        'name': s.rowNumber,
        'text': s.instruction
      })),
      'author': {
        '@type': 'Organization',
        'name': 'WeLovePattern',
        'url': cleanOrigin
      }
    });
  } else if (route.view === 'patterns' && route.categoryParam) {
    const category = CATEGORIES_DATA.find(c => c.id === route.categoryParam);
    const catName = category ? category.name : route.categoryParam;
    title = `Free ${catName} Crochet Patterns - Step-by-Step Charts & Guides | WeLovePattern`;
    description = category ? `Explore free ${category.name.toLowerCase()} crochet patterns. ${category.description}` : `Browse free ${catName} crochet patterns with row instructions and materials list.`;
    imageUrl = category ? category.image : imageUrl;
    canonicalUrl = `${cleanOrigin}/category/${route.categoryParam}`;

    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Categories', 'item': `${cleanOrigin}/categories` },
        { '@type': 'ListItem', 'position': 3, 'name': catName, 'item': `${cleanOrigin}/category/${route.categoryParam}` }
      ]
    });
  } else if (route.view === 'patterns') {
    title = 'Free Crochet Patterns Directory - Blankets, Amigurumi & Toys | WeLovePattern';
    description = 'Browse hundreds of 100% free crochet patterns with step-by-step instructions, hook size guidelines, worsted yarn requirements, and PDF downloads.';
    canonicalUrl = `${cleanOrigin}/patterns`;
  } else if (route.view === 'categories') {
    title = 'Crochet Pattern Categories - Blankets, Amigurumi, Flowers & Bags | WeLovePattern';
    description = 'Explore 13+ crochet categories including blankets, amigurumi plushies, granny squares, baby wearables, home decor, and everlasting flowers.';
    canonicalUrl = `${cleanOrigin}/categories`;
  } else if (route.view === 'tools') {
    const TOOL_SEO_MAP: Record<string, { title: string; desc: string; keywords: string }> = {
      'row-counter': {
        title: 'Crochet Row Counter Online - Offline Counter with Audio & Haptics | WeLovePattern',
        desc: 'Free online crochet & knitting row counter with audio chimes, haptic feedback, and section logs. 100% offline-ready PWA for mobile & desktop.',
        keywords: 'crochet row counter, knitting row counter online, row counter app, digital stitch counter, offline row counter'
      },
      'stitch-counter': {
        title: 'Multi-Section Stitch Counter for Crochet & Knitting | WeLovePattern',
        desc: 'Track multiple stitch sections, repeats, sleeve increases, and pattern motifs simultaneously with our free multi-section stitch counter tool.',
        keywords: 'stitch counter, multi section stitch counter, crochet stitch counter, pattern repeat counter, knitting stitch tracker'
      },
      'project-tracker': {
        title: 'Crochet Project Tracker & WIP Organizer | WeLovePattern',
        desc: 'Organize your works in progress (WIPs), track hook sizes, yarn stash, completion percentages, and photo logs with our free crochet project tracker.',
        keywords: 'crochet project tracker, wip organizer, crochet journal, track knitting projects, yarn stash organizer'
      },
      'gauge-calculator': {
        title: 'Crochet Gauge Swatch Calculator & Stitch Adjuster | WeLovePattern',
        desc: 'Calculate exact stitch and row adjustments by comparing your swatch gauge to the pattern target. Free crochet & knitting gauge calculator.',
        keywords: 'crochet gauge calculator, gauge swatch calculator, knitting gauge calculator, stitch count adjustment, gauge converter'
      },
      'yarn-calculator': {
        title: 'Crochet Yarn Calculator - Estimate Yardage & Skeins Needed | WeLovePattern',
        desc: 'Calculate total yards, meters, and skeins needed for blankets, sweaters, amigurumi, beanies, and shawls based on yarn weight and dimensions.',
        keywords: 'crochet yarn calculator, yarn yardage calculator, how much yarn do i need, yarn skein calculator, blanket yarn estimator'
      },
      'us-uk-crochet-pattern-converter': {
        title: 'US ↔ UK Crochet Pattern Converter – Free Online Tool | WeLovePattern',
        desc: 'Convert crochet patterns between US and UK terms in both directions (US → UK and UK → US). Preserves stitch counts, numbers, and pattern formatting.',
        keywords: 'crochet pattern converter, us to uk crochet converter, uk to us crochet pattern converter, british vs us crochet terms, american vs uk crochet stitches, us vs uk crochet terms'
      },
      'yarn-weight-converter': {
        title: 'Yarn Weight Converter & Standard CYC Chart (0-7) | WeLovePattern',
        desc: 'Interactive yarn weight chart (Lace to Jumbo) with WPI (Wraps Per Inch), ply equivalents, metric gauge, and recommended crochet hook sizes.',
        keywords: 'yarn weight converter, yarn weight chart, wraps per inch wpi, yarn ply conversion, lace to bulky yarn converter'
      },
      'hook-size-converter': {
        title: 'Crochet Hook Size Converter - Metric mm to US Letter & UK | WeLovePattern',
        desc: 'Instant conversion between metric millimeter (mm) hook sizes, US letter sizes (B-1 to T), UK steel numbers, and Japanese sizes.',
        keywords: 'crochet hook size converter, 5mm hook in us size, metric to us crochet hook, uk crochet hook conversion chart, hook size chart'
      },
      'needle-size-converter': {
        title: 'Knitting Needle Size Converter - Metric mm, US & UK Chart | WeLovePattern',
        desc: 'Convert knitting needle sizes between metric millimeters (mm), US numbers (000 to 50), and UK/Canadian vintage gauge standards.',
        keywords: 'knitting needle size converter, needle conversion chart, metric to us knitting needle, circular needle size chart'
      },
      'granny-square-calculator': {
        title: 'Granny Square Calculator - Blanket Size & Square Layout | WeLovePattern',
        desc: 'Calculate how many granny squares you need for any blanket size (Baby to King) and estimate assembly layout and joining border yardage.',
        keywords: 'granny square calculator, how many granny squares for a blanket, granny square blanket layout, crochet square estimator'
      },
      'blanket-calculator': {
        title: 'Crochet Blanket Size Calculator - Chains, Rows & Dimensions | WeLovePattern',
        desc: 'Calculate starting chains, total rows, and yarn requirements for standard blanket mattress sizes (Baby, Lapghan, Throw, Twin, Queen, King).',
        keywords: 'crochet blanket calculator, blanket size chart crochet, starting chain for blanket, crochet afghan dimensions calculator'
      },
      'border-calculator': {
        title: 'Crochet Border Calculator - Edge Stitches & Corner Repeats | WeLovePattern',
        desc: 'Calculate side edge stitch pick-ups and corner repeat multiples for perfectly flat crochet blanket borders without ruffling or puckering.',
        keywords: 'crochet border calculator, blanket border stitch count, corner stitches crochet, blanket edging calculator'
      },
      'yarn-cost-calculator': {
        title: 'Yarn Cost Calculator - Raw Material Investment per Project | WeLovePattern',
        desc: 'Calculate the exact yarn material cost for any craft project based on skein price, total weight used, partial skeins, and sales tax.',
        keywords: 'yarn cost calculator, crochet material cost, craft project cost calculator, calculate yarn cost'
      },
      'selling-price-calculator': {
        title: 'Crochet Selling Price Calculator for Handmade Business | WeLovePattern',
        desc: 'Calculate fair retail and wholesale selling prices for handmade crochet and knitting. Includes material cost, hourly labor rate, and profit margin.',
        keywords: 'crochet pricing calculator, handmade selling price calculator, how to price crochet items, craft business pricing formula, amigurumi price calculator'
      },
      'yarn-substitute-finder': {
        title: 'Yarn Substitute Finder & Alternative Yarn Matcher | WeLovePattern',
        desc: 'Find compatible yarn substitutes matching fiber content, weight category, and gauge. Calculate replacement yardage when yarns are discontinued.',
        keywords: 'yarn substitute finder, discontinued yarn replacement, yarn substitution tool, yarn alternative matcher, substitute yarn for pattern'
      },
      'pattern-difficulty-checker': {
        title: 'Crochet Pattern Difficulty Level Checker (Skill Assessment) | WeLovePattern',
        desc: 'Assess any crochet pattern\'s skill level (Beginner, Easy, Intermediate, Advanced) based on stitch complexity, shaping, and colorwork.',
        keywords: 'crochet pattern difficulty checker, skill level quiz crochet, beginner vs intermediate crochet, pattern rating tool'
      },
      'pattern-pdf-organizer': {
        title: 'Pattern PDF Organizer & Stash Manager | WeLovePattern',
        desc: 'Upload, tag, search, and organize your favorite downloadable PDF crochet and knitting patterns in one searchable, offline-ready library.',
        keywords: 'crochet pdf organizer, pattern stash manager, digital pattern organizer, pdf crochet library'
      },
      'crochet-timer': {
        title: 'Crochet Timer & Stitching Speed Stopwatch | WeLovePattern',
        desc: 'Log your craft session duration, calculate your stitching speed (rows per hour), and track labor time for accurate project pricing.',
        keywords: 'crochet timer, craft stopwatch, stitching speed tracker, time tracker for crochet, knit timer'
      },
      'pattern-library': {
        title: 'Crochet Pattern Library & Custom Collections Organizer | WeLovePattern',
        desc: 'Create custom pattern collections (Gift Ideas, Blankets, Winter Wear), save favorite designs, and organize pattern links in one place.',
        keywords: 'crochet pattern library, pattern collections organizer, save crochet patterns, pattern bookmark manager'
      },
      'abbreviation-dictionary': {
        title: 'Crochet Abbreviation Dictionary - US vs UK Terms Glossary | WeLovePattern',
        desc: 'Comprehensive US vs UK crochet stitch glossary and abbreviations dictionary with stitch conversion charts and step-by-step descriptions.',
        keywords: 'crochet abbreviation dictionary, us vs uk crochet terms, crochet stitch glossary, sc vs dc crochet, treble crochet uk to us'
      }
    };

    const tool = TOOLS_DATA.find(t => t.slug === route.toolParam);
    if (tool) {
      const customMeta = TOOL_SEO_MAP[tool.slug];
      title = customMeta?.title || `${tool.title} - Free Online Craft Tool | WeLovePattern`;
      description = customMeta?.desc || `${tool.description} Free, interactive, and offline-capable ${tool.title.toLowerCase()} for crocheters and knitters.`;
      keywords = customMeta?.keywords || `${tool.title.toLowerCase()}, crochet ${tool.title.toLowerCase()}, ${tool.category.toLowerCase()} tool, free craft calculator, welovepattern`;
      canonicalUrl = `${cleanOrigin}/tools/${tool.slug}`;

      // WebApplication Schema
      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': tool.title,
        'description': tool.description,
        'url': `${cleanOrigin}/tools/${tool.slug}`,
        'applicationCategory': 'DesignApplication',
        'operatingSystem': 'All',
        'browserRequirements': 'Requires JavaScript. Requires HTML5.'
      });

      // BreadcrumbList Schema for Individual Tool
      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': `${cleanOrigin}/tools` },
          { '@type': 'ListItem', 'position': 3, 'name': tool.title, 'item': `${cleanOrigin}/tools/${tool.slug}` }
        ]
      });
    } else {
      title = 'Free Crochet Calculators & Interactive Craft Tools | WeLovePattern';
      description = '19 free offline-capable crochet row counters with audio chimes, yarn weight converters, gauge swatch calculators, and project organizers.';
      canonicalUrl = `${cleanOrigin}/tools`;

      // BreadcrumbList Schema for Tools Main Page
      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': `${cleanOrigin}/tools` }
        ]
      });
    }
  } else if (route.view === 'blog') {
    const postsPool = customBlogPosts && Array.isArray(customBlogPosts) ? customBlogPosts : BLOG_DATA;
    const post = postsPool.find(b => b.slug === route.blogParam);
    if (post) {
      const meta = post.seoMeta || {};
      title = meta.metaTitle || `${post.title} | WeLovePattern Blog`;
      description = meta.metaDescription || post.excerpt;
      keywords = meta.metaKeywords || (post.tags ? post.tags.join(', ') : keywords);
      imageUrl = meta.ogImage || post.image;
      canonicalUrl = meta.canonicalUrl || `${cleanOrigin}/blog/${post.slug}`;
      ogType = 'article';

      if (post.status === 'draft' || meta.isNoIndex) {
        isNoIndex = true;
      }

      // BreadcrumbList schema
      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${cleanOrigin}/blog` },
          { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': `${cleanOrigin}/blog/${post.slug}` }
        ]
      });

      // BlogPosting schema
      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.excerpt,
        'image': [post.image],
        'author': {
          '@type': 'Person',
          'name': post.author || 'WeLovePattern Editor'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'WeLovePattern',
          'logo': {
            '@type': 'ImageObject',
            'url': `${cleanOrigin}/favicon.ico`
          }
        },
        'datePublished': post.date,
        'dateModified': post.updatedAt || post.date,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl
        }
      });
    } else {
      title = 'Crochet Tutorials, Tips & Stitch Guides | WeLovePattern Blog';
      description = 'Master crochet stitches with step-by-step beginner guides, US vs UK stitch term matrices, and yarn tension secrets.';
      canonicalUrl = `${cleanOrigin}/blog`;

      jsonLdSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${cleanOrigin}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${cleanOrigin}/blog` }
        ]
      });
    }
  } else if (route.view === 'admin') {
    title = 'Admin Dashboard | WeLovePattern';
    description = 'WeLovePattern admin pattern management.';
    isNoIndex = true;
  } else if (route.view === 'home') {
    canonicalUrl = `${cleanOrigin}/`;
    jsonLdSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'WeLovePattern',
      'url': `${cleanOrigin}/`,
      'description': description,
      'publisher': {
        '@type': 'Organization',
        'name': 'WeLovePattern',
        'url': `${cleanOrigin}/`
      }
    });
  }

  const jsonLdScripts = jsonLdSchemas.map(s => 
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n    ');

  return `
    <title>${escapeAttr(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="keywords" content="${escapeAttr(keywords)}" />
    ${isNoIndex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow" />'}
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />

    <!-- Open Graph / Facebook / Pinterest -->
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:image" content="${escapeAttr(imageUrl)}" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:type" content="${escapeAttr(ogType)}" />
    <meta property="og:site_name" content="WeLovePattern" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(imageUrl)}" />

    <!-- Structured Data JSON-LD -->
    ${jsonLdScripts}
  `;
}
