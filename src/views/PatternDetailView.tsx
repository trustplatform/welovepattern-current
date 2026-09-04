import React, { useState, useEffect } from 'react';
import { Pattern, Review, PatternSeoArticle } from '../types';
import { PatternCard } from '../components/PatternCard';
import { ShareModal } from '../components/ShareModal';
import { PatternSeoArticleSection } from '../components/PatternSeoArticleSection';
import { handleImageError } from '../utils/imageUtils';
import { updateHeadMetaTags } from '../utils/seoUtils';
import { 
  Heart, 
  Download, 
  Star, 
  Clock, 
  CheckCircle2, 
  Share2, 
  Bookmark, 
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Ruler,
  Layers,
  Wrench,
  Search,
  Edit
} from 'lucide-react';

interface PatternDetailViewProps {
  pattern: Pattern;
  allPatterns: Pattern[];
  reviews?: Review[];
  seoArticle?: PatternSeoArticle | null;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onQuickDownload: (e: React.MouseEvent, pattern: Pattern) => void;
  onSelectPattern: (slug: string) => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenPatternEditor?: (pattern?: Pattern) => void;
  onAddReview?: (review: Review) => void;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (reviewId: string) => void;
  isAdmin?: boolean;
}

export const PatternDetailView: React.FC<PatternDetailViewProps> = ({
  pattern,
  allPatterns,
  reviews = [],
  seoArticle,
  isFavorite,
  onToggleFavorite,
  onQuickDownload,
  onSelectPattern,
  onNavigate,
  onOpenPatternEditor,
  onAddReview,
  onEditReview,
  onDeleteReview,
  isAdmin = false
}) => {
  const [selectedImage, setSelectedImage] = useState(pattern.image);
  const [activeSeoArticle, setActiveSeoArticle] = useState<PatternSeoArticle | null>(seoArticle || null);

  useEffect(() => {
    if (seoArticle !== undefined) {
      setActiveSeoArticle(seoArticle);
    }
  }, [seoArticle]);

  // Client-side fallback fetch for SEO article if not already loaded via SSR props
  useEffect(() => {
    if (!activeSeoArticle) {
      let isMounted = true;
      const fetchSeo = async () => {
        try {
          const res = await fetch(`/api/pattern-seo/${pattern.id}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data && data.status === 'published') {
              setActiveSeoArticle(data);
            }
          }
        } catch (err) {
          // Silent fallback
        }
      };
      fetchSeo();
      return () => { isMounted = false; };
    }
  }, [pattern.id, activeSeoArticle]);

  useEffect(() => {
    setSelectedImage(pattern.image);
    setCheckedMaterials({});
    setCompletedSteps({});

    // Inject SEO Meta Tags dynamically into <head>
    updateHeadMetaTags({
      title: pattern.seoMeta?.metaTitle || `${pattern.title} - Free Crochet Pattern`,
      description: pattern.seoMeta?.metaDescription || pattern.description,
      keywords: pattern.seoMeta?.metaKeywords || `${pattern.title}, free crochet pattern, ${pattern.category}, ${pattern.difficulty}`,
      image: pattern.seoMeta?.ogImage || pattern.image,
      url: pattern.seoMeta?.canonicalUrl || `https://welovepattern.com/pattern/${pattern.slug}`
    });
  }, [pattern]);

  const [checkedMaterials, setCheckedMaterials] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Review submission state
  const patternReviews = reviews.filter(r => r.patternId === pattern.id);
  const [newReviewText, setNewReviewText] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const handleCreateReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      patternId: pattern.id,
      userName: newUserName.trim() || 'Happy Maker',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      comment: newReviewText.trim(),
      verifiedMaker: true
    };

    if (onAddReview) {
      onAddReview(newRev);
    }
    setNewReviewText('');
    setNewUserName('');
    setNewRating(5);
  };

  // Dynamically inject JSON-LD Schema markup for SEO
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": pattern.title,
      "description": pattern.description,
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": "15.00"
      },
      "tool": [
        { "@type": "HowToTool", "name": `Crochet Hook ${pattern.hookSize}` }
      ],
      "supply": pattern.materials.map(m => ({ "@type": "HowToSupply", "name": m })),
      "step": pattern.steps.map(s => ({
        "@type": "HowToStep",
        "name": s.rowNumber,
        "text": s.instruction
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'schema-pattern-jsonld';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('schema-pattern-jsonld');
      if (existing) document.head.removeChild(existing);
    };
  }, [pattern]);

  const toggleMaterial = (idx: number) => {
    setCheckedMaterials(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const relatedPatterns = allPatterns.filter(p => p.id !== pattern.id && p.category === pattern.category).slice(0, 3);

  return (
    <div className="space-y-12">
      
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button onClick={() => onNavigate('home')} className="hover:text-[#E96BA8]">Home</button>
        <span>/</span>
        <button onClick={() => onNavigate('patterns')} className="hover:text-[#E96BA8]">Patterns</button>
        <span>/</span>
        <button onClick={() => onNavigate('categories', pattern.category)} className="capitalize hover:text-[#E96BA8]">
          {pattern.category ? pattern.category.replace('-', ' ') : 'Category'}
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{pattern.title}</span>
      </div>

      {/* Main Pattern Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <img
              src={selectedImage}
              alt={pattern.title}
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, pattern.image)}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 text-[#E96BA8] text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
              {pattern.difficulty}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(e, pattern.id);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md cursor-pointer hover:scale-110 transition-transform"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#E96BA8] text-[#E96BA8]' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* Gallery Thumbnails */}
          {pattern.gallery.length > 1 && (
            <div className="flex gap-3">
              {pattern.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-[#E96BA8] scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" onError={(e) => handleImageError(e)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Information & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-pink-100 text-[#E96BA8] dark:bg-pink-950/60 dark:text-pink-300 text-xs font-bold uppercase px-3 py-1 rounded-full">
                {pattern.category ? pattern.category.replace('-', ' ') : 'General'}
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-4 h-4 fill-current text-amber-400" />
                <span>{pattern.rating}</span>
                <span className="text-slate-400">({pattern.reviewCount} maker reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {pattern.title}
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              {pattern.description}
            </p>
          </div>

          {/* Specification Cards Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-[20px] border border-slate-200/60 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Hook Size</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{pattern.hookSize}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Yarn Weight</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{pattern.yarnWeight.split(' ')[0]}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Finished Size</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{pattern.finishedSize.split('(')[0]}</span>
            </div>
          </div>

          {/* Action Download & SEO Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={(e) => {
                if (pattern.pdfUrl) {
                  window.open(pattern.pdfUrl, '_blank', 'noopener,noreferrer');
                } else {
                  onQuickDownload(e, pattern);
                }
              }}
              className="flex-1 bg-[#E96BA8] hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base active:scale-98"
            >
              <Download className="w-5 h-5" />
              <span>Download Free PDF Pattern</span>
            </button>

            {isAdmin && onOpenPatternEditor && (
              <button
                onClick={() => onOpenPatternEditor(pattern)}
                className="bg-pink-50 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 text-[#E96BA8] font-bold px-5 py-4 rounded-2xl border border-pink-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                title="Edit pattern details, upload photo, or update SEO meta tags"
              >
                <Edit className="w-4 h-4" />
                <span>SEO &amp; Edit</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold px-5 py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Share2 className="w-4 h-4 text-[#9B7CF8]" />
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Materials Checklist & Gauge Specs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Materials (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-4 shadow-sm">
          <h2 className="font-bold text-slate-900 dark:text-white text-xl flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E96BA8]" />
            Materials Checklist
          </h2>

          <div className="space-y-2.5">
            {pattern.materials.map((m, idx) => (
              <div
                key={idx}
                onClick={() => toggleMaterial(idx)}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-sm ${
                  checkedMaterials[idx]
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 line-through opacity-75'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                  checkedMaterials[idx] ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-300'
                }`}>
                  {checkedMaterials[idx] && '✓'}
                </div>
                <span>{m}</span>
              </div>
            ))}
          </div>

          <div className="bg-pink-50 dark:bg-slate-900/60 p-4 rounded-xl border border-pink-200/50 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-bold text-[#E96BA8]">Gauge Specification:</p>
            <p>{pattern.gauge}</p>
          </div>
        </div>

        {/* Right Written Pattern Instructions (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-6 shadow-sm">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-xl">
                Written Row-by-Row Steps
              </h2>
              <p className="text-xs text-slate-400">Click step checkbox to track your progress</p>
            </div>
            
            <button
              onClick={() => onNavigate('tools', 'row-counter')}
              className="bg-purple-100 text-[#9B7CF8] dark:bg-purple-950/60 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              Open Row Counter
            </button>
          </div>

          <div className="space-y-4">
            {pattern.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all space-y-2 ${
                  completedSteps[idx]
                    ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40 opacity-80'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E96BA8] text-sm">{step.rowNumber}</span>
                  <button
                    onClick={() => toggleStep(idx)}
                    className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${completedSteps[idx] ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>{completedSteps[idx] ? 'Done' : 'Mark Done'}</span>
                  </button>
                </div>

                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-normal">
                  {step.instruction}
                </p>

                {step.tip && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/40">
                    💡 <strong>Tip:</strong> {step.tip}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Pattern SEO / Helpful Maker Guide Section (Renders between Pattern Instructions and Maker Reviews) */}
      {activeSeoArticle && activeSeoArticle.status === 'published' && (
        <PatternSeoArticleSection article={activeSeoArticle} />
      )}

      {/* Maker Reviews Section */}
      <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] border border-slate-200/80 dark:border-slate-700 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#E96BA8]" />
          Maker Reviews ({patternReviews.length})
        </h2>

        {/* Submit Review Form */}
        <form onSubmit={handleCreateReviewSubmit} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Leave a Review for this Pattern</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />

            <div className="flex items-center gap-2 text-amber-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-500 font-bold">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setNewRating(s)}
                  className="cursor-pointer"
                >
                  <Star className={`w-4 h-4 ${s <= newRating ? 'fill-current text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            required
            rows={3}
            placeholder="Share your experience making this pattern..."
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          />

          <button
            type="submit"
            className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-sm"
          >
            Submit Maker Review
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-3">
          {patternReviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Be the first maker to review this pattern!</p>
          ) : (
            patternReviews.map((r) => {
              const isEditing = editingReviewId === r.id;

              return (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{r.userName}</span>
                      {r.verifiedMaker && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          Verified Maker
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <div className="flex items-center text-amber-400 font-bold gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-slate-700 dark:text-slate-200">{r.rating}.0</span>
                      </div>
                      <span>{r.date}</span>

                      {/* Edit/Delete options */}
                      {(onEditReview || onDeleteReview) && (
                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingReviewId(null);
                              } else {
                                setEditingReviewId(r.id);
                                setEditComment(r.comment);
                                setEditRating(r.rating);
                              }
                            }}
                            className="text-[#E96BA8] hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>

                          {onDeleteReview && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this review?')) {
                                  onDeleteReview(r.id);
                                }
                              }}
                              className="text-rose-500 hover:underline font-bold text-[11px] cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold">Rating:</span>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setEditRating(s)} className="p-0.5 cursor-pointer">
                            <Star className={`w-4 h-4 ${s <= editRating ? 'fill-current text-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={2}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-normal"
                      />

                      <button
                        onClick={() => {
                          if (onEditReview) {
                            onEditReview({
                              ...r,
                              comment: editComment,
                              rating: editRating
                            });
                          }
                          setEditingReviewId(null);
                        }}
                        className="bg-[#E96BA8] text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        Save Edit
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={pattern.title}
        description={pattern.description}
        imageUrl={pattern.image}
        url={typeof window !== 'undefined' ? `${window.location.origin}/pattern/${pattern.slug}` : `https://welovepattern.com/pattern/${pattern.slug}`}
      />

    </div>
  );
};
