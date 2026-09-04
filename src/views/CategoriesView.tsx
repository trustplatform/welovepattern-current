import React from 'react';
import { Category } from '../types';
import { ArrowRight, BookOpen } from 'lucide-react';
import { handleImageError } from '../utils/imageUtils';

interface CategoriesViewProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onSelectCategory
}) => {
  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Explore All 13 Crochet Categories
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Browse patterns organized by craft style, wearables, home decor, and gifts.
        </p>
      </div>

      {/* Grid of Categories - 2 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="group bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {cat.count} Patterns
                </span>
              </div>

              <div className="p-4 space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#E96BA8] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 text-xs font-bold text-[#E96BA8] bg-slate-50/50 dark:bg-slate-800/50">
              <span>View Category Patterns</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
