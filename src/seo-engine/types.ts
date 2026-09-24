/**
 * SEO Content Engine - Domain Models & Type Definitions
 * Strict types for Discovery, Research, Production, Pinterest Creative Director & State Queue.
 */

export type TopicStatus = 
  | 'discovered' 
  | 'filtered_out' 
  | 'selected' 
  | 'researching' 
  | 'writing' 
  | 'generating_images' 
  | 'awaiting_approval' 
  | 'publishing' 
  | 'completed' 
  | 'failed';

export type ContentFormat = 
  | 'tutorial' 
  | 'guide' 
  | 'tool_focus' 
  | 'pattern_roundup' 
  | 'explainer_comparison';

export interface DataForSeoTrendItem {
  keyword: string;
  trendScore: number;
  trendDirection: 'rising' | 'stable' | 'breakout';
}

export interface DiscoveredTopic {
  id: string;                                 // sha256 or unique slug of normalized keyword
  keyword: string;
  source?: 'dataforseo_trends' | 'gsc_seed' | 'internal_catalog';
  dataForSeoTaskId?: string;
  searchTrendSignal?: number;                 // 0-100 normalized trend score
  trendScore?: number;                        // Alias for searchTrendSignal
  trendDirection?: 'rising' | 'stable' | 'breakout';
  relevanceScore?: number;                    // 0-100 crochet/fiber craft relevance
  siteFitScore?: number;                      // 0-100 fit to tools/patterns/categories
  opportunityScore: number;                   // 0-100 weighted final score
  targetContentFormat: ContentFormat;
  targetToolUrl?: string;                     // e.g. "/tools/blanket-yarn-estimator"
  targetCategoryUrl?: string;                 // e.g. "/category/blankets"
  targetPatternUrls?: string[];               // e.g. ["/pattern/cozy-granny-square-blanket"]
  targetAudienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  searchIntentNotes?: string;
  discoveredAt: string;
  status: TopicStatus;
  statusReason?: string;
}

export interface VerifiedInternalLink {
  anchorText: string;
  url: string;
  entityType: 'tool' | 'pattern' | 'category' | 'blog';
}

export interface LinkCatalogItem {
  url: string;                                // e.g. "/tools/gauge-calculator"
  title: string;
  entityType: 'tool' | 'pattern' | 'category' | 'blog';
  keywords: string[];
  verified: boolean;
  description?: string;
}

export interface GscSeedKeyword {
  keyword: string;
  targetToolSlug?: string;
  targetToolTitle?: string;
  targetCategory?: string;
  intent: 'calculator' | 'tutorial' | 'guide' | 'chart';
  priority: 'high' | 'very_high';
  notes: string;
}

export interface FactualResearchPacket {
  topicId?: string;                           // Immutable binding to topic id to prevent cross-topic fact leakage
  topic: string;
  searchIntent: string;
  craftType: 'crochet' | 'knitting' | 'sewing';
  sourceAuthority?: string;                   // e.g. "Craft Yarn Council Technical Standards"
  cycStandardVersion?: string;                // e.g. "CYC Standard Guidelines 2024"
  generatedAt?: string;                       // ISO date for freshness / anti-stale verification
  verifiedTerminology: string[];              // e.g. ["double crochet", "magic ring", "gauge swatch"]
  verifiedMaterials: {
    yarnWeights: string[];                    // e.g. ["Medium / Worsted (#4)"]
    hookSizes: string[];                      // e.g. ["5.0 mm (H-8)"]
    standardYardages?: string;                // Baseline descriptive summary
    verifiedYardageRanges?: Record<string, { minMeters: number; maxMeters: number; notes: string }>; // Explicit numerical boundaries
    verifiedDimensions?: Record<string, string>; // e.g. {"Baby Blanket": "30 x 36 inches (76 x 91 cm)"}
  };
  authorizedPercentages?: number[];           // Explicit allowed percentage claims (e.g. [10, 15, 25])
  prohibitedMetrics?: string[];               // Explicit forbidden claims (e.g. ["stitches per skein"])
  verifiedFormulas?: {
    name: string;
    description: string;
    formulaText: string;
    steps: string[];
  }[];
  supportedClaims?: string[];                 // Explicit allowed technical/craft assertions
  techniqueKeyPoints: string[];
  makerPainPoints: string[];
  faqItems: { question: string; factualAnswer: string }[];
  verifiedInternalLinks: VerifiedInternalLink[];
}

