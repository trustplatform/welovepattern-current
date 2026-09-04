import React, { useState, useEffect } from 'react';
import { Pattern, Review, Category } from '../types';
import { handleImageError } from '../utils/imageUtils';
import { CraftToolsSeoAdmin } from '../components/admin/CraftToolsSeoAdmin';
import { DownloadAnalyticsDashboard } from '../components/admin/DownloadAnalyticsDashboard';
import { PatternReviewsManager } from '../components/admin/PatternReviewsManager';
import { MailListAdmin } from '../components/admin/MailListAdmin';
import { CategoryAdmin } from '../components/admin/CategoryAdmin';
import { BlogAdmin } from '../components/admin/BlogAdmin';
import { SiteVerificationAdmin } from '../components/admin/SiteVerificationAdmin';
import { PatternSeoAdmin } from '../components/admin/PatternSeoAdmin';
import { PagesAdmin } from '../components/admin/PagesAdmin';
import { 
  ShieldCheck, 
  Grid, 
  Download, 
  Users, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Wrench, 
  CheckCircle2,
  X,
  MessageSquare,
  Star,
  Lock,
  LogOut,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  UserCheck,
  LayoutDashboard,
  FileText,
  Sparkles,
  BookOpen,
  Layers,
  Mail,
  Menu,
  ChevronRight
} from 'lucide-react';

