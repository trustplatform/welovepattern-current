import React from 'react';
import { Search, Wrench, FileText, Home, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-3xl bg-pink-50 dark:bg-pink-950/60 text-[#E96BA8] flex items-center justify-center mx-auto text-2xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Page or Tool Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Sorry, the page or craft tool you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <a
            href="/tools"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('tools');
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#E96BA8] hover:bg-[#d55895] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Wrench className="w-4 h-4" />
            <span>Explore All 19 Craft Tools</span>
          </a>

          <a
            href="/patterns"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('patterns');
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#E96BA8]" />
            <span>Browse Free Crochet Patterns</span>
          </a>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </a>
        </div>

      </div>
    </div>
  );
};
