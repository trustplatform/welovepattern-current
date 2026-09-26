/**
 * SEO Content Engine - Default Configuration & Limits
 * Safe production defaults: Auto-publish is OFF and Manual Approval is ON by default.
 */

import { SeoEngineConfig } from './types';

export const DEFAULT_SEO_ENGINE_CONFIG: SeoEngineConfig = {
  articlesPerDay: 2,
  pinsPerDay: 4,
  pinsPerArticle: 2,
  trendTasksPerDay: 20,
  autoPublish: true,
  autoPublishPinterest: true,
  requiresApproval: false,
  engineActive: true,
  timezone: 'America/New_York',
  activeDays: [1, 2, 3, 4, 5, 6, 7],
  articlePublishTimes: ['08:00', '12:00', '16:00', '20:00'],
  pinterestPublishTimes: ['09:00', '13:00', '17:00', '21:00'],
  maxConcurrentJobs: 1,
  fallbackBoardId: '',
  fallbackBoardName: '',
  minWordCount: 800,
  maxWordCount: 2000,
  maxInternalLinks: 8,
  dataForSeoEnabled: true,
  discoveryCountry: 'US',
  discoveryLanguage: 'en',
  minOpportunityScore: 65,
  seasonalDiscoveryEnabled: true,
  gscSeedCatalogEnabled: true,
  targetMarkets: ['US', 'GB', 'CA', 'AU', 'NZ'],
  freshTrendWindow: 7,
  recentTrendWindow: 30,
  historicalTrendWindow: 90,
  freshTrendWeight: 0.40,
  recentTrendWeight: 0.35,
  historicalTrendWeight: 0.25,
  problemTrendsEnabled: true,
  dynamicRelatedQueriesEnabled: true,
  curatedSeedsEnabled: true,
  factualValidationStrict: true,
  maxRegenerationAttempts: 2,
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  openAiTemperature: 0.7,
  dailyCostLimitUsd: 5.00,
  perJobCostLimitUsd: 1.50,
  higgsfieldEnabled: true,
  estimatedImageCostUsd: 0.03,
};

/** Limits and thresholds for article generation and internal linking */
export const CONTENT_ENGINE_LIMITS = {
  /** Maximum internal links to inject per article */
  MAX_INTERNAL_LINKS_PER_ARTICLE: 8,
  /** Density threshold: maximum 1 internal link per N words */
  WORDS_PER_INTERNAL_LINK: 250,
  /** Maximum characters for compact Higgsfield prompt */
  MAX_HIGGSFIELD_PROMPT_LENGTH: 480,
  /** Days to look back for duplicate topic prevention */
  DUPLICATE_CHECK_LOOKBACK_DAYS: 60,
  /** Maximum historical jobs to retain in memory state */
  MAX_HISTORICAL_JOBS_RETAINED: 250,
  /** Maximum API retries on transient errors (429, 503) */
  MAX_TRANSIENT_RETRIES: 3,
  /** Network timeout for outbound API calls */
  API_TIMEOUT_MS: 30000,
} as const;

/** State file paths */
export const SEO_ENGINE_STORAGE_PATHS = {
  STATE_FILE: 'data/seo-engine-state.json',
  STATE_FILE_TMP: 'data/seo-engine-state.json.tmp',
  COST_FILE: 'data/seo-engine-costs.json',
  COST_FILE_TMP: 'data/seo-engine-costs.json.tmp',
  SEO_PINS_DIR: 'public/generated/pinterest/seo-pins',
  BLOG_IMAGES_DIR: 'public/generated/blog',
} as const;
