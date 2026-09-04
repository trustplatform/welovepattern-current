import React from 'react';
import { Pattern } from '../types';
import { Heart, Star, Download, Flame, Share2 } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';

interface PatternCardProps {
  pattern: Pattern;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectPattern: (slug: string) => void;
  onQuickDownload: (e: React.MouseEvent, pattern: Pattern) => void;
  onSharePattern?: (e: React.MouseEvent, pattern: Pattern) => void;
  index?: number;
  isHot?: boolean;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  isFavorite,
  onToggleFavorite,
  onSelectPattern,
  onQuickDownload,
  onSharePattern,
  index,
  isHot
}) => {
  const showHotFlame = isHot ?? (index !== undefined ? index < 10 : (pattern.isTrending || pattern.isPopular || pattern.downloadsCount >= 2000));

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Easy': return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300';
      case 'Intermediate': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300';
      case 'Advanced': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleCardClick = () => {
    onSelectPattern(pattern.slug);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectPattern(pattern.slug);
    }
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
    >
      <div>
        {/* Card Image Container */}
        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
          <img
            src={pattern.image}
            alt={pattern.title}
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

          {/* Difficulty Badge */}
          <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full border shadow-sm backdrop-blur-md z-10 ${getDifficultyColor(pattern.difficulty)}`}>
            {pattern.difficulty}
          </span>

          {/* Favorite & Share Buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {onSharePattern && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSharePattern(e, pattern);
                }}
                aria-label="Share pattern"
                title="Share pattern"
                className="p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-[#E96BA8] hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#9B7CF8]" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(e, pattern.id);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${
                  isFavorite 
                    ? 'fill-[#E96BA8] text-[#E96BA8]' 
                    : 'text-slate-500 hover:text-[#E96BA8]'
                }`} 
              />
            </button>
          </div>

          {/* Hook overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-xs font-medium z-10">
            <span className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Hook: {pattern.hookSize.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5 space-y-3">
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9B7CF8] dark:text-purple-400">
              {pattern.category ? pattern.category.replace('-', ' ') : ''}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>{pattern.rating}</span>
              <span className="text-slate-400 font-normal">({pattern.reviewCount})</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#E96BA8] transition-colors">
            {pattern.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {pattern.subtitle}
          </p>

        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 mt-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Download className="w-3.5 h-3.5 text-[#E96BA8]" />
          <span>{pattern.downloadsCount.toLocaleString('en-US')} downloads</span>
          {showHotFlame && (
            <span 
              className="inline-flex items-center justify-center ml-0.5 p-0.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 shadow-2xs"
              title="Hot pattern downloading fast!"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-amber-400 animate-fire-flame shrink-0" />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onQuickDownload(e, pattern);
          }}
          className="bg-pink-50 hover:bg-[#E96BA8] text-[#E96BA8] hover:text-white dark:bg-slate-700 dark:hover:bg-[#E96BA8] dark:text-pink-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 group-hover:bg-[#E96BA8] group-hover:text-white"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Get PDF</span>
        </button>
      </div>
    </div>
  );
};

