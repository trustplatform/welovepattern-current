import React, { useState } from 'react';
import { TOOLS_DATA } from '../data/toolsData';
import { RowCounterTool } from '../components/tools/RowCounterTool';
import { GaugeCalculatorTool } from '../components/tools/GaugeCalculatorTool';
import { YarnCalculatorTool } from '../components/tools/YarnCalculatorTool';
import { HookSizeConverterTool } from '../components/tools/HookSizeConverterTool';
import { SellingPriceCalculatorTool } from '../components/tools/SellingPriceCalculatorTool';
import { AbbreviationDictionaryTool } from '../components/tools/AbbreviationDictionaryTool';
import { OtherToolsContainer } from '../components/tools/OtherToolsContainer';
import { ToolSeoArticleView } from '../components/tools/ToolSeoArticleView';
import { 
  Wrench, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Sparkles, 
  BookMarked, 
  CheckCircle2, 
  ArrowLeft,
  Grid,
  Calculator,
  Hash,
  Ruler,
  DollarSign,
  Palette,
  Timer,
  Scale,
  Layers,
  FolderHeart,
  Clock,
  Zap
} from 'lucide-react';

interface ToolsViewProps {
  initialToolId?: string;
  onNavigate: (view: any, param?: any) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ initialToolId, onNavigate }) => {
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(initialToolId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSwitcherExpanded, setIsSwitcherExpanded] = useState<boolean>(true);

  React.useEffect(() => {
    setActiveToolSlug(initialToolId || null);
  }, [initialToolId]);

  const handleSelectTool = (slug: string | null) => {
    setActiveToolSlug(slug);
    if (slug) {
      onNavigate('tools', slug);
    } else {
      onNavigate('tools');
    }
  };

  // Categories list
  const categoriesList = ['all', 'Counter', 'Calculator', 'Converter', 'Organizer', 'Reference'];

  const filteredTools = TOOLS_DATA.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === 'all' || 
      t.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const activeToolObj = TOOLS_DATA.find(t => t.slug === activeToolSlug);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'counter': return <Hash className="w-3.5 h-3.5" />;
      case 'calculator': return <Calculator className="w-3.5 h-3.5" />;
      case 'converter': return <Ruler className="w-3.5 h-3.5" />;
      case 'organizer': return <FolderHeart className="w-3.5 h-3.5" />;
      case 'reference': return <BookMarked className="w-3.5 h-3.5" />;
      default: return <Wrench className="w-3.5 h-3.5" />;
    }
  };

  // Render individual active interactive tool component
  const renderActiveToolComponent = () => {
    if (!activeToolSlug) return null;

    switch (activeToolSlug) {
      case 'row-counter':
      case 'stitch-counter':
        return <RowCounterTool />;
      case 'gauge-calculator':
        return <GaugeCalculatorTool />;
      case 'yarn-calculator':
      case 'yarn-substitute':
        return <YarnCalculatorTool />;
      case 'hook-size-converter':
        return <HookSizeConverterTool />;
      case 'selling-price-calculator':
        return <SellingPriceCalculatorTool />;
      case 'abbreviation-dictionary':
        return <AbbreviationDictionaryTool />;
      default:
        return <OtherToolsContainer toolId={activeToolSlug} activeToolSlug={activeToolSlug} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#E96BA8] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Maker Utilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Free Crochet Craft Tools & Calculators
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            19 free interactive calculators, row counters, size converters, and planning tools engineered specifically for yarn crafters. 100% offline-ready.
          </p>
        </div>

        {activeToolSlug && (
          <button
            onClick={() => handleSelectTool(null)}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All 19 Tools</span>
          </button>
        )}
      </div>

      {/* If a tool is active, render the tool view with full non-scrolling wrap buttons switcher */}
      {activeToolSlug ? (
        <div className="space-y-6">
          
          {/* Active Tool Header & Quick Switcher Container */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center font-bold shadow-xs">
                  {activeToolObj ? getCategoryIcon(activeToolObj.category) : <Wrench className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E96BA8] bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded-full">
                      {activeToolObj?.category || 'Craft Tool'}
                    </span>
                    <span className="text-xs text-slate-400">/tools/{activeToolSlug}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeToolObj?.title || 'Interactive Tool'}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsSwitcherExpanded(!isSwitcherExpanded)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#E96BA8] dark:hover:text-[#E96BA8] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 transition-colors cursor-pointer self-end sm:self-auto"
              >
                <Grid className="w-3.5 h-3.5 text-[#E96BA8]" />
                <span>{isSwitcherExpanded ? 'Hide Tool Switcher' : 'Switch Tool (19)'}</span>
                {isSwitcherExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Non-Scrolling Responsive Wrap Button Grid */}
            {isSwitcherExpanded && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Select Any Tool Below (1-Click Switch)</span>
                  <span>19 Tools Available</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TOOLS_DATA.map((t) => {
                    const isActive = activeToolSlug === t.slug;
                    return (
                      <a
                        key={t.id}
                        href={`/tools/${t.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectTool(t.slug);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-[#E96BA8] text-white shadow-md ring-2 ring-pink-300 dark:ring-pink-800 scale-[1.02]'
                            : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-[#E96BA8] border border-slate-200/60 dark:border-slate-600/50'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-[#E96BA8]'}>
                          {getCategoryIcon(t.category)}
                        </span>
                        <span>{t.title}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Tool Interactive Engine */}
          <div className="transition-all duration-300">
            {renderActiveToolComponent()}
          </div>

          {/* SEO Content & In-Depth Craft Guide for this specific tool */}
          {activeToolObj && (
            <ToolSeoArticleView 
              tool={activeToolObj} 
              onSelectRelatedTool={(slug) => handleSelectTool(slug)} 
            />
          )}

        </div>
      ) : (
        /* Tools Catalog View */
        <div className="space-y-6">
          
          {/* Controls Bar: Search & Category Filter Buttons */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search 19 craft tools e.g. row counter, gauge, yarn cost..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Showing <span className="font-bold text-slate-900 dark:text-white">{filteredTools.length}</span> of {TOOLS_DATA.length} Tools
              </div>
            </div>

            {/* Category Filter Buttons - Wrapped, No Scrolling Required */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              {categoriesList.map((cat) => {
                const count = cat === 'all' 
                  ? TOOLS_DATA.length 
                  : TOOLS_DATA.filter(t => t.category.toLowerCase() === cat.toLowerCase()).length;
                const isSelected = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#E96BA8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="capitalize">{cat === 'all' ? 'All Categories' : cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools Grid - Responsive for Mobile (1-col), Tablet (2-col), Desktop (3/4-col) */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTools.map((t) => (
                <a
                  key={t.id}
                  href={`/tools/${t.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectTool(t.slug);
                  }}
                  className="group bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 hover:border-[#E96BA8] active:scale-[0.99]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E96BA8] to-[#9B7CF8] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                        {getCategoryIcon(t.category)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {t.category}
                        </span>
                        {t.isOfflineCapable && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#E96BA8] transition-colors line-clamp-1">
                        {t.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    </div>
                  </div>

                  <div className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 group-hover:bg-[#E96BA8] group-hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer">
                    <span>Open Interactive Tool</span>
                    <span>→</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-12 text-center rounded-2xl space-y-3">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">No tools found matching "{searchQuery}"</h3>
              <p className="text-xs text-slate-400">Try searching for "counter", "gauge", "yarn", "converter", or select "All Categories".</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('all'); }}
                className="px-4 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-[#E96BA8] text-xs font-bold cursor-pointer hover:bg-pink-100"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
