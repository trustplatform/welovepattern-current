import React, { useState } from 'react';
import { ABBREVIATIONS_DATA } from '../../data/abbreviationsData';
import { Search, BookMarked, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export const AbbreviationDictionaryTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  const filtered = ABBREVIATIONS_DATA.filter((item) => {
    const matchesQuery = 
      item.usTerm.toLowerCase().includes(query.toLowerCase()) ||
      item.ukTerm.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase());
    
    const matchesDiff = filterDifficulty === 'All' || item.difficulty === filterDifficulty;
    return matchesQuery && matchesDiff;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white p-6 sm:p-8 rounded-[24px] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                US vs. UK Stitch Dictionary
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Crochet Abbreviation Dictionary
            </h2>
            <p className="text-pink-100 text-sm mt-1">
              Search any stitch code, convert American vs. British terms, and read execution tips.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
            <BookMarked className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search abbreviation e.g. sc, hdc, magic ring, popcorn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white pl-12 pr-4 py-3 rounded-2xl text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
            />
          </div>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold px-4 py-3 rounded-2xl text-sm border border-slate-200 dark:border-slate-700"
          >
            <option value="All">All Skill Levels</option>
            <option value="Basic">Basic Stitches</option>
            <option value="Intermediate">Intermediate Stitches</option>
            <option value="Advanced">Advanced Stitches</option>
          </select>
        </div>
      </div>

      {/* Dictionary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <div 
            key={idx}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5 rounded-[20px] shadow-sm hover:shadow-md transition-shadow space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {item.name}
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  Difficulty: {item.difficulty}
                </span>
              </div>
              {item.symbol && (
                <span className="bg-pink-50 text-[#E96BA8] dark:bg-slate-700 dark:text-pink-300 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                  {item.symbol}
                </span>
              )}
            </div>

            {/* US vs UK Badges */}
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 px-3 py-1 rounded-full font-black">
                US: <span className="underline">{item.usTerm}</span>
              </div>

              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />

              <div className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-3 py-1 rounded-full font-black">
                UK: <span className="underline">{item.ukTerm}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};