export interface PinterestTypographyOverlay {
  primaryHeadline: string;                    // Max 4-6 words, high mobile readability
  supportingText?: string;
  ctaBadgeText: string;                       // Dynamic from Creative Director: e.g. "Try the Calculator Free →", "Get the Free Pattern →"
  textContainerStyle: 'soft_comfort_card' | 'warm_neutral_box' | 'clean_lower_banner';
  isManualOverride?: boolean;                 // Set if user manually edited the CTA in Admin
}

export interface PinterestCreativeConcept {
  pinNumber: number;                          // 1, 2, ... up to pinsPerArticle
  conceptAngle: string;                       // Distinct concept angle (e.g. "Lifestyle / Cozy Home" vs "Technical Layflat / Yarn Swatch")
  visualStyle: {
    imageCount: number;                       // Dynamically decided: 1, 2, 3, or 4+ images
    compositionType: 'single_hero' | 'split_2_image' | '3_image_grid' | '4_plus_image_grid' | 'flatlay_materials' | 'lifestyle_scene' | 'collage_macro';
    subjectDescription: string;               // e.g. "Close up of hands crocheting with textured wool"
    colorPalette: string;                     // e.g. "Warm honey, cream, and rustic sage"
    humanElement: 'hands_only' | 'person_wearing' | 'lifestyle_background' | 'none';
  };
  compactHiggsfieldPrompt: string;            // Character-constrained prompt (< 500 chars)
  typographyOverlay: PinterestTypographyOverlay;
  destinationUrl: string;                     // Canonical URL: https://welovepattern.com/blog/[slug]
  targetBoardId: string;                      // Real Pinterest board ID
  targetBoardName: string;                    // Real Pinterest board name
  boardName?: string;                         // Convenience alias for targetBoardName
  higgsfieldRequestId?: string;
  stableAssetPath?: string;                   // Local path in public/generated/pinterest/seo-pins/
  stablePublicUrl?: string;                   // Public URL served by Express
  pinterestPinId?: string;
  publishStatus: 'pending' | 'generating_image' | 'image_ready' | 'publishing' | 'published' | 'failed';
  errorMessage?: string;
}

export interface ArticleHeroImage {
  prompt: string;
  compactPrompt: string;
  higgsfieldRequestId?: string;
  stableAssetPath?: string;
  stablePublicUrl?: string;
  status: 'pending' | 'ready' | 'failed';
}

export type SeoEngineJobStage = TopicStatus;

export interface SeoEngineArticleJob {
  id: string;                                 // e.g. "job_20260922_abc123"
  dateScheduled: string;                      // "YYYY-MM-DD"
  topic: DiscoveredTopic;
  factualResearch?: FactualResearchPacket;
  articleContent?: {
    title: string;
    slug: string;
    excerpt: string;
    contentHtml: string;
    wordCount: number;
    category: string;
    tags: string[];
    seoMeta: { title: string; description: string; keywords: string };
    heroImage?: ArticleHeroImage;
  };
  pinterestPins: PinterestCreativeConcept[];  // Dynamically sized array (default 2, configurable)
  stage: SeoEngineJobStage;
  requiresApproval: boolean;
  publishedBlogPostId?: string;
  indexNowNotified: boolean;
  costBreakdown?: {
    dataForSeoCostUsd: number;
    openAiCostUsd: number;
    higgsfieldCostUsd: number;
    totalCostUsd: number;
  };
  createdAt: string;
  updatedAt: string;
  logs: { timestamp: string; level: 'info' | 'warn' | 'error'; message: string }[];
}

