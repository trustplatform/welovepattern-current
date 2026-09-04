import React from 'react';
import { Category } from '../types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface RecommendedCategoriesProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (catId: string) => void;
  onNavigate?: (view: string, param?: string) => void;
}

// Line art craft SVG icons styled like the reference image with site main brand color accents (#E96BA8)
const CategoryIcon: React.FC<{ id: string; name: string; image?: string }> = ({ id, name, image }) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [image]);

  if (image && typeof image === 'string' && image.trim().length > 0 && !imageError) {
    return (
      <img 
        src={image} 
        alt={name} 
        className="w-full h-full object-cover rounded-full" 
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  const lower = (id || '').toLowerCase() + ' ' + (name || '').toLowerCase();

  if (lower.includes('crochet') || lower.includes('free-crochet')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Paper sheet */}
        <rect x="16" y="10" width="30" height="42" rx="3" className="fill-white dark:fill-slate-800 stroke-slate-800 dark:stroke-slate-200" />
        <line x1="22" y1="18" x2="38" y2="18" className="stroke-slate-300 dark:stroke-slate-600" />
        <line x1="22" y1="24" x2="34" y2="24" className="stroke-slate-300 dark:stroke-slate-600" />
        {/* Crochet hook in main brand color */}
        <path d="M20 48 L42 20 C44 18 47 19 46 22 L45 23" className="stroke-[#E96BA8]" strokeWidth="2.5" />
      </svg>
    );
  }

  if (lower.includes('yarn') || lower === 'supplies') {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Skein of yarn */}
        <ellipse cx="28" cy="28" rx="10" ry="16" transform="rotate(-30 28 28)" className="fill-amber-50 dark:fill-amber-950/40 stroke-amber-500" />
        <path d="M22 20 Q28 28 34 36" className="stroke-amber-500" />
        <path d="M25 15 Q28 28 31 41" className="stroke-amber-500" />
        {/* Heart label on skein */}
        <rect x="23" y="24" width="10" height="8" rx="1" className="fill-white dark:fill-slate-800 stroke-amber-500" strokeWidth="1.2" />
        <path d="M26 28 C26 26.5 28 26.5 28 28 C28 26.5 30 26.5 30 28 C30 29.5 28 31 28 31 C28 31 26 29.5 26 28 Z" className="fill-[#E96BA8] stroke-none" />
        {/* Ball of yarn */}
        <circle cx="42" cy="40" r="11" className="fill-pink-50/50 dark:fill-slate-800 stroke-[#E96BA8]" />
        <path d="M34 36 C38 42 46 38 52 42" className="stroke-[#E96BA8]" />
        <path d="M36 44 C42 38 48 44 50 36" className="stroke-[#E96BA8]" />
      </svg>
    );
  }

  if (lower.includes('blanket')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Folded blanket layers */}
        <rect x="14" y="32" width="36" height="18" rx="4" className="fill-amber-100/60 dark:fill-amber-950/40 stroke-amber-500" />
        <rect x="18" y="22" width="36" height="18" rx="4" className="fill-pink-100/70 dark:fill-pink-950/50 stroke-[#E96BA8]" />
        <rect x="14" y="12" width="36" height="18" rx="4" className="fill-purple-100/60 dark:fill-purple-950/40 stroke-purple-500" />
        {/* Stitch detail lines */}
        <line x1="20" y1="18" x2="44" y2="18" className="stroke-purple-400" strokeDasharray="2 2" />
        <line x1="24" y1="28" x2="48" y2="28" className="stroke-[#E96BA8]" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (lower.includes('flower')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Petals */}
        <circle cx="32" cy="18" r="7" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        <circle cx="44" cy="26" r="7" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        <circle cx="40" cy="40" r="7" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        <circle cx="24" cy="40" r="7" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        <circle cx="20" cy="26" r="7" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        {/* Center */}
        <circle cx="32" cy="30" r="8" className="fill-amber-400 stroke-amber-600" />
        {/* Stem */}
        <path d="M32 38 L32 54" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
        <path d="M32 46 Q38 42 42 46" className="stroke-emerald-600 dark:stroke-emerald-400" />
      </svg>
    );
  }

  if (lower.includes('amigurumi') || lower.includes('animal') || lower.includes('toy')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Bear ears */}
        <circle cx="20" cy="20" r="6" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        <circle cx="44" cy="20" r="6" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        {/* Head */}
        <circle cx="32" cy="34" r="18" className="fill-white dark:fill-slate-800 stroke-slate-800 dark:stroke-slate-200" />
        {/* Eyes */}
        <circle cx="25" cy="32" r="2" className="fill-slate-900 dark:fill-white stroke-none" />
        <circle cx="39" cy="32" r="2" className="fill-slate-900 dark:fill-white stroke-none" />
        {/* Snout */}
        <ellipse cx="32" cy="39" rx="6" ry="4" className="fill-amber-100 dark:fill-amber-900/60 stroke-amber-500" />
        <path d="M32 37 L32 39 M30 41 Q32 43 34 41" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="1.5" />
      </svg>
    );
  }

  if (lower.includes('bag')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Handles */}
        <path d="M24 24 C24 14 40 14 40 24" className="stroke-[#E96BA8]" strokeWidth="2.5" />
        {/* Bag Body */}
        <path d="M16 24 L20 52 C20 54 22 56 25 56 L39 56 C42 56 44 54 44 52 L48 24 Z" className="fill-pink-50/50 dark:fill-slate-800 stroke-slate-800 dark:stroke-slate-200" />
        {/* Mesh weave lines */}
        <line x1="22" y1="32" x2="42" y2="32" className="stroke-[#E96BA8]/60" strokeDasharray="3 2" />
        <line x1="20" y1="40" x2="44" y2="40" className="stroke-[#E96BA8]/60" strokeDasharray="3 2" />
        <line x1="22" y1="48" x2="42" y2="48" className="stroke-[#E96BA8]/60" strokeDasharray="3 2" />
      </svg>
    );
  }

  if (lower.includes('baby')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Baby Bootie */}
        <path d="M18 18 L18 36 C18 42 22 46 28 46 L42 46 C48 46 50 42 50 38 C50 34 46 32 40 32 L32 32 L32 18 Z" className="fill-pink-100/70 dark:fill-pink-950/40 stroke-[#E96BA8]" />
        {/* Cuff ribbing */}
        <rect x="16" y="14" width="18" height="6" rx="2" className="fill-white dark:fill-slate-800 stroke-[#E96BA8]" />
        {/* Bow */}
        <circle cx="34" cy="30" r="2" className="fill-[#E96BA8] stroke-none" />
      </svg>
    );
  }

  if (lower.includes('top')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Straps */}
        <line x1="22" y1="12" x2="26" y2="22" className="stroke-amber-500" strokeWidth="2" />
        <line x1="42" y1="12" x2="38" y2="22" className="stroke-amber-500" strokeWidth="2" />
        {/* Halter Top Body */}
        <path d="M22 22 L42 22 L48 50 L16 50 Z" className="fill-[#E96BA8]/15 stroke-slate-800 dark:stroke-slate-200" />
        <path d="M16 50 L20 54 L24 50 L28 54 L32 50 L36 54 L40 50 L44 54 L48 50" className="stroke-[#E96BA8]" />
      </svg>
    );
  }

  if (lower.includes('sweater') || lower.includes('cardigan')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Sweater Body & Sleeves */}
        <path d="M24 16 C28 20 36 20 40 16 L56 26 L48 38 L44 34 L44 52 L20 52 L20 34 L16 38 L8 26 Z" className="fill-pink-50/70 dark:fill-pink-950/30 stroke-[#E96BA8]" />
        {/* Neckline */}
        <path d="M24 16 C28 22 36 22 40 16" className="stroke-[#E96BA8]" strokeWidth="2.5" />
        <line x1="20" y1="48" x2="44" y2="48" className="stroke-amber-500" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (lower.includes('accessory') || lower.includes('hat') || lower.includes('scarf')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Beanie Hat */}
        <path d="M18 38 C18 20 46 20 46 38 Z" className="fill-pink-100/60 dark:fill-pink-950/40 stroke-[#E96BA8]" />
        {/* Folded brim */}
        <rect x="16" y="38" width="32" height="10" rx="3" className="fill-white dark:fill-slate-800 stroke-slate-800 dark:stroke-slate-200" />
        {/* Pom pom */}
        <circle cx="32" cy="18" r="5" className="fill-[#E96BA8] stroke-[#E96BA8]" />
        <line x1="20" y1="43" x2="44" y2="43" className="stroke-amber-500" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (lower.includes('granny') || lower.includes('square')) {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer square */}
        <rect x="12" y="12" width="40" height="40" rx="4" className="fill-amber-50 dark:fill-amber-950/40 stroke-amber-500" />
        {/* Middle square */}
        <rect x="20" y="20" width="24" height="24" rx="2" className="fill-pink-100 dark:fill-pink-950/60 stroke-[#E96BA8]" />
        {/* Center square */}
        <rect x="27" y="27" width="10" height="10" rx="1" className="fill-[#E96BA8] stroke-none" />
      </svg>
    );
  }

  // Default Home Decor or Craft Icon
  return (
    <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="18" className="fill-pink-50 dark:fill-pink-950/40 stroke-[#E96BA8]" />
      <path d="M22 32 C26 22 38 42 42 32" className="stroke-slate-800 dark:stroke-slate-200" />
      <path d="M32 22 C22 26 42 38 32 42" className="stroke-[#E96BA8]" />
    </svg>
  );
};

