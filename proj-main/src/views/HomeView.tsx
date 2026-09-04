import React, { useState, useMemo } from 'react';
import { Pattern, Category } from '../types';
import { PatternCard } from '../components/PatternCard';
import { RecommendedCategories } from '../components/RecommendedCategories';
import { handleImageError } from '../utils/imageUtils';
import { 
  Search, 
  Sparkles, 
  Wrench, 
  ArrowRight, 
  Heart, 
  Download, 
  Star, 
  CheckCircle2, 
  Grid,
  BookOpen,
  Award,
  Layers,
  ChevronDown,
  Loader2,
  Filter
} from 'lucide-react';

interface HomeViewProps {
  patterns: Pattern[];
  categories: Category[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectPattern: (slug: string) => void;
  onQuickDownload: (e: React.MouseEvent, pattern: Pattern) => void;
  onSharePattern?: (e: React.MouseEvent, pattern: Pattern) => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenSearch: () => void;
  onOpenAIAssistant: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  patterns,
  categories,
  favorites,
  onToggleFavorite,
  onSelectPattern,
  onQuickDownload,
  onSharePattern,
  onNavigate,
  onOpenSearch,
  onOpenAIAssistant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Interleave/mix patterns by category so adjacent cards are never from the same category
  const mixedPatterns = useMemo(() => {
    if (selectedCategory === 'all') {
      const categoryMap: Record<string, Pattern[]> = {};
      patterns.forEach(p => {
        if (!categoryMap[p.category]) categoryMap[p.category] = [];
        categoryMap[p.category].push(p);
      });

      const result: Pattern[] = [];
      let lastCategory = '';

      const totalPatterns = patterns.length;
      while (result.length < totalPatterns) {
        const availableCats = Object.keys(categoryMap).filter(
          cat => categoryMap[cat].length > 0
        );

        if (availableCats.length === 0) break;

        const nonMatchingCats = availableCats.filter(cat => cat !== lastCategory);

        let chosenCat: string;
        if (nonMatchingCats.length > 0) {
          // Sort by highest remaining count so larger categories get evenly distributed
          nonMatchingCats.sort((a, b) => categoryMap[b].length - categoryMap[a].length);
          chosenCat = nonMatchingCats[0];
        } else {
          chosenCat = availableCats[0];
        }

        const nextPattern = categoryMap[chosenCat].shift();
        if (nextPattern) {
          result.push(nextPattern);
          lastCategory = chosenCat;
        }
      }
      return result;
    }
    return patterns.filter(p => 
      p.category === selectedCategory || 
      p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [patterns, selectedCategory]);

  const displayedPatterns = mixedPatterns.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 9);
      setIsLoadingMore(false);
    }, 350);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setVisibleCount(15);
    // Smooth scroll to explore patterns section if on home view
    const sectionEl = document.getElementById('explore-patterns-section');
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      
      {/* Recommended Categories Section (Circular Style matching Reference Image) */}
      <RecommendedCategories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        onNavigate={onNavigate}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-50 via-purple-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-8 sm:pt-10 pb-8 sm:pb-10 rounded-[28px] sm:rounded-[32px] border border-pink-100/80 dark:border-slate-800">
        
