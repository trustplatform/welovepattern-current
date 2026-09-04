import React, { useState } from 'react';
import { Pattern } from '../types';
import { Search, X, Star, Download, Sparkles, Filter } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  patterns: Pattern[];
  onSelectPattern: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  patterns,
  onSelectPattern
}) => {
  const [query, setQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  if (!isOpen) return null;

  const results = patterns.filter((p) => {
    const matchesQuery = 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      p.yarnWeight.toLowerCase().includes(query.toLowerCase()) ||
      p.hookSize.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;

    return matchesQuery && matchesDiff && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 rounded-[24px] max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[#E96BA8] font-bold">
            <Search className="w-5 h-5" />
            <span>Instant Pattern Search</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            autoFocus
            placeholder="Search by pattern name, granny square, amigurumi bear, 5.0mm hook..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-12 pr-4 py-3 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 self-center">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['All', 'Beginner', 'Easy', 'Intermediate'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                difficultyFilter === diff
                  ? 'bg-[#E96BA8] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Results Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-2">
          {results.length > 0 ? (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPattern(p.slug);
                  onClose();
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-4 cursor-pointer transition-colors border border-slate-200/60 dark:border-slate-700"
              >
                <img src={p.image} alt="" referrerPolicy="no-referrer" onError={(e) => handleImageError(e)} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.subtitle}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="text-[#E96BA8] font-bold">{p.difficulty}</span>
                    <span>• Hook: {p.hookSize.split(' ')[0]}</span>
                    <span>• {p.downloadsCount.toLocaleString('en-US')} downloads</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No patterns matching "{query}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
