/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Pattern, Category, Review, PatternSeoArticle, SitePage } from './types';
import { PATTERNS_DATA } from './data/patternsData';
import { CATEGORIES_DATA } from './data/categoriesData';
import { INITIAL_REVIEWS_DATA } from './data/reviewsData';
import { TOOLS_DATA } from './data/toolsData';
import { BLOG_DATA } from './data/blogData';
import { DEFAULT_SITE_PAGES } from './data/defaultSitePages';
import { parsePathname, getPathnameForView } from './utils/seoRouting';
import { updateHeadMetaTags } from './utils/seoUtils';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { SearchModal } from './components/SearchModal';
import { AICrochetAssistantModal } from './components/AICrochetAssistantModal';
import { ShareModal } from './components/ShareModal';
import { PatternEditorModal } from './components/PatternEditorModal';

import { HomeView } from './views/HomeView';
import { PatternsView } from './views/PatternsView';
import { PatternDetailView } from './views/PatternDetailView';
import { CategoriesView } from './views/CategoriesView';
import { ToolsView } from './views/ToolsView';
import { BlogView } from './views/BlogView';
import { SitePageView } from './views/SitePageView';
import { FavoritesView } from './views/FavoritesView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { NotFoundView } from './views/NotFoundView';

interface AppProps {
  initialPath?: string;
  initialBlogPosts?: any[];
  initialCategories?: Category[];
  initialPatternSeoArticles?: PatternSeoArticle[];
  initialSitePages?: SitePage[];
  initialPatterns?: Pattern[];
}