export interface CostRecordItem {
  id: string;
  jobId?: string;
  timestamp: string;
  provider: 'dataforseo' | 'openai' | 'higgsfield';
  operation: string;
  unitsConsumed: number;                      // tokens, tasks, or images
  costUsd: number;
  meta?: Record<string, any>;
}

export interface ProductionQualityGateResult {
  jobId: string;
  passedAllGates: boolean;
  gates: {
    factualGrounding: { passed: boolean; details: string; validatedCount: number; unsupportedCount: number };
    seoIntentAlignment: { passed: boolean; details: string };
    metadataQuality: { passed: boolean; details: string };
    htmlSanitization: { passed: boolean; details: string };
    internalLinking: { passed: boolean; details: string; linkCount: number };
    duplicationAndCannibalization: { passed: boolean; details: string };
    editorialThresholds: { passed: boolean; details: string; wordCount: number };
    imageAssetIntegrity: { passed: boolean; details: string };
    publicationSafety: { passed: boolean; details: string };
  };
  rejectionReasons: string[];
  evaluatedAt: string;
}

export interface SeoEngineConfig {
  articlesPerDay: number;                     // Default: 4
  pinsPerDay: number;                         // Default: 8
  pinsPerArticle: number;                     // Default: 2 (configurable)
  trendTasksPerDay: number;                   // Default: 20
  autoPublish: boolean;                       // Default: false
  autoPublishPinterest: boolean;              // Default: false
  requiresApproval: boolean;                  // Default: true
  engineActive: boolean;                      // Default: true
  timezone: string;                           // Default: "America/New_York"
  activeDays: number[];                       // [1..7] Monday through Sunday
  articlePublishTimes: string[];              // e.g. ["08:00", "12:00", "16:00", "20:00"]
  pinterestPublishTimes: string[];            // e.g. ["09:00", "13:00", "17:00", "21:00"]
  maxConcurrentJobs: number;                  // Default: 1
  fallbackBoardId: string;
  fallbackBoardName: string;
  minWordCount: number;                       // Default: 800
  maxWordCount: number;                       // Default: 2000
  maxInternalLinks: number;                   // Default: 8
  dataForSeoEnabled: boolean;                 // Default: true
  discoveryCountry: string;                   // Default: "US"
  discoveryLanguage: string;                  // Default: "en"
  minOpportunityScore: number;                // Default: 65
  seasonalDiscoveryEnabled: boolean;          // Default: true
  gscSeedCatalogEnabled: boolean;             // Default: true
  factualValidationStrict: boolean;           // Default: true
  maxRegenerationAttempts: number;            // Default: 2
  openAiModel: string;                        // Configurable string (e.g. "gpt-4o", "gpt-4o-mini", etc.)
  openAiTemperature: number;                  // Default: 0.7
  dailyCostLimitUsd: number;                  // Safety limit: e.g. 5.00 ($5.00/day)
  perJobCostLimitUsd: number;                 // Safety limit per job: e.g. 1.50
  higgsfieldEnabled: boolean;                 // Default: true
  estimatedImageCostUsd?: number;             // Configurable cost per image (e.g. 0.03 for Marketing Studio 1k)
}

export interface HistoricalJobSummary {
  jobId: string;
  date: string;
  keyword: string;
  articleTitle: string;
  articleSlug: string;
  wordCount: number;
  pinIds: string[];
  status: 'completed' | 'failed';
}

export interface SeoEngineDailyState {
  version: number;
  config: SeoEngineConfig;
  lastRunDate: string;
  todayDiscoveredTopics: DiscoveredTopic[];
  discoveredTopics?: DiscoveredTopic[];       // Convenience alias
  activeJobs: SeoEngineArticleJob[];
  completedJobsHistory: HistoricalJobSummary[];
  historicalJobs?: HistoricalJobSummary[];    // Convenience alias
  updatedAt: string;
}
