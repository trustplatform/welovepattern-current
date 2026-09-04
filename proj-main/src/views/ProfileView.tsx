import React from 'react';
import { User, Award, CheckCircle2, Bookmark, FolderHeart, Clock, Wrench } from 'lucide-react';

interface ProfileViewProps {
  favoritesCount: number;
  onNavigate: (view: string, param?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ favoritesCount, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 sm:p-8 rounded-[24px] shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center text-4xl font-bold shadow-md border-4 border-white dark:border-slate-700 shrink-0">
          🧶
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Crochet Artisan
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Master Maker
            </span>
          </div>
          <p className="text-sm text-slate-500">Member since 2026 • Crafting Level: Intermediate</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2 text-xs">
            <span className="bg-pink-50 text-[#E96BA8] dark:bg-slate-700 dark:text-pink-300 font-bold px-3 py-1 rounded-full">
              {favoritesCount} Saved Patterns
            </span>
            <span className="bg-purple-50 text-[#9B7CF8] dark:bg-slate-700 dark:text-purple-300 font-bold px-3 py-1 rounded-full">
              12 Projects Completed
            </span>
          </div>
        </div>
      </div>

      {/* Craft Badges & Achievements */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-[24px] space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Makers Badges & Craft Achievements
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-1">🏅</div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Granny Master</p>
            <p className="text-[11px] text-slate-400">Crocheted 50+ squares</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-1">🧸</div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Plushie Maker</p>
            <p className="text-[11px] text-slate-400">First Amigurumi toy</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-1">⏱️</div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Row Counter Hero</p>
            <p className="text-[11px] text-slate-400">Log 500+ rows offline</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-3xl mb-1">📐</div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Gauge Swatch Expert</p>
            <p className="text-[11px] text-slate-400">Checked swatch gauge</p>
          </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('favorites')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-[20px] flex items-center gap-4 cursor-pointer hover:border-[#E96BA8] transition-colors"
        >
          <div className="p-3 bg-pink-100 text-[#E96BA8] rounded-xl">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 dark:text-white text-base">Saved Favorites</p>
            <p className="text-xs text-slate-400">Access your saved pattern downloads</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('tools', 'project-tracker')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-[20px] flex items-center gap-4 cursor-pointer hover:border-[#9B7CF8] transition-colors"
        >
          <div className="p-3 bg-purple-100 text-[#9B7CF8] rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 dark:text-white text-base">Active WIP Projects</p>
            <p className="text-xs text-slate-400">Track progress & hook notes</p>
          </div>
        </button>
      </div>

    </div>
  );
};