        {/* Soft Background Blur Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E96BA8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-[#9B7CF8]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-slate-800 text-[#E96BA8] border border-pink-200 dark:border-slate-700 shadow-sm text-[11px] sm:text-xs font-bold uppercase tracking-wider max-w-full">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9B7CF8] shrink-0" />
            <span className="text-center">100% Free Crochet Patterns & Craft Calculators</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Discover, Create & Track <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#E96BA8] via-purple-500 to-[#9B7CF8] bg-clip-text text-transparent">
              Your Dream Crochet Projects
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed px-2">
            Thousands of easy-to-read crochet patterns with step-by-step written guides, printable PDFs, and 19+ interactive craft calculators for crafters of all ages.
          </p>

          {/* Search Bar Input */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-2xl sm:rounded-[24px] shadow-xl border border-pink-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center flex-1 min-w-0 pl-2 sm:pl-3">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#E96BA8] shrink-0" />
              <input
                type="text"
                readOnly
                onClick={onOpenSearch}
                placeholder="Search patterns e.g. granny square, amigurumi..."
                className="w-full bg-transparent border-none text-slate-800 dark:text-white placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none cursor-pointer py-2 px-2"
              />
            </div>
            <button
              onClick={onOpenSearch}
              className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-[18px] transition-all cursor-pointer text-sm sm:text-base shadow-md shrink-0 flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
            >
              <Search className="w-4 h-4 sm:hidden" />
              <span>Search Patterns</span>
            </button>
          </div>

        </div>
      </section>

      {/* Main Mixed Category Patterns Showcase */}
      <section id="explore-patterns-section" className="space-y-6 scroll-mt-24">
        <div className="bg-gradient-to-r from-pink-50/60 via-purple-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80 p-5 sm:p-6 rounded-[24px] border border-pink-100/80 dark:border-slate-800">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Explore Free Crochet Patterns
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Free step-by-step PDF patterns for amigurumi, wearables, bags, and home decor.
            </p>
          </div>
        </div>

        {/* 15 Pattern Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPatterns.map((pattern, idx) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              index={idx}
              isFavorite={favorites.includes(pattern.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectPattern={onSelectPattern}
              onQuickDownload={onQuickDownload}
              onSharePattern={onSharePattern}
            />
          ))}
        </div>

        {/* Load More & Progress UI/UX Bar */}
        <div className="pt-6 pb-2 text-center space-y-4">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
              <span>Showing {Math.min(visibleCount, mixedPatterns.length)} of {mixedPatterns.length} patterns</span>
              <span>{Math.round((Math.min(visibleCount, mixedPatterns.length) / mixedPatterns.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
              <div 
                className="bg-gradient-to-r from-[#E96BA8] via-purple-500 to-[#9B7CF8] h-full rounded-full transition-all duration-500" 
                style={{ width: `${(Math.min(visibleCount, mixedPatterns.length) / mixedPatterns.length) * 100}%` }}
              />
            </div>
          </div>

          {visibleCount < mixedPatterns.length ? (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pink-500 via-[#E96BA8] to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-pink-500/25 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-75 text-sm sm:text-base group"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading More Patterns...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
                  <span>Load More Patterns ({mixedPatterns.length - visibleCount} Remaining)</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                All {mixedPatterns.length} Patterns Loaded
              </span>
              <button
                onClick={() => onNavigate('patterns')}
                className="text-[#E96BA8] hover:underline font-bold cursor-pointer"
              >
                Explore Full Pattern Library &rarr;
              </button>
            </div>
          )}
        </div>

      </section>

      {/* Craft Tools Highlight Hub */}
      <section className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-8 sm:p-12 rounded-[32px] space-y-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <span className="bg-[#E96BA8]/20 text-[#E96BA8] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              19+ Interactive Craft Calculators
            </span>
            <h2 className="text-3xl font-bold text-white mt-2">
              All-In-One Toolkit for Crochet Makers
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mt-1">
              Never get stuck calculating yardage, hook conversions, or row milestones again. Works offline!
            </p>
          </div>

          <button
            onClick={() => onNavigate('tools')}
            className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-6 py-3.5 rounded-2xl transition-colors cursor-pointer text-sm shadow-md"
          >
            Open Tools Hub
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Digital Row Counter', desc: 'Offline row logger with sound chime and vibration', icon: 'Hash', id: 'row-counter' },
            { title: 'Yarn Calculator', desc: 'Estimate skein yardage needed for blankets & sweaters', icon: 'Calculator', id: 'yarn-calculator' },
            { title: 'Gauge Calculator', desc: 'Calculate exact starting chain stitch adjustments', icon: 'Ruler', id: 'gauge-calculator' },
            { title: 'Selling Price Calculator', desc: 'Fair retail price formula for Etsy craft makers', icon: 'Tag', id: 'selling-price-calculator' }
          ].map((t) => (
            <div
              key={t.id}
              onClick={() => onNavigate('tools', t.id)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 p-5 rounded-[20px] space-y-3 cursor-pointer transition-all hover:border-[#E96BA8]"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

