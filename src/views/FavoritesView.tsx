import React from 'react';
import { Pattern } from '../types';
import { PatternCard } from '../components/PatternCard';
import { Heart, FolderPlus } from 'lucide-react';

interface FavoritesViewProps {
  patterns: Pattern[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectPattern: (slug: string) => void;
  onQuickDownload: (e: React.MouseEvent, pattern: Pattern) => void;
  onSharePattern?: (e: React.MouseEvent, pattern: Pattern) => void;
  onNavigate: (view: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  patterns,
  favorites,
  onToggleFavorite,
  onSelectPattern,
  onQuickDownload,
  onSharePattern,
  onNavigate
}) => {
  const favoritePatterns = patterns.filter(p => favorites.includes(p.id));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Heart className="w-8 h-8 fill-[#E96BA8] text-[#E96BA8]" />
          My Saved Favorite Patterns
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          You have {favoritePatterns.length} pattern{favoritePatterns.length !== 1 ? 's' : ''} saved in your personal collection.
        </p>
      </div>

      {favoritePatterns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritePatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              isFavorite={true}
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
            💖
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Your Favorites List is Empty
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Click the heart icon on any pattern card to save your favorite blankets, plushies, and sweaters here!
          </p>
          <button
            onClick={() => onNavigate('patterns')}
            className="bg-[#E96BA8] text-white font-bold px-6 py-3 rounded-2xl text-sm cursor-pointer"
          >
            Explore Free Patterns
          </button>
        </div>
      )}
    </div>
  );
};
