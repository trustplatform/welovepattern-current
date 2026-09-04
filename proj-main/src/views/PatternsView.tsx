import React, { useState, useEffect } from 'react';
import { Pattern, Difficulty, Category } from '../types';
import { PatternCard } from '../components/PatternCard';
import { Search, Filter, SlidersHorizontal, RotateCcw, BookOpen } from 'lucide-react';

interface PatternsViewProps {
  patterns: Pattern[];
  categories?: Category[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectPattern: (slug: string) => void;
  onQuickDownload: (e: React.MouseEvent, pattern: Pattern) => void;
  onSharePattern?: (e: React.MouseEvent, pattern: Pattern) => void;
  initialCategory?: string;
}

export const PatternsView: React.FC<PatternsViewProps> = ({
  patterns,
  categories = [],
  favorites,
  onToggleFavorite,
  onSelectPattern,
  onQuickDownload,
  onSharePattern,
  initialCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'downloads' | 'rating'>('popular');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch = 
      pattern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = selectedDifficulty === 'All' || pattern.difficulty === selectedDifficulty;
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      selectedCategory === 'all' || 
      pattern.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesDifficulty && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'downloads') return b.downloadsCount - a.downloadsCount;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewCount - a.reviewCount; // popular default
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedCategory('All');
    setSortBy('popular');
  };

  const categoryOptions = [
    { id: 'All', name: 'All Categories' },
    ...categories.map(c => ({ id: c.id, name: c.name }))
  ];

  return (
    <div className="space-y-8">
      
      {/* View Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Browse Free Crochet Patterns
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Showing {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''} with printable PDF downloads
        </p>
      </div>

      {/* Search & Filter Control Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search patterns by title, yarn, hook size, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pl-12 pr-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold px-4 py-3 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="popular">Sort by: Popularity</option>
              <option value="newest">Sort by: Newest Released</option>
              <option value="downloads">Sort by: Most Downloads</option>
              <option value="rating">Sort by: Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          
          {/* Categories Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-[#E96BA8]" /> Category:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {categoryOptions.map((cat) => {
                const isSelected = 
                  selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
                  (selectedCategory === 'All' && cat.id === 'All');
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E96BA8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filter & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#E96BA8]" /> Difficulty:
              </span>
              {['All', 'Beginner', 'Easy', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-[#E96BA8] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {(searchQuery || selectedDifficulty !== 'All' || (selectedCategory !== 'All' && selectedCategory !== 'all')) && (
              <button
                onClick={handleResetFilters}
                className="text-[#E96BA8] font-bold flex items-center gap-1 hover:underline cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Patterns Grid */}
      {filteredPatterns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map((pattern, idx) => (
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
      ) : (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[24px] text-center space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-[#E96BA8] flex items-center justify-center mx-auto text-3xl">
            🧶
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No patterns matched your filter criteria
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Try searching with broader terms or clear your active difficulty & category filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="bg-[#E96BA8] text-white font-bold px-6 py-3 rounded-2xl text-sm cursor-pointer"
          >
            Show All Patterns
          </button>
        </div>
      )}

    </div>
  );
};
