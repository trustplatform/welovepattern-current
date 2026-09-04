import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  Wrench, 
  Grid, 
  BookOpen, 
  User, 
  Sparkles, 
  Menu, 
  X, 
  Type, 
  Moon, 
  Sun,
  FolderHeart
} from 'lucide-react';

import { getPathnameForView } from '../utils/seoRouting';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  favoritesCount: number;
  onOpenSearch: () => void;
  onOpenAIAssistant?: () => void;
  onOpenPatternEditor?: () => void;
  fontSizeLevel: number;
  setFontSizeLevel: (fn: (prev: number) => number) => void;
  darkMode: boolean;
  setDarkMode: (fn: (prev: boolean) => boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
  onOpenSearch,
  onOpenAIAssistant,
  onOpenPatternEditor,
  fontSizeLevel,
  setFontSizeLevel,
  darkMode,
  setDarkMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'patterns', label: 'Patterns', icon: Grid },
    { id: 'categories', label: 'Categories', icon: BookOpen },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'blog', label: 'Blog', icon: BookOpen },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : null },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-pink-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E96BA8] rounded-xl p-1 max-w-[55%] sm:max-w-none decoration-none"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl sm:rounded-[16px] bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] flex items-center justify-center text-white text-lg sm:text-2xl shadow-sm group-hover:scale-105 transition-transform">
              🧶
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] bg-clip-text text-transparent tracking-tight truncate block">
                WeLovePattern
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Free Patterns & Interactive Tools
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (currentView === 'pattern-detail' && link.id === 'patterns');
              return (
                <a
                  key={link.id}
                  href={getPathnameForView(link.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer decoration-none ${
                    isActive
                      ? 'bg-[#E96BA8] text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:text-[#E96BA8] dark:hover:text-[#E96BA8] hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && (
                    <span className="ml-1 bg-[#9B7CF8] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Search crochet patterns"
              className="flex items-center gap-2 bg-pink-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-pink-100 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-full border border-pink-200 dark:border-slate-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#E96BA8]" />
              <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400">Search...</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              aria-label="Toggle light and dark mode"
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-base cursor-pointer ${
                  isActive
                    ? 'bg-[#E96BA8] text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </div>
                {link.badge !== null && link.badge !== undefined && (
                  <span className="bg-[#9B7CF8] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
