/**
 * SEO Content Engine - Website Article Publisher
 * 
 * Reuses the existing live website blog storage (`data/blog-posts.json`) and IndexNow notification engine.
 * Guarantees idempotency: prevents duplicate articles, preserves SEO metadata and sanitization.
 */

import fs from 'fs';
import path from 'path';
import { SeoEngineArticleJob } from '../types';
import { sanitizeBlogHtml } from '../../utils/sanitizeHtml';

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOG_POSTS_FILE = path.join(DATA_DIR, 'blog-posts.json');
const SITE_URL = 'https://welovepattern.com';

/**
 * Sends non-blocking background notification to Bing IndexNow for new or updated articles.
 */
async function notifyIndexNowSafe(urls: string[]): Promise<void> {
  try {
    const key = process.env.INDEXNOW_KEY || 'welovepattern-indexnow-key';
    const body = {
      host: 'welovepattern.com',
      key,
      keyLocation: `https://welovepattern.com/${key}.txt`,
      urlList: urls,
    };

    fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    }).catch(err => {
      console.warn('[ArticlePublisher] IndexNow notification background error:', err?.message || err);
    });
  } catch (err) {
    // Non-blocking
  }
}

export interface PublishArticleResult {
  success: boolean;
  blogPostId?: string;
  slug?: string;
  publicUrl?: string;
  alreadyPublished?: boolean;
  error?: string;
}

/**
 * Reads all blog posts from the live website datastore.
 */
export function getLiveBlogPosts(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BLOG_POSTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(BLOG_POSTS_FILE, 'utf-8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[ArticlePublisher] Error reading live blog posts file:', err);
    return [];
  }
}

/**
 * Writes blog posts to the live website datastore atomically.
 */
export function saveLiveBlogPosts(posts: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${BLOG_POSTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(posts, null, 2), 'utf-8');
    fs.renameSync(tmpFile, BLOG_POSTS_FILE);
    return true;
  } catch (err) {
    console.error('[ArticlePublisher] Error saving live blog posts file:', err);
    return false;
  }
}

/**
 * Publishes an SEO Engine article job directly to the live website blog storage.
 * Idempotent: If an article with this slug or publishedBlogPostId already exists, updates it cleanly.
 */
export async function publishArticleToLiveSite(job: SeoEngineArticleJob): Promise<PublishArticleResult> {
  try {
    if (!job.articleContent) {
      return { success: false, error: 'Job has no generated article content.' };
    }

    const { title, slug, excerpt, contentHtml, category, tags, seoMeta, heroImage } = job.articleContent;
    if (!title || !slug || !contentHtml) {
      return { success: false, error: 'Article is missing title, slug, or content.' };
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanHtml = typeof sanitizeBlogHtml === 'function' ? sanitizeBlogHtml(contentHtml) : contentHtml;
    const heroImageUrl = heroImage?.stablePublicUrl || '/uploads/blog/default-crochet.jpg';
    const canonicalUrl = `${SITE_URL}/blog/${cleanSlug}`;

    const posts = getLiveBlogPosts();

    // Check for existing post by slug or job id
    const existingIndex = posts.findIndex(p => p.slug === cleanSlug || p.seoEngineJobId === job.id);

    const now = new Date().toISOString();
    const blogPostId = existingIndex >= 0 ? posts[existingIndex].id : `blog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const wordCount = job.articleContent.wordCount || cleanHtml.split(/\s+/).length;
    const readTimeMinutes = Math.max(2, Math.ceil(wordCount / 200));

    const blogPostRecord = {
      id: blogPostId,
      seoEngineJobId: job.id,
      title: title.trim(),
      slug: cleanSlug,
      excerpt: excerpt || title,
      content: cleanHtml,
      category: category || (job.category === 'tools' ? 'Tools' : 'Crochet'),
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Crochet', 'Patterns', 'Free Guides'],
      image: heroImageUrl,
      author: 'WeLovePattern Editorial Team',
      readTime: `${readTimeMinutes} min read`,
      readTimeMinutes,
      status: 'published',
      publishedAt: existingIndex >= 0 && posts[existingIndex].publishedAt ? posts[existingIndex].publishedAt : now,
      createdAt: existingIndex >= 0 && posts[existingIndex].createdAt ? posts[existingIndex].createdAt : now,
      updatedAt: now,
      seoMeta: {
        metaTitle: seoMeta?.title || `${title} | WeLovePattern`,
        metaDescription: seoMeta?.description || excerpt || title,
        metaKeywords: seoMeta?.keywords || (tags ? tags.join(', ') : ''),
        canonicalUrl,
        ogTitle: seoMeta?.title || title,
        ogDescription: seoMeta?.description || excerpt || title,
        ogImage: heroImageUrl,
        twitterTitle: seoMeta?.title || title,
        twitterDescription: seoMeta?.description || excerpt || title,
        twitterImage: heroImageUrl,
        isNoIndex: false,
        isNoFollow: false,
      },
    };

    if (existingIndex >= 0) {
      posts[existingIndex] = blogPostRecord;
    } else {
      posts.unshift(blogPostRecord);
    }

    const saved = saveLiveBlogPosts(posts);
    if (!saved) {
      return { success: false, error: 'Failed to write blog post to storage file.' };
    }

    // Trigger IndexNow notification for Bing/Search Engines
    notifyIndexNowSafe([canonicalUrl, `${SITE_URL}/blog`]).catch(() => {});

    console.log(`[ArticlePublisher] 🚀 Successfully published article "${title}" to ${canonicalUrl} (ID: ${blogPostId})`);

    return {
      success: true,
      blogPostId,
      slug: cleanSlug,
      publicUrl: canonicalUrl,
      alreadyPublished: existingIndex >= 0,
    };
  } catch (err: any) {
    console.error('[ArticlePublisher] Failed to publish article to live site:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected error during article publication',
    };
  }
}