interface AdminViewProps {
  patterns: Pattern[];
  reviews: Review[];
  onAddPattern: (pattern: Pattern) => void;
  onDeletePattern: (id: string) => void;
  onOpenPatternEditor?: (pattern?: Pattern) => void;
  onAddReview: (review: Review) => void;
  onEditReview: (review: Review) => void;
  onDeleteReview: (reviewId: string) => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  patterns,
  reviews = [],
  onAddPattern,
  onDeletePattern,
  onOpenPatternEditor,
  onAddReview,
  onEditReview,
  onDeleteReview,
  onCategoriesUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pattern-seo' | 'blog' | 'pages' | 'categories' | 'patterns' | 'reviews' | 'maillist' | 'analytics' | 'tools' | 'verification'>('dashboard');
  const [patternForReviewsModal, setPatternForReviewsModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsCheckingAuth(true);
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsAuthenticated(!!data.authenticated);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.error || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
    }
  };

  const totalDownloads = patterns.reduce((acc, p) => acc + p.downloadsCount, 0);

  // --- RENDER LOADING STATE ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#E96BA8] animate-spin" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Verifying Admin Access...</p>
      </div>
    );
  }

  // --- RENDER ADMIN LOGIN PAGE (UNAUTHENTICATED) ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] flex items-center justify-center text-white shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Admin Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enter your server credentials to access pattern management, SEO configuration, and analytics.
          </p>
        </div>

        {loginError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
          WeLovePattern Secure System Access
        </div>
      </div>
    );
  }

  type AdminTabType = 'dashboard' | 'patterns' | 'pattern-seo' | 'blog' | 'pages' | 'categories' | 'reviews' | 'maillist' | 'analytics' | 'tools' | 'verification';

  interface AdminNavItem {
    id: AdminTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }

  interface AdminNavGroup {
    title: string;
    items: AdminNavItem[];
  }

  const navGroups: AdminNavGroup[] = [
    {
      title: 'Content',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'patterns', label: 'Manage Patterns', icon: FileText, badge: patterns.length },
        { id: 'pattern-seo', label: 'Pattern SEO Content', icon: Sparkles },
        { id: 'blog', label: 'Blog CMS', icon: BookOpen },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'pages', label: 'Site Pages & Legal', icon: FileText },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'reviews', label: 'Manage Reviews', icon: MessageSquare, badge: reviews.length },
        { id: 'maillist', label: 'Mail List', icon: Mail },
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        { id: 'analytics', label: 'Download Analytics', icon: BarChart3 },
        { id: 'tools', label: 'Craft Tools Metrics', icon: Wrench },
        { id: 'verification', label: 'Site Verification', icon: ShieldCheck },
      ]
    }
  ];

  const allNavItems: AdminNavItem[] = navGroups.flatMap(g => g.items);
  const activeNavItem = allNavItems.find(item => item.id === activeTab) || allNavItems[0];
  const ActiveNavIcon = activeNavItem.icon;

  // --- RENDER ADMIN DASHBOARD (AUTHENTICATED) ---
  return (
    <div className="space-y-6">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#E96BA8]" />
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              WeLovePattern Admin &amp; SEO Publisher
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Write patterns, upload photos, manage reviews, SEO meta tags, and track analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenPatternEditor ? onOpenPatternEditor() : null}
            className="bg-[#E96BA8] hover:bg-pink-600 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Write Pattern, Add Photo &amp; SEO</span>
          </button>

          <button
            onClick={handleLogout}
            title="Log Out of Admin Dashboard"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* MOBILE ADMIN NAVIGATION BAR (< lg) */}
      <div className="lg:hidden">
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-[#E96BA8] flex items-center justify-center shrink-0">
              <ActiveNavIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">Admin Section</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">{activeNavItem.label}</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Admin Menu</span>
          </button>
        </div>

        {/* MOBILE DRAWER MODAL */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-full max-w-xs bg-white dark:bg-slate-800 shadow-2xl h-full flex flex-col z-10 border-r border-slate-200 dark:border-slate-700 animate-slideRight">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#E96BA8]" />
                  <span className="font-black text-slate-900 dark:text-white text-sm">Admin Navigation</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-700/60 hover:text-[#E96BA8]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* DESKTOP VERTICAL SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-[24px] p-3.5 shadow-sm space-y-5">
            <div className="px-3 pt-1 pb-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Admin Menu
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
            </div>

            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] text-white shadow-md shadow-pink-500/15'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50/60 dark:hover:bg-slate-700/60 hover:text-[#E96BA8] dark:hover:text-pink-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN ADMIN CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB CONTENT: PATTERN SEO CONTENT */}
          {activeTab === 'pattern-seo' && (
            <PatternSeoAdmin patterns={patterns} />
          )}

          {/* TAB CONTENT: BLOG CMS */}
          {activeTab === 'blog' && (
            <BlogAdmin />
          )}

          {/* TAB CONTENT: SITE PAGES & LEGAL CMS */}
          {activeTab === 'pages' && (
            <PagesAdmin />
          )}

          {/* TAB CONTENT: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <CategoryAdmin onCategoriesUpdated={onCategoriesUpdated} />
          )}

          {/* TAB CONTENT: SITE VERIFICATION */}
          {activeTab === 'verification' && (
            <SiteVerificationAdmin />
          )}

          {/* TAB CONTENT: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Published Patterns</span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{patterns.length}</p>
                  <span className="text-xs text-emerald-600 font-bold">+100% Free Access</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Maker Reviews</span>
                  <p className="text-3xl font-black text-[#9B7CF8]">{reviews.length}</p>
                  <span className="text-xs text-slate-500">Across all patterns</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total PDF Downloads</span>
                  <p className="text-3xl font-black text-[#E96BA8]">{totalDownloads.toLocaleString('en-US')}</p>
                  <span className="text-xs text-slate-500">Across 13 categories</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">System Status</span>
                  <p className="text-2xl font-black text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> Operational
                  </p>
                  <span className="text-xs text-slate-500">PWA &amp; Offline Ready</span>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: PATTERNS LIST */}
          {activeTab === 'patterns' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-5">Pattern Name</th>
                      <th className="py-4 px-5">Category</th>
                      <th className="py-4 px-5">Difficulty</th>
                      <th className="py-4 px-5">SEO Meta Status</th>
                      <th className="py-4 px-5">Reviews</th>
                      <th className="py-4 px-5">Downloads</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {patterns.map((p) => {
                      const patternReviewsCount = reviews.filter(r => r.patternId === p.id).length;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <img src={p.image} alt="" referrerPolicy="no-referrer" onError={(e) => handleImageError(e)} className="w-9 h-9 rounded-xl object-cover" />
                            <span>{p.title}</span>
                          </td>
                          <td className="py-3.5 px-5 capitalize">{p?.category ? p.category.replace('-', ' ') : 'General'}</td>
                          <td className="py-3.5 px-5">
                            <span className="bg-pink-100 text-[#E96BA8] text-xs font-bold px-2.5 py-1 rounded-full">
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>SEO Ready</span>
                            </span>
                          </td>

                          {/* Pattern Reviews Option Button */}
                          <td className="py-3.5 px-5">
                            <button
                              onClick={() => setPatternForReviewsModal(p.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-[#9B7CF8] dark:bg-purple-950/60 dark:text-purple-300 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                              title="See, edit, or delete reviews for this pattern"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>See Reviews ({patternReviewsCount})</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-5 font-mono">{p.downloadsCount.toLocaleString('en-US')}</td>
                          <td className="py-3.5 px-5 text-right flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenPatternEditor ? onOpenPatternEditor(p) : null}
                              className="px-3 py-1.5 text-xs font-bold bg-pink-50 text-[#E96BA8] hover:bg-pink-100 rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                              title="Edit Pattern &amp; Meta Tags"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit &amp; SEO</span>
                            </button>

                            <button
                              onClick={() => onDeletePattern(p.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                              title="Delete Pattern"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ALL REVIEWS MANAGEMENT */}
          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm">
              <PatternReviewsManager
                patterns={patterns}
                reviews={reviews}
                onAddReview={onAddReview}
                onEditReview={onEditReview}
                onDeleteReview={onDeleteReview}
              />
            </div>
          )}

          {/* TAB CONTENT: MAIL LIST SUBSCRIBERS */}
          {activeTab === 'maillist' && (
            <MailListAdmin />
          )}

          {/* TAB CONTENT: DOWNLOAD & PATTERN / TOOL ANALYTICS */}
          {activeTab === 'analytics' && (
            <DownloadAnalyticsDashboard patterns={patterns} />
          )}

          {/* TAB CONTENT: CRAFT TOOLS METRICS & SEO PUBLISHER */}
          {activeTab === 'tools' && (
            <CraftToolsSeoAdmin />
          )}
        </main>
      </div>

      {/* PATTERN SPECIFIC REVIEWS MODAL */}
      {patternForReviewsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4">
            <PatternReviewsManager
              patterns={patterns}
              reviews={reviews}
              selectedPatternId={patternForReviewsModal}
              onClose={() => setPatternForReviewsModal(null)}
              onAddReview={onAddReview}
              onEditReview={onEditReview}
              onDeleteReview={onDeleteReview}
            />
          </div>
        </div>
      )}

    </div>
  );
};

