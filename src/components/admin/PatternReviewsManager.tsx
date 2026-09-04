import React, { useState } from 'react';
import { Pattern, Review } from '../../types';
import { 
  MessageSquare, 
  Star, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  Filter,
  User,
  Calendar,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface PatternReviewsManagerProps {
  patterns: Pattern[];
  reviews: Review[];
  selectedPatternId?: string | null;
  onClose?: () => void;
  onAddReview: (review: Review) => void;
  onEditReview: (review: Review) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const PatternReviewsManager: React.FC<PatternReviewsManagerProps> = ({
  patterns,
  reviews,
  selectedPatternId = null,
  onClose,
  onAddReview,
  onEditReview,
  onDeleteReview
}) => {
  const [filterPatternId, setFilterPatternId] = useState<string>(selectedPatternId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');

  // Edit / Add Modal state inside manager
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for Add/Edit
  const [formPatternId, setFormPatternId] = useState<string>(selectedPatternId && selectedPatternId !== 'ALL' ? selectedPatternId : (patterns[0]?.id || 'p1'));
  const [formUserName, setFormUserName] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState('');
  const [formVerified, setFormVerified] = useState<boolean>(true);

  const handleOpenEdit = (review: Review) => {
    setEditingReview(review);
    setFormPatternId(review.patternId);
    setFormUserName(review.userName);
    setFormRating(review.rating);
    setFormComment(review.comment);
    setFormVerified(review.verifiedMaker);
    setIsAdding(false);
  };

  const handleOpenAdd = (pId?: string) => {
    setEditingReview(null);
    setFormPatternId(pId || (filterPatternId !== 'ALL' ? filterPatternId : (patterns[0]?.id || 'p1')));
    setFormUserName('');
    setFormRating(5);
    setFormComment('');
    setFormVerified(true);
    setIsAdding(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserName.trim() || !formComment.trim()) return;

    if (editingReview) {
      const updated: Review = {
        ...editingReview,
        patternId: formPatternId,
        userName: formUserName,
        rating: formRating,
        comment: formComment,
        verifiedMaker: formVerified
      };
      onEditReview(updated);
      setEditingReview(null);
    } else if (isAdding) {
      const newRev: Review = {
        id: `rev-${Date.now()}`,
        patternId: formPatternId,
        userName: formUserName,
        userAvatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
        rating: formRating,
        date: new Date().toISOString().split('T')[0],
        comment: formComment,
        verifiedMaker: formVerified
      };
      onAddReview(newRev);
      setIsAdding(false);
    }
  };

  // Filter logic
  const filteredReviews = reviews.filter(r => {
    if (filterPatternId !== 'ALL' && r.patternId !== filterPatternId) return false;
    if (ratingFilter !== 'ALL' && r.rating !== ratingFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchUser = r.userName.toLowerCase().includes(q);
      const targetPattern = patterns.find(p => p.id === r.patternId);
      const matchPatternTitle = targetPattern?.title.toLowerCase().includes(q);
      if (!matchComment && !matchUser && !matchPatternTitle) return false;
    }
    return true;
  });

  const selectedPatternObj = patterns.find(p => p.id === filterPatternId);

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#E96BA8]" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {filterPatternId !== 'ALL' && selectedPatternObj 
                ? `Reviews for "${selectedPatternObj.title}"`
                : 'All Pattern Reviews Management'}
            </h3>
            <span className="bg-pink-100 dark:bg-pink-950/60 text-[#E96BA8] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredReviews.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View, edit comments, adjust ratings, or delete spam/inappropriate reviews.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAdd()}
            className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Official Review</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pattern Filter Select */}
        <div className="relative">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Filter by Pattern</label>
          <select
            value={filterPatternId}
            onChange={(e) => setFilterPatternId(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          >
            <option value="ALL">🌟 All Patterns ({reviews.length} reviews)</option>
            {patterns.map(p => {
              const pCount = reviews.filter(r => r.patternId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.title} ({pCount})
                </option>
              );
            })}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Filter by Rating</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          >
            <option value="ALL">All Ratings (1 - 5 Stars)</option>
            <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
            <option value={4}>4 Stars ⭐⭐⭐⭐</option>
            <option value={3}>3 Stars ⭐⭐⭐</option>
            <option value={2}>2 Stars ⭐⭐</option>
            <option value={1}>1 Star ⭐</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Search Keyword</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search maker name or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs pl-8 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>
        </div>
      </div>

      {/* Add / Edit Form Overlay Modal */}
      {(editingReview || isAdding) && (
        <div className="bg-pink-50/50 dark:bg-pink-950/20 border-2 border-[#E96BA8]/30 p-5 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E96BA8]" />
              {editingReview ? 'Edit Review' : 'Create New Pattern Review'}
            </h4>
            <button
              onClick={() => { setEditingReview(null); setIsAdding(false); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Target Pattern</label>
                <select
                  value={formPatternId}
                  onChange={(e) => setFormPatternId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium p-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                >
                  {patterns.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Maker Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah J. (Crochet Enthusiast)"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium p-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setFormRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${s <= formRating ? 'fill-current text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={formVerified}
                  onChange={(e) => setFormVerified(e.target.checked)}
                  className="w-4 h-4 text-[#E96BA8] rounded focus:ring-[#E96BA8]"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Verified Maker Badge
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Review Comment</label>
              <textarea
                required
                rows={3}
                placeholder="Write review details..."
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-normal p-3 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setEditingReview(null); setIsAdding(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {editingReview ? 'Save Changes' : 'Post Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews Table / Cards list */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-sm font-medium">No reviews found matching your selected filters.</p>
          <button
            onClick={() => handleOpenAdd()}
            className="bg-[#E96BA8] text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Review</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[20px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pattern Post</th>
                  <th className="py-3.5 px-4">Maker Name</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Comment</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-800 dark:text-slate-200">
                {filteredReviews.map((r) => {
                  const patternObj = patterns.find(p => p.id === r.patternId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 max-w-[180px]">
                        <span className="font-bold text-slate-900 dark:text-white truncate block" title={patternObj?.title || r.patternId}>
                          {patternObj?.title || r.patternId}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {patternObj?.category ? patternObj.category.replace('-', ' ') : 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.userName}</span>
                          {r.verifiedMaker && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Verified Maker" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center text-amber-400 font-bold gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-slate-800 dark:text-slate-200 text-xs ml-0.5">{r.rating}.0</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-xs">
                          "{r.comment}"
                        </p>
                      </td>

                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {r.date}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="px-2.5 py-1 text-xs font-bold bg-pink-50 text-[#E96BA8] hover:bg-pink-100 dark:bg-pink-950/60 dark:text-pink-300 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                            title="Edit this review"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete this review from ${r.userName}?`)) {
                                onDeleteReview(r.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                            title="Delete this review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
