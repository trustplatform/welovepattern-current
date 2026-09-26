import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  FileText,
  Share2,
  Lock,
  Globe,
  Loader2
} from 'lucide-react';
import { SeoEngineConfig } from '../../seo-engine/types';

export const EngineSettingsAdmin: React.FC = () => {
  const [config, setConfig] = useState<SeoEngineConfig | null>(null);
  const [formData, setFormData] = useState<Partial<SeoEngineConfig>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current config from server
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/seo-engine/config', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setFormData(data.config);
      } else {
        throw new Error(data.error || 'Failed to load SEO Engine configuration.');
      }
    } catch (err: any) {
      console.error('Failed to load SEO Engine config:', err);
      setError(err?.message || 'Failed to retrieve configuration from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Handle number / text field changes
  const handleChange = (field: keyof SeoEngineConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle active weekdays [1..7]
  const handleToggleDay = (dayIndex: number) => {
    const currentDays = formData.activeDays || [1, 2, 3, 4, 5, 6, 7];
    const exists = currentDays.includes(dayIndex);
    let updatedDays: number[];
    if (exists) {
      if (currentDays.length <= 1) {
        setError('At least one active weekday must remain enabled.');
        return;
      }
      updatedDays = currentDays.filter(d => d !== dayIndex);
    } else {
      updatedDays = [...currentDays, dayIndex].sort((a, b) => a - b);
    }
    handleChange('activeDays', updatedDays);
  };

  // Submit and save configuration
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 1. Validate numeric limits & bounds
    const minWords = Number(formData.minWordCount);
    const maxWords = Number(formData.maxWordCount);
    if (isNaN(minWords) || minWords < 300) {
      setError('Minimum Word Count must be at least 300 words.');
      return;
    }
    if (isNaN(maxWords) || maxWords < minWords) {
      setError(`Maximum Word Count (${maxWords}) must be greater than or equal to Minimum Word Count (${minWords}).`);
      return;
    }

    const dailySpend = Number(formData.dailyCostLimitUsd);
    const perJobSpend = Number(formData.perJobCostLimitUsd);
    if (isNaN(dailySpend) || dailySpend <= 0) {
      setError('Daily spend limit must be a positive number.');
      return;
    }
    if (isNaN(perJobSpend) || perJobSpend <= 0) {
      setError('Per-job cost limit must be a positive number.');
      return;
    }

    const oppScore = Number(formData.minOpportunityScore);
    if (isNaN(oppScore) || oppScore < 0 || oppScore > 100) {
      setError('Minimum Opportunity Score must be between 0 and 100.');
      return;
    }

    // Trend Weights Validation (Must sum to ~100%)
    const freshW = Number(formData.freshTrendWeight ?? 0.40);
    const recentW = Number(formData.recentTrendWeight ?? 0.35);
    const histW = Number(formData.historicalTrendWeight ?? 0.25);
    const weightSum = Math.round((freshW + recentW + histW) * 100) / 100;
    if (Math.abs(weightSum - 1.0) > 0.02) {
      setError(`Trend weights must sum to 100% (currently ${Math.round(weightSum * 100)}%: ${Math.round(freshW * 100)}% + ${Math.round(recentW * 100)}% + ${Math.round(histW * 100)}%).`);
      return;
    }

    const markets = formData.targetMarkets || ['US', 'GB', 'CA', 'AU', 'NZ'];
    if (markets.length === 0) {
      setError('At least one target market must be selected.');
      return;
    }

    if (!formData.timezone || !formData.timezone.trim()) {
      setError('A valid timezone string is required (e.g. America/New_York).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/seo-engine/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update configuration.');
      }

      setConfig(data.config);
      setFormData(data.config);
      setSuccessMessage('SEO Engine configuration saved and updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save configuration:', err);
      setError(err?.message || 'Server error while saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData(config);
      setError(null);
      setSuccessMessage('Settings reset to active server configuration.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const DAYS_MAP = [
    { num: 1, label: 'Mon' },
    { num: 2, label: 'Tue' },
    { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' },
    { num: 5, label: 'Fri' },
    { num: 6, label: 'Sat' },
    { num: 7, label: 'Sun' },
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-200 dark:border-slate-700">
        <Loader2 className="w-8 h-8 animate-spin text-[#E96BA8]" />
        <p className="text-xs font-bold text-slate-500">Loading SEO Engine configuration...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* HEADER WITH SAVE ACTIONS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="bg-[#E96BA8]/20 text-[#E96BA8] border border-[#E96BA8]/40 p-2.5 rounded-xl shadow-xs">
              <Sliders className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                SEO Engine Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Manage automated production quotas, safety thresholds, editorial rules, and trend parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Global Save & Reset Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-[#E96BA8] to-[#9B7CF8] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Configuration Validation Error</p>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <p className="font-bold">{successMessage}</p>
        </div>
      )}

      {/* 2-COLUMN SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD A: ENGINE & PRODUCTION CONTROLS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <Cpu className="w-5 h-5 text-[#E96BA8]" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">A. Engine &amp; Production</h3>
              <p className="text-xs text-slate-500">Master execution switch and daily production quotas.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Engine Active Status</label>
                <span className="text-[11px] text-slate-500">Master kill switch for autonomous job creation.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.engineActive)}
                onChange={(e) => handleChange('engineActive', e.target.checked)}
                className="w-5 h-5 accent-[#E96BA8] rounded cursor-pointer"
              />
            </div>

            {/* Articles Per Day & Pins Per Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Articles Per Day</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.articlesPerDay ?? 2}
                  onChange={(e) => handleChange('articlesPerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 2 (1 Trend + 1 Tool)</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pins Per Day</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.pinsPerDay ?? 4}
                  onChange={(e) => handleChange('pinsPerDay', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Target total per day</span>
              </div>
            </div>

            {/* Pins Per Article & Trend Tasks Per Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pins Per Article</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.pinsPerArticle ?? 2}
                  onChange={(e) => handleChange('pinsPerArticle', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Pin 1 + Pin 2 pair</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Concurrent Jobs</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.maxConcurrentJobs ?? 1}
                  onChange={(e) => handleChange('maxConcurrentJobs', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Safety guard (default 1)</span>
              </div>
            </div>

            {/* Active Weekdays Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Active Production Days</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_MAP.map((d) => {
                  const isActive = (formData.activeDays || [1, 2, 3, 4, 5, 6, 7]).includes(d.num);
                  return (
                    <button
                      key={d.num}
                      type="button"
                      onClick={() => handleToggleDay(d.num)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#E96BA8] text-white border-[#E96BA8] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD B: PUBLISHING & SAFETY GATES */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">B. Publishing Safety Gates</h3>
              <p className="text-xs text-slate-500">Controls human approval requirements and autonomous publishing.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Require Approval Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Require Human Approval</label>
                <span className="text-[11px] text-slate-500">Halts articles at "awaiting approval" stage before publishing.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.requiresApproval)}
                onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Auto Publish Articles Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Auto-Publish Blog Articles</label>
                <span className="text-[11px] text-slate-500">Publishes directly to live blog upon passing 9 quality gates.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.autoPublish)}
                onChange={(e) => handleChange('autoPublish', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Auto Publish Pinterest Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Auto-Publish to Pinterest</label>
                <span className="text-[11px] text-slate-500">Autonomous API posting to verified Pinterest boards.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.autoPublishPinterest)}
                onChange={(e) => handleChange('autoPublishPinterest', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Safety Notice:</strong> When "Require Human Approval" is enabled, articles will never publish autonomously until an administrator reviews and approves the draft.</span>
            </div>
          </div>
        </div>

        {/* CARD C: SCHEDULE & TIMEZONE */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <Clock className="w-5 h-5 text-[#9B7CF8]" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">C. Timezone &amp; Schedule</h3>
              <p className="text-xs text-slate-500">Publishing cadences and target operating timezone.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Operating Timezone</label>
              <input
                type="text"
                value={formData.timezone || 'America/New_York'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="America/New_York"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">IANA timezone format (e.g. America/New_York, Europe/London)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Article Publish Times</label>
              <input
                type="text"
                value={(formData.articlePublishTimes || ['08:00', '12:00', '16:00', '20:00']).join(', ')}
                onChange={(e) => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  handleChange('articlePublishTimes', arr);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Comma-separated HH:MM 24hr format</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pinterest Publish Times</label>
              <input
                type="text"
                value={(formData.pinterestPublishTimes || ['09:00', '13:00', '17:00', '21:00']).join(', ')}
                onChange={(e) => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  handleChange('pinterestPublishTimes', arr);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Staggered publication windows</span>
            </div>
          </div>
        </div>

        {/* CARD D: ARTICLE QUALITY STANDARDS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <FileText className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">D. Article Quality Standards</h3>
              <p className="text-xs text-slate-500">Length thresholds, internal linking, and factual validation.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min Word Count</label>
                <input
                  type="number"
                  min="300"
                  max="3000"
                  value={formData.minWordCount ?? 800}
                  onChange={(e) => handleChange('minWordCount', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 800 words</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Word Count</label>
                <input
                  type="number"
                  min="800"
                  max="5000"
                  value={formData.maxWordCount ?? 2000}
                  onChange={(e) => handleChange('maxWordCount', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 2000 words</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Internal Links</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxInternalLinks ?? 8}
                  onChange={(e) => handleChange('maxInternalLinks', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Max 1 link / 250 words</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Regen Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.maxRegenerationAttempts ?? 2}
                  onChange={(e) => handleChange('maxRegenerationAttempts', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Retry limit on gate rejection</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">OpenAI Text Generation Model</label>
              <input
                type="text"
                value={formData.openAiModel || 'gpt-4o'}
                onChange={(e) => handleChange('openAiModel', e.target.value)}
                placeholder="gpt-4o"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Production default: gpt-4o</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">Strict Factual Validation</label>
                <span className="text-[11px] text-slate-500">Zero tolerance for unverified numbers or fake metrics.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.factualValidationStrict)}
                onChange={(e) => handleChange('factualValidationStrict', e.target.checked)}
                className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD E: SAFETY & COST LIMITS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">E. Safety &amp; Cost Limits</h3>
              <p className="text-xs text-slate-500">Strict monetary guardrails preventing unexpected API spend.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Spend Limit ($ USD)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="100"
                  value={formData.dailyCostLimitUsd ?? 5.0}
                  onChange={(e) => handleChange('dailyCostLimitUsd', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: $5.00 USD</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Per-Job Cost Limit ($ USD)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={formData.perJobCostLimitUsd ?? 1.5}
                  onChange={(e) => handleChange('perJobCostLimitUsd', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: $1.50 USD</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Image Cost ($ USD)</label>
              <input
                type="number"
                step="0.005"
                min="0"
                max="1"
                value={formData.estimatedImageCostUsd ?? 0.03}
                onChange={(e) => handleChange('estimatedImageCostUsd', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Application estimate per image (Marketing Studio Image 2.0 Alpha)</span>
            </div>
          </div>
        </div>

        {/* CARD F: TREND DISCOVERY INTELLIGENCE */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <Compass className="w-5 h-5 text-[#E96BA8]" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">F. Trend Discovery Intelligence</h3>
              <p className="text-xs text-slate-500">Live search trends, multi-market coverage, and window weighting.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* DataForSEO Master Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block">DataForSEO Live Trends API</label>
                <span className="text-[11px] text-slate-500">Enables live search volume and Google Trends keyword polling.</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.dataForSeoEnabled)}
                onChange={(e) => handleChange('dataForSeoEnabled', e.target.checked)}
                className="w-5 h-5 accent-[#E96BA8] rounded cursor-pointer"
              />
            </div>

            {/* Target Markets (US, GB, CA, AU, NZ) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target English-Speaking Markets</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { code: 'US', label: '🇺🇸 United States (US)' },
                  { code: 'GB', label: '🇬🇧 United Kingdom (UK)' },
                  { code: 'CA', label: '🇨🇦 Canada (CA)' },
                  { code: 'AU', label: '🇦🇺 Australia (AU)' },
                  { code: 'NZ', label: '🇳🇿 New Zealand (NZ)' },
                ].map((m) => {
                  const currentMarkets = formData.targetMarkets || ['US', 'GB', 'CA', 'AU', 'NZ'];
                  const isChecked = currentMarkets.includes(m.code as any);
                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => {
                        let updated: ('US' | 'GB' | 'CA' | 'AU' | 'NZ')[];
                        if (isChecked) {
                          if (currentMarkets.length <= 1) return;
                          updated = currentMarkets.filter(c => c !== m.code);
                        } else {
                          updated = [...currentMarkets, m.code as any];
                        }
                        handleChange('targetMarkets', updated);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-pink-50 dark:bg-pink-950/40 border-[#E96BA8] text-[#E96BA8] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Window Weights (Fresh 40%, Recent 35%, Historical 25%) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trend Time Windows &amp; Weights</label>
                <span className="text-[10px] font-mono text-[#E96BA8] font-bold">Must sum to 100%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">7-Day (Fresh)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.freshTrendWeight ?? 0.40}
                      onChange={(e) => handleChange('freshTrendWeight', Number(e.target.value))}
                      className="w-full bg-transparent font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Weight: {Math.round((formData.freshTrendWeight ?? 0.40) * 100)}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">30-Day (Recent)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.recentTrendWeight ?? 0.35}
                      onChange={(e) => handleChange('recentTrendWeight', Number(e.target.value))}
                      className="w-full bg-transparent font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Weight: {Math.round((formData.recentTrendWeight ?? 0.35) * 100)}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">90-Day (Historical)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.historicalTrendWeight ?? 0.25}
                      onChange={(e) => handleChange('historicalTrendWeight', Number(e.target.value))}
                      className="w-full bg-transparent font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Weight: {Math.round((formData.historicalTrendWeight ?? 0.25) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Candidate Sources Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Candidate Pool Sources</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Crochet Trends</span>
                    <span className="text-[10px] text-slate-400">Core craft demand</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Problem Trends</span>
                    <span className="text-[10px] text-slate-400">Fixes &amp; troubleshooting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.problemTrendsEnabled !== false}
                    onChange={(e) => handleChange('problemTrendsEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#E96BA8] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Seasonal Discovery</span>
                    <span className="text-[10px] text-slate-400">Holiday &amp; seasonal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.seasonalDiscoveryEnabled !== false}
                    onChange={(e) => handleChange('seasonalDiscoveryEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#E96BA8] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">GSC Seed Catalog</span>
                    <span className="text-[10px] text-slate-400">High-converting seeds</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.gscSeedCatalogEnabled !== false}
                    onChange={(e) => handleChange('gscSeedCatalogEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#E96BA8] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Curated Seeds</span>
                    <span className="text-[10px] text-slate-400">Editorial evergreen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.curatedSeedsEnabled !== false}
                    onChange={(e) => handleChange('curatedSeedsEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#E96BA8] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Dynamic Queries</span>
                    <span className="text-[10px] text-slate-400">Related breakout items</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.dynamicRelatedQueriesEnabled !== false}
                    onChange={(e) => handleChange('dynamicRelatedQueriesEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#E96BA8] rounded cursor-pointer"
                  />
                </div>

              </div>
            </div>

            {/* Minimum Opportunity Score */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min Opportunity Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.minOpportunityScore ?? 65}
                onChange={(e) => handleChange('minOpportunityScore', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Threshold for qualifying topics (default 65/100)</span>
            </div>

          </div>
        </div>

      </div>

    </form>
  );
};
