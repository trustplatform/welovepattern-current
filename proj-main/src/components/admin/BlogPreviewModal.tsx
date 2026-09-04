import React from 'react';
import { BlogPost } from '../../types';
import { Clock, Calendar, User, Eye, X, Tag } from 'lucide-react';
import { sanitizeBlogHtml } from '../../utils/sanitizeHtml';

interface BlogPreviewModalProps {
  post: BlogPost;
  onClose: () => void;
}

export const BlogPreviewModal: React.FC<BlogPreviewModalProps> = ({ post, onClose }) => {
  const sanitizedContent = sanitizeBlogHtml(post.content);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-6">
      
      {/* Sticky Banner */}
      <div className="sticky top-0 z-50 w-full max-w-4xl bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-between mb-4 border border-amber-400">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 shrink-0" />
          <span>PREVIEW MODE — {post.status === 'published' ? 'Live Article' : 'Draft Article'}</span>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-950 text-white hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Exit Preview
        </button>
      </div>

      {/* Main Blog Article View Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 my-4">
        
        {/* Category Pill & Date */}
        <div className="flex items-center gap-3">
          <span className="bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] font-black text-xs px-3 py-1.5 rounded-full border border-pink-200 dark:border-pink-800">
            {post.category || 'General'}
          </span>
          <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.date || new Date().toISOString().split('T')[0]}
          </span>
          {post.readTime && (
            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          )}
        </div>

        {/* Title & Excerpt */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {post.title || 'Untitled Post'}
          </h1>
          {post.excerpt && (
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Author Card */}
        <div className="flex items-center gap-3 py-3 border-y border-slate-100 dark:border-slate-800">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-pink-100 text-[#E96BA8] flex items-center justify-center font-black">
              {post.author ? post.author.charAt(0) : 'A'}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{post.author || 'WeLovePattern Team'}</p>
            {post.authorRole && <p className="text-xs text-slate-400">{post.authorRole}</p>}
          </div>
        </div>

        {/* Featured Image */}
        {post.image && (
          <figure className="space-y-2">
            <img
              src={post.image}
              alt={post.imageAlt || post.title}
              className="w-full h-[280px] sm:h-[420px] object-cover rounded-3xl border border-slate-200 dark:border-slate-800"
            />
            {post.imageCaption && (
              <figcaption className="text-center text-xs text-slate-400 italic">
                {post.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Article HTML Content */}
        <div 
          className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-4 text-base"
          dangerouslySetInnerHTML={{ __html: sanitizedContent || '<p className="text-slate-400 italic">No post content provided.</p>' }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            {post.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
