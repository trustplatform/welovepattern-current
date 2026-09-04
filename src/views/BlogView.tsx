import React, { useState, useEffect } from 'react';
import { BLOG_DATA } from '../data/blogData';
import { BlogPost } from '../types';
import { Clock, ArrowLeft, ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';
import { sanitizeBlogHtml } from '../utils/sanitizeHtml';

interface BlogViewProps {
  initialPosts?: BlogPost[];
  initialSlug?: string;
}

export const BlogView: React.FC<BlogViewProps> = ({ initialPosts, initialSlug }) => {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    if (initialPosts && Array.isArray(initialPosts) && initialPosts.length > 0) {
      return initialPosts.filter(p => p.status === 'published');
    }
    return BLOG_DATA.map(p => ({ ...p, status: 'published' as const }));
  });

  const [activePost, setActivePost] = useState<BlogPost | null>(() => {
    if (initialSlug && initialPosts && Array.isArray(initialPosts)) {
      return initialPosts.find(p => p.slug === initialSlug && p.status === 'published') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch published blog posts from API
  useEffect(() => {
    let isMounted = true;
    const fetchBlog = async () => {
      try {
        const res = await fetch('/api/blog');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setPosts(data);
          }
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBlog();
    return () => { isMounted = false; };
  }, []);

  // Check URL pathname for direct article slug e.g. /blog/master-crochet-stitches
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/blog/') && pathname !== '/blog' && pathname !== '/blog/') {
      const slug = pathname.replace('/blog/', '').replace(/\/$/, '');
      const match = posts.find(p => p.slug === slug);
      if (match) {
        setActivePost(match);
      }
    }
  }, [posts]);

  const handleOpenArticle = (post: BlogPost) => {
    setActivePost(post);
    window.history.pushState({}, '', `/blog/${post.slug}`);
  };

  const handleBackToList = () => {
    setActivePost(null);
    window.history.pushState({}, '', '/blog');
  };

  if (activePost) {
    const sanitizedHtml = sanitizeBlogHtml(activePost.content);

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#E96BA8]" />
          <span>Back to All Articles</span>
        </button>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] text-xs font-black px-3 py-1 rounded-full uppercase border border-pink-200 dark:border-pink-800">
              {activePost.category}
            </span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {activePost.date}
            </span>
            {activePost.readTime && (
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activePost.readTime}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {activePost.title}
          </h1>

          {activePost.excerpt && (
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              {activePost.excerpt}
            </p>
          )}

          {/* Author Badge */}
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            {activePost.authorAvatar ? (
              <img
                src={activePost.authorAvatar}
                alt={activePost.author}
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e)}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-pink-100 text-[#E96BA8] flex items-center justify-center font-black">
                {activePost.author ? activePost.author.charAt(0) : 'W'}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">{activePost.author || 'WeLovePattern Team'}</p>
              {activePost.authorRole && <p className="text-slate-400">{activePost.authorRole}</p>}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {activePost.image && (
          <figure className="space-y-2">
            <div className="aspect-[16/9] bg-slate-100 rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800">
              <img
                src={activePost.image}
                alt={activePost.imageAlt || activePost.title}
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e)}
                className="w-full h-full object-cover"
              />
            </div>
            {activePost.imageCaption && (
              <figcaption className="text-center text-xs text-slate-400 italic">
                {activePost.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Article Formatted Content */}
        <div
          className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-4 text-base"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />

        {/* Article Tags */}
        {activePost.tags && activePost.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            {activePost.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Crochet Guides, Tutorials &amp; Craft Tips
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Learn fundamental crochet stitches, US vs UK stitch terms, and craft pricing formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => handleOpenArticle(post)}
            className="group bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#E96BA8] uppercase tracking-wider">{post.category}</span>
                  {post.readTime && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#E96BA8] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 flex items-center justify-between text-xs font-bold text-[#9B7CF8] border-t border-slate-100 dark:border-slate-700/60">
              <span>Read Full Article</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