export default function App({ initialPath, initialBlogPosts, initialCategories, initialPatternSeoArticles, initialSitePages, initialPatterns }: AppProps) {
  const getInitialPatterns = (): Pattern[] => {
    if (initialPatterns && Array.isArray(initialPatterns) && initialPatterns.length > 0) {
      return initialPatterns;
    }
    if (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__?.patterns) {
      return (window as any).__INITIAL_DATA__.patterns;
    }
    return PATTERNS_DATA;
  };

  const getInitialCategories = (): Category[] => {
    if (initialCategories && Array.isArray(initialCategories) && initialCategories.length > 0) {
      return initialCategories;
    }
    if (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__?.categories) {
      return (window as any).__INITIAL_DATA__.categories;
    }
    return CATEGORIES_DATA;
  };

  const getInitialBlogPosts = () => {
    if (initialBlogPosts && Array.isArray(initialBlogPosts) && initialBlogPosts.length > 0) {
      return initialBlogPosts;
    }
    if (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__?.blogPosts) {
      return (window as any).__INITIAL_DATA__.blogPosts;
    }
    return undefined;
  };

  const getInitialPatternSeoArticles = (): PatternSeoArticle[] => {
    if (initialPatternSeoArticles && Array.isArray(initialPatternSeoArticles) && initialPatternSeoArticles.length > 0) {
      return initialPatternSeoArticles;
    }
    if (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__?.patternSeoArticles) {
      return (window as any).__INITIAL_DATA__.patternSeoArticles;
    }
    return [];
  };

  const getInitialSitePages = (): SitePage[] => {
    if (initialSitePages && Array.isArray(initialSitePages) && initialSitePages.length > 0) {
      return initialSitePages;
    }
    if (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__?.sitePages) {
      return (window as any).__INITIAL_DATA__.sitePages;
    }
    return DEFAULT_SITE_PAGES;
  };

  const [patterns, setPatterns] = useState<Pattern[]>(getInitialPatterns);
  const [categories, setCategories] = useState<Category[]>(getInitialCategories);
  const [blogPosts, setBlogPosts] = useState<any[] | undefined>(getInitialBlogPosts);
  const [patternSeoArticles, setPatternSeoArticles] = useState<PatternSeoArticle[]>(getInitialPatternSeoArticles);
  const [sitePages, setSitePages] = useState<SitePage[]>(getInitialSitePages);

  // Load public patterns, categories, published pattern SEO articles, and site pages from server API if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/patterns')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.patterns || []);
          if (Array.isArray(list) && list.length > 0) {
            setPatterns(list);
          }
        })
        .catch(err => {
          console.warn('Could not load patterns from API, using default patterns.', err);
        });

      fetch('/api/categories')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        })
        .catch(err => {
          console.warn('Could not load categories from API, using default static categories.', err);
        });

      fetch('/api/pattern-seo')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            setPatternSeoArticles(data);
          }
        })
        .catch(err => {
          console.warn('Could not load pattern SEO articles from API.', err);
        });

      fetch('/api/pages')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            setSitePages(data);
          }
        })
        .catch(err => {
          console.warn('Could not load site pages from API, using default pages.', err);
        });
    }
  }, []);

  // Parse initial route state safely for both SSR and Client
  const getInitialRouteState = () => {
    const path = initialPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    return parsePathname(
      path, 
      initialBlogPosts, 
      initialCategories, 
      initialSitePages, 
      initialPatterns || (typeof window !== 'undefined' ? (window as any).__INITIAL_DATA__?.patterns : undefined)
    );
  };

  const initialRoute = getInitialRouteState();

  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [selectedPatternSlug, setSelectedPatternSlug] = useState<string | null>(initialRoute.patternSlug || null);
  const [selectedCategoryParam, setSelectedCategoryParam] = useState<string | undefined>(initialRoute.categoryParam);
  const [selectedToolParam, setSelectedToolParam] = useState<string | undefined>(initialRoute.toolParam);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | undefined>(initialRoute.blogParam);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | undefined>(initialRoute.pageSlug);

  // Reviews state with localStorage persistence
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS_DATA);
  const reviewsLoadedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('welovepattern_reviews');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews(parsed);
          }
        } catch (e) {}
      }
      reviewsLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && reviewsLoadedRef.current) {
      localStorage.setItem('welovepattern_reviews', JSON.stringify(reviews));
    }
  }, [reviews]);

  const handleAddReview = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
  };

  const handleEditReview = (updatedReview: Review) => {
    setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  // Favorites state saved in localStorage
  const [favorites, setFavorites] = useState<string[]>(['p1', 'p2']);
  const favoritesLoadedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crochethub_favorites');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        } catch (e) {}
      }
      favoritesLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && favoritesLoadedRef.current) {
      localStorage.setItem('crochethub_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // Modals
  const [activeDownloadPattern, setActiveDownloadPattern] = useState<Pattern | null>(null);
  const [activeSharePattern, setActiveSharePattern] = useState<Pattern | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [patternEditorOpen, setPatternEditorOpen] = useState(false);
  const [patternToEdit, setPatternToEdit] = useState<Pattern | null>(null);

  // Admin Session Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAdminAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdminAuthenticated(!!data.authenticated);
        } else {
          setIsAdminAuthenticated(false);
        }
      } catch (err) {
        setIsAdminAuthenticated(false);
      }
    };

    checkAdminAuth();
  }, [currentView]);

  const handleOpenPatternEditor = (pattern?: Pattern) => {
    setPatternToEdit(pattern || null);
    setPatternEditorOpen(true);
  };

  const handleSavePatternFromModal = (savedPattern: Pattern) => {
    setPatterns(prev => {
      const idx = prev.findIndex(p => p.id === savedPattern.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedPattern;
        return copy;
      }
      return [savedPattern, ...prev];
    });
  };

  // Accessibility & Dark mode
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const darkModeLoadedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crochethub_theme');
      if (saved === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      darkModeLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && darkModeLoadedRef.current) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('crochethub_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('crochethub_theme', 'light');
      }
    }
  }, [darkMode]);

  // Handle browser popstate navigation (back / forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const route = parsePathname(window.location.pathname);
      setCurrentView(route.view);
      setSelectedPatternSlug(route.patternSlug || null);
      setSelectedCategoryParam(route.categoryParam);
      setSelectedToolParam(route.toolParam);
      setSelectedBlogSlug(route.blogParam);
      setSelectedPageSlug(route.pageSlug);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update client-side meta tags on navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    const route = parsePathname(pathname);
    const origin = window.location.origin;

    let metaTitle = 'WeLovePattern - Free Crochet Patterns & Tools';
    let metaDesc = 'Explore 100% free crochet patterns, 19+ interactive craft calculators, row counters, yarn converters, and step-by-step guides for makers of all ages.';
    let metaImage = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80';

    if (route.view === 'pattern-detail' && selectedPatternSlug) {
      const pattern = patterns.find(p => p.slug === selectedPatternSlug) || patterns[0];
      if (pattern) {
        metaTitle = `${pattern.title} - Free Crochet Pattern`;
        metaDesc = pattern.seoMeta?.metaDescription || pattern.subtitle || pattern.description;
        metaImage = pattern.image;
      }
    } else if (route.view === 'patterns' && selectedCategoryParam) {
      const category = categories.find(c => c.id === selectedCategoryParam);
      if (category) {
        metaTitle = `Free ${category.name} Crochet Patterns`;
        metaDesc = category.description;
        metaImage = category.image;
      }
    } else if (route.view === 'tools' && selectedToolParam) {
      const tool = TOOLS_DATA.find(t => t.slug === selectedToolParam);
      if (tool) {
        metaTitle = `${tool.title} - Free Craft Tool`;
        metaDesc = tool.description;
      }
    } else if (route.view === 'blog' && selectedBlogSlug) {
      const post = BLOG_DATA.find(b => b.slug === selectedBlogSlug);
      if (post) {
        metaTitle = `${post.title} - Crochet Guide`;
        metaDesc = post.excerpt;
        metaImage = post.image;
      }
    } else if (route.view === 'page' && selectedPageSlug) {
      const page = sitePages.find(p => p.slug === selectedPageSlug || p.id === selectedPageSlug) || DEFAULT_SITE_PAGES.find(p => p.slug === selectedPageSlug || p.id === selectedPageSlug);
      if (page) {
        metaTitle = page.seoTitle || `${page.title} | WeLovePattern`;
        metaDesc = page.seoDescription || `Read ${page.title} on WeLovePattern. 100% free crochet patterns, craft tools, and guides.`;
      }
    }

    updateHeadMetaTags({
      title: metaTitle,
      description: metaDesc,
      image: metaImage,
      url: `${origin}${pathname}`
    });
  }, [currentView, selectedPatternSlug, selectedCategoryParam, selectedToolParam, selectedBlogSlug, selectedPageSlug, sitePages]);

  // Handle navigation actions
  const handleNavigate = (view: string, param?: string) => {
    const newPath = getPathnameForView(view, param);
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setCurrentView(view);
    if (view === 'home') {
      setSelectedPatternSlug(null);
      setSelectedCategoryParam(undefined);
      setSelectedToolParam(undefined);
      setSelectedBlogSlug(undefined);
      setSelectedPageSlug(undefined);
    } else if (view === 'pattern-detail') {
      setSelectedPatternSlug(param || null);
    } else if (view === 'categories') {
      setSelectedPatternSlug(null);
      if (param) {
        setSelectedCategoryParam(param);
        setCurrentView('patterns');
      } else {
        setSelectedCategoryParam(undefined);
      }
    } else if (view === 'patterns') {
      setSelectedPatternSlug(null);
      setSelectedCategoryParam(param || undefined);
    } else if (view === 'tools') {
      setSelectedPatternSlug(null);
      setSelectedToolParam(param || undefined);
    } else if (view === 'blog') {
      setSelectedPatternSlug(null);
      setSelectedBlogSlug(param || undefined);
    } else if (view === 'page') {
      setSelectedPatternSlug(null);
      setSelectedPageSlug(param || 'privacy-policy');
    } else {
      setSelectedPatternSlug(null);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectPattern = (slug: string) => {
    const newPath = `/pattern/${slug}`;
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSelectedPatternSlug(slug);
    setCurrentView('pattern-detail');
  };

  const handleQuickDownload = (e: React.MouseEvent, pattern: Pattern) => {
    e.stopPropagation();
    setActiveDownloadPattern(pattern);
  };

  const handleSharePattern = (e: React.MouseEvent, pattern: Pattern) => {
    e.stopPropagation();
    setActiveSharePattern(pattern);
  };

  const handleAddPattern = (newPattern: Pattern) => {
    setPatterns(prev => {
      const idx = prev.findIndex(p => p.id === newPattern.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newPattern;
        return copy;
      }
      return [newPattern, ...prev];
    });
  };

  const handleDeletePattern = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this pattern?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/patterns/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setPatterns(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete pattern.');
      }
    } catch (err) {
      console.error('Error deleting pattern:', err);
      setPatterns(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDownloadSuccess = (patternId: string) => {
    setPatterns(patterns.map(p => 
      p.id === patternId ? { ...p, downloadsCount: p.downloadsCount + 1 } : p
    ));
  };

  // Font size multiplier class for 40-70+ elderly accessibility
  const fontSizeClass = 
    fontSizeLevel === 2 ? 'text-lg' :
    fontSizeLevel === 1 ? 'text-base' : '';

  const activePatternObj = patterns.find(p => p.slug === selectedPatternSlug) || patterns[0];
  const activeSeoArticle = patternSeoArticles.find(
    a => (a.patternId === activePatternObj.id || a.patternSlug === activePatternObj.slug || a.patternId === activePatternObj.slug) && a.status === 'published'
  ) || null;

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 ${fontSizeClass}`}>
      
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAIAssistant={() => setAiAssistantOpen(true)}
        onOpenPatternEditor={isAdminAuthenticated ? () => handleOpenPatternEditor() : undefined}
        fontSizeLevel={fontSizeLevel}
        setFontSizeLevel={setFontSizeLevel}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {currentView === 'home' && (
          <HomeView
            patterns={patterns}
            categories={categories}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPattern={handleSelectPattern}
            onQuickDownload={handleQuickDownload}
            onSharePattern={handleSharePattern}
            onNavigate={handleNavigate}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenAIAssistant={() => setAiAssistantOpen(true)}
          />
        )}

        {currentView === 'patterns' && (
          <PatternsView
            patterns={patterns}
            categories={categories}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPattern={handleSelectPattern}
            onQuickDownload={handleQuickDownload}
            onSharePattern={handleSharePattern}
            initialCategory={selectedCategoryParam}
          />
        )}

        {currentView === 'pattern-detail' && (
          <PatternDetailView
            pattern={activePatternObj}
            allPatterns={patterns}
            reviews={reviews}
            seoArticle={activeSeoArticle}
            isFavorite={favorites.includes(activePatternObj.id)}
            onToggleFavorite={handleToggleFavorite}
            onQuickDownload={handleQuickDownload}
            onSelectPattern={handleSelectPattern}
            onNavigate={handleNavigate}
            onOpenPatternEditor={isAdminAuthenticated ? handleOpenPatternEditor : undefined}
            onAddReview={handleAddReview}
            onEditReview={isAdminAuthenticated ? handleEditReview : undefined}
            onDeleteReview={isAdminAuthenticated ? handleDeleteReview : undefined}
            isAdmin={isAdminAuthenticated}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesView
            categories={categories}
            onSelectCategory={(catId) => {
              setSelectedCategoryParam(catId);
              setCurrentView('patterns');
            }}
          />
        )}

        {currentView === 'tools' && (
          <ToolsView initialToolId={selectedToolParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'not-found' && (
          <NotFoundView onNavigate={handleNavigate} />
        )}

        {currentView === 'blog' && (
          <BlogView initialPosts={blogPosts || initialBlogPosts} initialSlug={selectedBlogSlug} />
        )}

        {currentView === 'page' && (
          <SitePageView
            page={sitePages.find(p => p.slug === selectedPageSlug || p.id === selectedPageSlug) || DEFAULT_SITE_PAGES.find(p => p.slug === selectedPageSlug || p.id === selectedPageSlug) || sitePages[0] || DEFAULT_SITE_PAGES[0]}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'favorites' && (
          <FavoritesView
            patterns={patterns}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPattern={handleSelectPattern}
            onQuickDownload={handleQuickDownload}
            onSharePattern={handleSharePattern}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            favoritesCount={favorites.length}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            patterns={patterns}
            reviews={reviews}
            onAddPattern={handleAddPattern}
            onDeletePattern={handleDeletePattern}
            onOpenPatternEditor={handleOpenPatternEditor}
            onAddReview={handleAddReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onCategoriesUpdated={(updated) => setCategories(updated)}
          />
        )}

      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals */}
      <PatternEditorModal
        isOpen={patternEditorOpen && isAdminAuthenticated}
        onClose={() => setPatternEditorOpen(false)}
        onSavePattern={handleSavePatternFromModal}
        initialPattern={patternToEdit}
      />

      <DownloadModal
        pattern={activeDownloadPattern}
        onClose={() => setActiveDownloadPattern(null)}
        onDownloadSuccess={handleDownloadSuccess}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        patterns={patterns}
        onSelectPattern={handleSelectPattern}
      />

      <AICrochetAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />

      {activeSharePattern && (
        <ShareModal
          isOpen={!!activeSharePattern}
          onClose={() => setActiveSharePattern(null)}
          title={activeSharePattern.title}
          description={activeSharePattern.description}
          imageUrl={activeSharePattern.image}
          url={typeof window !== 'undefined' ? `${window.location.origin}/pattern/${activeSharePattern.slug}` : `https://welovepattern.com/pattern/${activeSharePattern.slug}`}
        />
      )}

    </div>
  );
}