export const RecommendedCategories: React.FC<RecommendedCategoriesProps> = ({
  categories,
  selectedCategory = 'all',
  onSelectCategory,
  onNavigate
}) => {
  const scrollContainer = (direction: 'left' | 'right') => {
    const el = document.getElementById('recommended-categories-scroll');
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
    }
  };

  // Filter active categories and prepend "All Patterns" option
  const activeCategories = categories.filter(c => c.isActive !== false);

  const categoryItems = [
    {
      id: 'all',
      name: 'All Patterns',
      count: activeCategories.reduce((sum, c) => sum + (c.count || 0), 0)
    },
    ...activeCategories
  ];

  return (
    <section className="space-y-4 py-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Recommended Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Explore handpicked crochet &amp; craft collections
            </p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollContainer('left')}
            aria-label="Scroll left"
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer shadow-2xs active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollContainer('right')}
            aria-label="Scroll right"
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer shadow-2xs active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Circular Category Cards Row - Matching Image Style */}
      <div
        id="recommended-categories-scroll"
        className="flex items-start gap-4 sm:gap-6 overflow-x-auto pt-2 pb-4 px-1 touch-pan-x overscroll-x-contain snap-x snap-mandatory scroll-smooth no-scrollbar select-none"
      >
        {categoryItems.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();

          return (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                if (onNavigate && cat.id !== 'all') {
                  // Keep user in view or smooth filter
                }
              }}
              className="group flex flex-col items-center shrink-0 cursor-pointer snap-start transition-all duration-200"
              style={{ width: '100px' }}
            >
              {/* Circular Container with Ring matching Main Site Color */}
              <div
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-xs group-hover:shadow-md transition-all duration-300 group-hover:scale-105 p-3 sm:p-4 ${
                  isSelected
                    ? 'border-3 border-[#E96BA8] ring-4 ring-[#E96BA8]/25 scale-105 bg-pink-50/80 dark:bg-pink-950/50'
                    : 'border-2 sm:border-[2.5px] border-amber-400 dark:border-amber-500/80 group-hover:border-[#E96BA8]'
                }`}
              >
                <CategoryIcon id={cat.id} name={cat.name} image={cat.image} />
              </div>

              {/* Title Label Below Circle */}
              <span
                className={`mt-2.5 sm:mt-3 text-xs sm:text-sm text-center leading-snug line-clamp-2 px-1 transition-colors ${
                  isSelected
                    ? 'font-black text-[#E96BA8] dark:text-pink-400'
                    : 'font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#E96BA8] dark:group-hover:text-pink-400'
                }`}
              >
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
