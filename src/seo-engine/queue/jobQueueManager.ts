/**
 * SEO Content Engine - Autonomous Job Queue & Lifecycle Engine
 * 
 * Manages atomic lifecycle transitions for SEO Article Jobs:
 * `discovered` → `selected` → `researching` → `writing` → `generating_images` → `awaiting_approval` → `completed` / `failed`
 * 
 * RESILIENCY & RECOVERY:
 * 1. Crash/Restart Recovery: Recovers interrupted jobs on startup safely into retry states.
 * 2. Idempotency: Duplicate executions cannot overwrite or duplicate published articles.
 * 3. Concurrency Protection: Strictly obeys `maxConcurrentJobs`.
 * 4. Human Approval Wall: Stops strictly at `awaiting_approval` when `requiresApproval: true` or `autoPublish: false`.
 */

import fs from 'fs';
import { DiscoveredTopic, SeoEngineArticleJob, SeoEngineConfig, SeoEngineJobStage, ArticleContentType, FactualResearchPacket, PinterestCreativeConcept } from '../types';
import { readEngineState, writeEngineState, addJobToState, updateJobInState, getJobById } from './engineStorage';
import { conductTopicResearch } from '../research/topicResearcher';
import { validateFactualResearchPacket } from '../research/factualPacketValidator';
import { generateOpenAiArticle, GeneratedArticle } from '../generation/openAiArticleGenerator';
import { generatePinterestCreativeConcepts, resolveRealPinterestBoard, buildHiggsfieldHeroPrompt, validateToolCtaSemanticMatch, deriveToolSpecificCta } from '../generation/pinterestCreativeDirector';
import { NormalizedPinterestBoard } from '../../pinterest/pinterestApi';
import { evaluateProductionQualityGates } from '../validation/productionQualityGates';
import { getJobCostBreakdown, isBudgetPermitted, releaseBudgetReservation } from '../cost/costTracker';
import { generateHiggsfieldImage, isHiggsfieldConfigured } from '../generation/higgsfieldClient';
import { discoverDailyTwoSlotTopics, discoverDailyThreeSlotTopics, discoverTrendingCrochetTopic, discoverToolGuideTopic } from '../discovery/topicDiscovery';
import { publishArticleToLiveSite } from '../publishing/articlePublisher';
import { recoverJobLocalAssets, isValidLocalAsset } from './assetRecovery';

let isProcessingQueue = false;

/**
 * Per-job lifecycle lock.
 *
 * Prevents concurrent executions of the same job (for example a manual
 * run endpoint racing with the scheduler/queue worker). Without this,
 * two executions can both observe a missing image asset before either
 * persists the Higgsfield request ID, causing duplicate paid generations.
 */
const activeJobLifecycles = new Set<string>();

/**
 * Recovers any in-flight jobs that were interrupted by a server restart or crash.
 */
export function recoverInterruptedJobs(): void {
  const state = readEngineState();
  let recoveredCount = 0;

  for (const job of state.activeJobs) {
    // 1. Attempt deterministic local asset recovery first ($0 cost)
    recoverJobLocalAssets(job);

    if (job.stage === 'researching' || job.stage === 'writing' || job.stage === 'generating_images') {
      console.warn(`[JobQueueManager] Detected interrupted job "${job.id}" in stage "${job.stage}". Resetting to "selected" for clean recovery.`);
      job.stage = 'selected';
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Process restart detected. Safely reset from interrupted state to "selected" for clean recovery.`,
      });
      job.updatedAt = new Date().toISOString();
      recoveredCount++;
    }
  }

  if (recoveredCount > 0) {
    writeEngineState(state);
    console.log(`[JobQueueManager] Successfully recovered ${recoveredCount} interrupted jobs.`);
  }
}

/**
 * Creates and queues a new article job for a discovered topic.
 */
export function queueJobForTopic(topic: DiscoveredTopic, config: SeoEngineConfig, scheduledDate?: string): SeoEngineArticleJob {
  const state = readEngineState();
  const todayStr = scheduledDate || new Date().toISOString().split('T')[0];
  const jobId = `job_${todayStr}_${Math.random().toString(36).substring(2, 8)}`;
  const contentType: ArticleContentType = topic.contentType || (topic.category === 'tools' ? 'tool_guide' : 'trending_crochet');
  const category: 'crochet' | 'tools' = (topic.category === 'tools' ? 'tools' : 'crochet');

  const newJob: SeoEngineArticleJob = {
    id: jobId,
    dateScheduled: todayStr,
    contentType,
    category,
    topic: {
      ...topic,
      contentType,
      category,
    },
    pinterestPins: [],
    stage: 'selected',
    requiresApproval: config.requiresApproval,
    indexNowNotified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Job created for ${contentType.toUpperCase()} (Category: ${category.toUpperCase()}): "${topic.keyword}" with opportunity score ${topic.opportunityScore}.`,
      }
    ],
  };

  addJobToState(newJob);
  return newJob;
}

/**
 * Creates and queues a single production article job for a specific slot (Slot 1, Slot 2, or Slot 3).
 * Slot 1: 1 x Trending Crochet article (Category: 'crochet', Type: 'trending_crochet', Slot Time: '08:00', Pinterest: '08:30' & '09:00')
 * Slot 2: 1 x Tool Guide article (Category: 'tools', Type: 'tool_guide', Slot Time: '12:00', Pinterest: '12:30' & '13:00')
 * Slot 3: 1 x Craft Guide article (Category: 'crochet', Type: 'trending_crochet', Slot Time: '16:00', Pinterest: '16:30' & '17:00')
 */
export async function createSingleSlotProductionJob(
  slotNumber: 1 | 2 | 3,
  options?: { useRealDataForSeo?: boolean; scheduledDate?: string; slotTime?: string }
): Promise<SeoEngineArticleJob> {
  const state = readEngineState();
  const config = state.config;
  const targetDate = options?.scheduledDate || new Date().toISOString().split('T')[0];
  const targetSlotTime = options?.slotTime || (slotNumber === 1 ? '08:00' : slotNumber === 2 ? '12:00' : '16:00');

  let topic: DiscoveredTopic;
  if (slotNumber === 1) {
    topic = await discoverTrendingCrochetTopic({ useRealDataForSeo: options?.useRealDataForSeo });
    if (topic.contentType !== 'trending_crochet' || topic.category !== 'crochet') {
      throw new Error(`Slot 1 topic invalid: Expected contentType 'trending_crochet' and category 'crochet', got '${topic.contentType}' / '${topic.category}'.`);
    }
  } else if (slotNumber === 2) {
    topic = await discoverToolGuideTopic({ useRealDataForSeo: options?.useRealDataForSeo });
    if (topic.contentType !== 'tool_guide' || topic.category !== 'tools' || !topic.toolSlug) {
      throw new Error(`Slot 2 topic invalid: Expected contentType 'tool_guide', category 'tools', and real toolSlug, got '${topic.contentType}' / '${topic.category}' / '${topic.toolSlug}'.`);
    }
  } else {
    // Slot 3: Second tool/calculator article (must be a distinct tool from Slot 2)
    const todayToolSlugs: string[] = [];
    for (const j of state.activeJobs || []) {
      if ((j.assignedPublishDate === targetDate || j.dateScheduled === targetDate) && j.topic?.toolSlug) {
        todayToolSlugs.push(j.topic.toolSlug.toLowerCase());
      }
    }
    topic = await discoverToolGuideTopic({
      useRealDataForSeo: options?.useRealDataForSeo,
      excludeToolSlugs: todayToolSlugs
    });
    if (topic.contentType !== 'tool_guide' || topic.category !== 'tools' || !topic.toolSlug) {
      throw new Error(`Slot 3 topic invalid: Expected contentType 'tool_guide', category 'tools', and real toolSlug, got '${topic.contentType}' / '${topic.category}' / '${topic.toolSlug}'.`);
    }
  }

  const job = queueJobForTopic(topic, config, targetDate);

  // Set explicit slot assignments
  updateJobInState(job.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = targetSlotTime;
    j.publicationScheduledAt = targetSlotTime;
    return j;
  });

  return getJobById(job.id)!;
}

/**
 * Creates and queues the complete daily 3-slot production batch:
 * Slot 1 (08:00): 1 x Trending Crochet article (Category: 'crochet')
 * Slot 2 (12:00): 1 x Tool Guide article (Category: 'tools', Tool 1)
 * Slot 3 (16:00): 1 x Tool Guide article (Category: 'tools', Tool 2, distinct from Tool 1)
 * 
 * Fulfills the exact daily production requirement: 2 tools/calculators articles and 1 crochet article.
 */
export async function createDailyThreeSlotProductionBatch(
  options?: { useRealDataForSeo?: boolean; scheduledDate?: string }
): Promise<[SeoEngineArticleJob, SeoEngineArticleJob, SeoEngineArticleJob]> {
  const state = readEngineState();
  const config = state.config;
  const targetDate = options?.scheduledDate || new Date().toISOString().split('T')[0];

  const [topicSlot1, topicSlot2, topicSlot3] = await discoverDailyThreeSlotTopics({
    useRealDataForSeo: options?.useRealDataForSeo
  });

  const job1 = queueJobForTopic(topicSlot1, config, targetDate);
  const job2 = queueJobForTopic(topicSlot2, config, targetDate);
  const job3 = queueJobForTopic(topicSlot3, config, targetDate);

  updateJobInState(job1.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = '08:00';
    j.publicationScheduledAt = '08:00';
    return j;
  });

  updateJobInState(job2.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = '12:00';
    j.publicationScheduledAt = '12:00';
    return j;
  });

  updateJobInState(job3.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = '16:00';
    j.publicationScheduledAt = '16:00';
    return j;
  });

  return [getJobById(job1.id)!, getJobById(job2.id)!, getJobById(job3.id)!];
}

/**
 * Legacy helper for daily 2-slot production batch (superseded by createSingleSlotProductionJob for 3 daily slots):
 * Slot 1: 1 x Trending Crochet article (Category: 'crochet', Type: 'trending_crochet')
 * Slot 2: 1 x Tool Guide article (Category: 'tools', Type: 'tool_guide')
 */
export async function createDailyProductionBatch(
  options?: { useRealDataForSeo?: boolean; scheduledDate?: string }
): Promise<[SeoEngineArticleJob, SeoEngineArticleJob]> {
  const state = readEngineState();
  const config = state.config;
  const targetDate = options?.scheduledDate || new Date().toISOString().split('T')[0];

  // 1. Discover the two topics
  const [topicSlot1, topicSlot2] = await discoverDailyTwoSlotTopics({
    useRealDataForSeo: options?.useRealDataForSeo
  });

  // Strict validation
  if (topicSlot1.contentType !== 'trending_crochet' || topicSlot1.category !== 'crochet') {
    throw new Error(`Slot 1 topic invalid: Expected contentType 'trending_crochet' and category 'crochet', got '${topicSlot1.contentType}' / '${topicSlot1.category}'.`);
  }
  if (topicSlot2.contentType !== 'tool_guide' || topicSlot2.category !== 'tools' || !topicSlot2.toolSlug) {
    throw new Error(`Slot 2 topic invalid: Expected contentType 'tool_guide', category 'tools', and real toolSlug, got '${topicSlot2.contentType}' / '${topicSlot2.category}' / '${topicSlot2.toolSlug}'.`);
  }

  // 2. Queue both jobs atomically with explicit slot times
  const job1 = queueJobForTopic(topicSlot1, config, targetDate);
  const job2 = queueJobForTopic(topicSlot2, config, targetDate);

  updateJobInState(job1.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = '08:00';
    j.publicationScheduledAt = '08:00';
    return j;
  });

  updateJobInState(job2.id, j => {
    j.assignedPublishDate = targetDate;
    j.assignedSlotTime = '16:00';
    j.publicationScheduledAt = '16:00';
    return j;
  });

  return [getJobById(job1.id)!, getJobById(job2.id)!];
}

export interface JobLifecycleOptions {
  allowTestFallbackBoard?: boolean;
}

/**
 * Resolves or preserves Pinterest creative concepts per slot independently.
 * Reuses existing valid rendered pin assets without mutating objects in place,
 * and generates replacements ONLY for missing, invalid, or semantically mismatched pins.
 * Already-published pins are strictly preserved with immutable metadata regardless of CTA validation.
 */
export function resolveOrPreservePinterestPins(
  existingPins: PinterestCreativeConcept[] | undefined,
  topic: DiscoveredTopic,
  article: GeneratedArticle,
  packet: FactualResearchPacket,
  resolvedBoard: NormalizedPinterestBoard,
  contentType: ArticleContentType = topic.contentType || 'trending_crochet',
  conceptGenerator: (
    topic: DiscoveredTopic,
    article: GeneratedArticle,
    packet: FactualResearchPacket,
    resolvedBoard: NormalizedPinterestBoard,
    pinsPerArticle?: number
  ) => PinterestCreativeConcept[] = generatePinterestCreativeConcepts
): PinterestCreativeConcept[] {
  const currentPins = existingPins || [];
  let generatedConcepts: PinterestCreativeConcept[] | null = null;

  return [0, 1].map(index => {
    const existingPin = currentPins[index];

    // 1. Never replace or alter an already-published Pinterest Pin
    const isAlreadyPublished = Boolean(
      existingPin &&
      existingPin.publishStatus === 'published' &&
      existingPin.pinterestPinId
    );
    if (isAlreadyPublished && existingPin) {
      return { ...existingPin };
    }

    // 2. Validate existing unpublished pin asset on disk
    const hasValidAsset = Boolean(
      existingPin &&
      existingPin.stableAssetPath &&
      isValidLocalAsset(existingPin.stableAssetPath)
    );

    // 3. CTA semantic check for tool topics
    const isToolContext = contentType === 'tool_guide' || Boolean(topic.toolSlug);
    const hasCtaMismatch = Boolean(
      existingPin &&
      isToolContext &&
      !validateToolCtaSemanticMatch(
        existingPin.typographyOverlay?.ctaBadgeText || '',
        topic.toolSlug,
        topic.keyword
      ).valid
    );

    // 4. Preserve existing pin if it exists (valid asset, in-flight task ID, or established concept)
    const hasExistingConcept = Boolean(
      existingPin &&
      (hasValidAsset || existingPin.higgsfieldRequestId || existingPin.compactHiggsfieldPrompt || existingPin.conceptAngle)
    );

    if (hasExistingConcept && existingPin) {
      const correctedCta = hasCtaMismatch
        ? deriveToolSpecificCta(topic.toolSlug, topic.keyword)
        : (existingPin.typographyOverlay?.ctaBadgeText || '');

      const targetBoardId = resolvedBoard.id || existingPin.targetBoardId || '';
      const targetBoardName = resolvedBoard.name || existingPin.targetBoardName || '';

      return {
        ...existingPin,
        targetBoardId,
        targetBoardName,
        boardName: targetBoardName,
        typographyOverlay: {
          ...existingPin.typographyOverlay,
          ctaBadgeText: correctedCta,
        },
        publishStatus: hasValidAsset ? 'image_ready' : (existingPin.publishStatus || 'pending'),
      };
    }

    // 5. Lazy-generate fresh creative concepts only when no concept exists for this slot
    if (!generatedConcepts) {
      generatedConcepts = conceptGenerator(
        topic,
        article,
        packet,
        resolvedBoard,
        2
      );
    }

    return generatedConcepts[index];
  });
}

/**
 * Executes a single job through its end-to-end generation lifecycle.
 */
export async function executeJobLifecycle(
  jobId: string,
  options?: JobLifecycleOptions
): Promise<SeoEngineArticleJob> {
  let job = getJobById(jobId);
  if (!job) {
    throw new Error(`Job not found with id: ${jobId}`);
  }

  // Prevent concurrent lifecycle executions for the same job.
  // This closes the race where two callers can both reach Higgsfield
  // before the first caller persists its provider request ID.
  if (activeJobLifecycles.has(jobId)) {
    console.warn(`[JobQueueManager] Job ${jobId} is already running; skipping concurrent execution.`);
    return getJobById(jobId)!;
  }

  activeJobLifecycles.add(jobId);

  try {

  // 1. Attempt deterministic local asset recovery first ($0 cost)
  updateJobInState(jobId, j => {
    recoverJobLocalAssets(j);
    return j;
  });

  const freshJob = getJobById(jobId) || job;

  // Idempotency check: If already completed or awaiting approval, do not duplicate
  if (freshJob.stage === 'completed' || freshJob.stage === 'awaiting_approval') {
    return freshJob;
  }

  const state = readEngineState();
  const config = state.config;

  // REUSE-ONLY MODE GUARD:
  // Strictly prevent generating or regenerating content.
  // In reuse-only mode, no job is permitted to enter the generation lifecycle ($0 cost, 0 AI calls).
  const isReuseOnly = config.reuseOnlyMode !== false;
  if (isReuseOnly) {
    console.log(`[JobQueueManager] Reuse-only mode active: Generation lifecycle strictly disabled for job ${jobId} ($0 cost, 0 AI calls).`);
    return freshJob;
  }

  // Cost budget guardrail check
  const budgetCheck = isBudgetPermitted(0.10, config, jobId);
  if (!budgetCheck.permitted) {
    updateJobInState(jobId, j => {
      j.stage = 'failed';
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Budget cap reached: ${budgetCheck.reason}. Execution paused.`,
      });
      return j;
    });
    return getJobById(jobId)!;
  }

  // -----------------------------------------------------------------
  // STAGE 1: FACTUAL RESEARCH
  // -----------------------------------------------------------------
  updateJobInState(jobId, j => {
    j.stage = 'researching';
    j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Starting technical craft research...' });
    return j;
  });

  let packet = job.factualResearch;
  if (!packet) {
    try {
      const rawPacket = await conductTopicResearch(job.topic);
      const validation = validateFactualResearchPacket(rawPacket);

      if (!validation.isValid) {
        updateJobInState(jobId, j => {
          j.stage = 'failed';
          j.logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Factual research packet validation failed: ${validation.errors.join(', ')}`,
          });
          return j;
        });
        return getJobById(jobId)!;
      }

      packet = validation.sanitizedPacket;
      updateJobInState(jobId, j => {
        j.factualResearch = packet;
        j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Factual research packet validated successfully.' });
        return j;
      });
    } catch (err: any) {
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.logs.push({ timestamp: new Date().toISOString(), level: 'error', message: `Factual research error: ${err?.message}` });
        return j;
      });
      return getJobById(jobId)!;
    }
  }

  // -----------------------------------------------------------------
  // STAGE 2: ARTICLE GENERATION & INTERNAL LINKING
  // -----------------------------------------------------------------
  let article: GeneratedArticle;

  const existingArticle = job.articleContent;
  const isExistingArticleValid = Boolean(
    existingArticle &&
    typeof existingArticle.title === 'string' &&
    existingArticle.title.trim().length > 0 &&
    typeof existingArticle.contentHtml === 'string' &&
    existingArticle.contentHtml.trim().length > 200 &&
    typeof existingArticle.slug === 'string' &&
    existingArticle.slug.trim().length > 0 &&
    typeof existingArticle.wordCount === 'number' &&
    existingArticle.wordCount > 0
  );

  if (isExistingArticleValid && existingArticle) {
    updateJobInState(jobId, j => {
      j.stage = 'writing';
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Existing valid article draft detected ("${existingArticle.title}", ${existingArticle.wordCount} words). Reusing without calling OpenAI.`,
      });
      return j;
    });

    article = {
      title: existingArticle.title,
      slug: existingArticle.slug,
      excerpt: existingArticle.excerpt || '',
      contentHtml: existingArticle.contentHtml,
      wordCount: existingArticle.wordCount,
      category: existingArticle.category || job.category,
      contentType: existingArticle.contentType || job.contentType,
      tags: existingArticle.tags || [],
      seoMeta: existingArticle.seoMeta || {
        title: existingArticle.title,
        description: existingArticle.excerpt || '',
        keywords: job.topic.keyword,
      },
      internalLinks: [],
      tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  } else {
    updateJobInState(jobId, j => {
      j.stage = 'writing';
      j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Generating article with OpenAI...' });
      return j;
    });

    try {
      article = await generateOpenAiArticle(job.topic, packet, config);
      // Immediately persist generated articleContent into job state for crash resiliency
      updateJobInState(jobId, j => {
        j.articleContent = {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          contentHtml: article.contentHtml,
          wordCount: article.wordCount,
          category: article.category,
          tags: article.tags,
          seoMeta: article.seoMeta,
        };
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Article generated successfully (${article.wordCount} words). Content safely persisted to job state.`,
        });
        return j;
      });
    } catch (err: any) {
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.logs.push({ timestamp: new Date().toISOString(), level: 'error', message: `OpenAI Generation Error: ${err?.message}` });
        return j;
      });
      return getJobById(jobId)!;
    }
  }

  // -----------------------------------------------------------------
  // STAGE 3: PINTEREST CREATIVE CONCEPTS & EXISTING IMAGE REUSE
  // -----------------------------------------------------------------
  updateJobInState(jobId, j => {
    j.stage = 'generating_images';
    j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Starting Stage 3: Board resolution and local image asset binding ($0 cost)...' });
    return j;
  });

  // Attempt local asset recovery and normalization first ($0 cost, 0 API calls)
  recoverJobLocalAssets(job);
  job = getJobById(jobId)!;

  // 2. Resolve real Pinterest board
  const isTestExecution = Boolean(
    options?.allowTestFallbackBoard ||
    job.id.includes('_test_') ||
    job.topic.id?.startsWith('test_topic_')
  );

  const boardResolution = await resolveRealPinterestBoard(
    job.topic,
    article.category,
    undefined,
    {
      allowTestFallback: isTestExecution,
      fallbackBoardId: config.fallbackBoardId,
      fallbackBoardName: config.fallbackBoardName,
    }
  );

  let resolvedBoard = boardResolution.board;

  if (!boardResolution.success || !resolvedBoard) {
    if (isTestExecution) {
      resolvedBoard = {
        id: 'test_sandbox_fallback_board',
        name: 'Crochet Tools & Yarn Calculators (Test Sandbox)',
      };
      updateJobInState(jobId, j => {
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `[TEST RUNNER] No confident live Pinterest board match found (${boardResolution.reason}). Using test sandbox fallback board "${resolvedBoard?.name}" for creative concept generation. Live Pinterest publishing remains strictly disabled.`,
        });
        return j;
      });
    } else if (config.fallbackBoardId && config.fallbackBoardName) {
      resolvedBoard = {
        id: config.fallbackBoardId,
        name: config.fallbackBoardName,
      };
      updateJobInState(jobId, j => {
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `Pinterest Board Auto-Match had low confidence (${boardResolution.confidenceScore}/100 for topic "${job.topic.keyword}"). Using configured fallback board "${resolvedBoard?.name}" for creative concepts.`,
        });
        return j;
      });
    } else {
      // Safe non-fatal handling: Article was generated successfully and must NOT be failed.
      // Pinterest Pin publishing is deferred until an appropriate board is connected or assigned in Admin.
      resolvedBoard = {
        id: '',
        name: 'Unassigned (No Matching Board)',
      };
      updateJobInState(jobId, j => {
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `No suitable Pinterest board found (${boardResolution.reason}). Article generation will proceed to completion. Pinterest Pin publication deferred until a matching board is assigned in Admin.`,
        });
        return j;
      });
    }
  } else if (boardResolution.isTestFallback) {
    updateJobInState(jobId, j => {
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `[TEST RUNNER] Using test sandbox board "${resolvedBoard?.name}" for creative concept generation only. Live Pinterest publishing remains strictly disabled.`,
      });
      return j;
    });
  }

  // 3. Generate exactly 2 unique Pinterest creative concepts
let pins = resolveOrPreservePinterestPins(
      job.pinterestPins,
      job.topic,
      article,
      packet,
      resolvedBoard,
      job.contentType
    );

  // Persist concepts to state immediately
  updateJobInState(jobId, j => {
    j.pinterestPins = pins;
    return j;
  });

  // 4. Verify & Bind Existing Disk Image Assets ($0 cost, 0 image-generation calls)
  const heroPrompt = job.articleContent?.heroImage?.prompt ||
    buildHiggsfieldHeroPrompt(job.topic, article, packet);

  let currentHeroImage = job.articleContent?.heroImage;
  const isHeroValid = isValidLocalAsset(currentHeroImage?.stableAssetPath);
  const isPin1Valid = isValidLocalAsset(pins[0]?.stableAssetPath);
  const isPin2Valid = isValidLocalAsset(pins[1]?.stableAssetPath);

  if (!isHeroValid || !isPin1Valid || !isPin2Valid) {
    const missingAssets: string[] = [];
    if (!isHeroValid) missingAssets.push('Hero (16:9)');
    if (!isPin1Valid) missingAssets.push('Pin 1 (2:3)');
    if (!isPin2Valid) missingAssets.push('Pin 2 (2:3)');

    updateJobInState(jobId, j => {
      j.stage = 'failed';
      if (j.articleContent?.heroImage && !isHeroValid) {
        j.articleContent.heroImage.status = 'failed';
        j.articleContent.heroImage.errorMessage = 'Required existing Hero image missing from disk.';
      }
      if (j.pinterestPins?.[0] && !isPin1Valid) {
        j.pinterestPins[0].publishStatus = 'failed';
        j.pinterestPins[0].errorMessage = 'Required existing Pin 1 image missing from disk.';
      }
      if (j.pinterestPins?.[1] && !isPin2Valid) {
        j.pinterestPins[1].publishStatus = 'failed';
        j.pinterestPins[1].errorMessage = 'Required existing Pin 2 image missing from disk.';
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Missing or ambiguous image assets on disk: ${missingAssets.join(', ')}. Image generation is strictly disabled ($0 quota preservation). Skipping job.`,
      });
      return j;
    });
    return getJobById(jobId)!;
  }

  // All 3 required assets exist on disk: bind them cleanly with zero image generation
  updateJobInState(jobId, j => {
    if (j.articleContent?.heroImage) {
      j.articleContent.heroImage.status = 'ready';
    }
    if (j.pinterestPins?.[0]) {
      j.pinterestPins[0].publishStatus = 'image_ready';
    }
    if (j.pinterestPins?.[1]) {
      j.pinterestPins[1].publishStatus = 'image_ready';
    }
    j.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `All 3 visual assets confirmed on disk and bound successfully ($0 cost, 0 image-generation calls).`,
    });
    return j;
  });

  currentHeroImage = getJobById(jobId)?.articleContent?.heroImage;
  pins = getJobById(jobId)?.pinterestPins || pins;

  article.heroImage = {
    prompt: currentHeroImage?.prompt || heroPrompt,
    assetPath: currentHeroImage?.stableAssetPath,
    publicUrl: currentHeroImage?.stablePublicUrl,
  };

  // -----------------------------------------------------------------
  // STAGE 4: PRODUCTION QUALITY GATES AUDIT
  // -----------------------------------------------------------------
  const qualityAudit = evaluateProductionQualityGates(jobId, article, job.topic, packet, config);

  if (!qualityAudit.passedAllGates) {
    updateJobInState(jobId, j => {
      j.stage = 'failed';
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Quality Gate Failures:\n- ${qualityAudit.rejectionReasons.join('\n- ')}`,
      });
      return j;
    });
    return getJobById(jobId)!;
  }

  // Record cost breakdown onto job
  const costBreakdown = getJobCostBreakdown(jobId);

  const nowIso = new Date().toISOString();

  // -----------------------------------------------------------------
  // STAGE 5: SAVE ARTICLE & PUBLISH OR AWAIT APPROVAL
  // -----------------------------------------------------------------
  // Record verified content, validation timestamp, and pin creative concepts
  let updatedJob = updateJobInState(jobId, j => {
    j.articleContent = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      contentHtml: article.contentHtml,
      wordCount: article.wordCount,
      category: article.category || j.category,
      contentType: article.contentType || j.contentType,
      tags: article.tags,
      seoMeta: article.seoMeta,
      heroImage: currentHeroImage,
    };
    j.pinterestPins = pins;
    j.costBreakdown = costBreakdown;
    j.validatedAt = nowIso;
    j.generatedAt = j.generatedAt || nowIso;
    j.publicationScheduledAt = j.publicationScheduledAt || (config.articlePublishTimes?.[0] || '08:00');

    // Human Approval Wall: If requiresApproval === true or autoPublish === false, halt safely in awaiting_approval
    if (config.requiresApproval === true || config.autoPublish === false) {
      j.stage = 'awaiting_approval';
      j.logs.push({
        timestamp: nowIso,
        level: 'info',
        message: `Article passed all 9 quality gates (${article.wordCount} words, Category: ${j.category.toUpperCase()}, Type: ${j.contentType}). Saved safely as draft awaiting human approval.`,
      });
    } else {
      // Ready for autonomous publishing
      j.stage = 'ready_to_publish' as any;
      j.logs.push({
        timestamp: nowIso,
        level: 'info',
        message: `Article passed all 9 quality gates. Auto-publishing directly to live website...`,
      });
    }
    return j;
  })!;

  // -----------------------------------------------------------------
  // STAGE 6: AUTOMATIC WEBSITE ARTICLE PUBLICATION
  // -----------------------------------------------------------------
  if (config.autoPublish === true && config.requiresApproval !== true) {
    const pubResult = await publishArticleToLiveSite(updatedJob);
    if (pubResult.success && pubResult.blogPostId) {
      updatedJob = updateJobInState(jobId, j => {
        j.stage = 'completed';
        j.publishedBlogPostId = pubResult.blogPostId;
        j.publishedSlug = pubResult.slug;
        j.publishedUrl = pubResult.publicUrl;
        j.publishedAt = new Date().toISOString();
        j.indexNowNotified = true;
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Article successfully published to live website: ${pubResult.publicUrl} (Blog Post ID: ${pubResult.blogPostId})`,
        });
        return j;
      })!;
    } else {
      updatedJob = updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.publicationError = pubResult.error || 'Failed to publish article to live website.';
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Website Publication Error: ${pubResult.error}`,
        });
        return j;
      })!;
    }
  }

  return updatedJob;
  } finally {
    activeJobLifecycles.delete(jobId);
  }
}

/**
 * Runs the queue worker if not already running.
 */
export async function processQueueWorker(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;
  try {
    recoverInterruptedJobs();
    
    // In reuse-only publishing mode, prevent queue worker from generating or regenerating content.
    // Existing selected jobs without complete assets must not enter the generation lifecycle.
    const state = readEngineState();
    if (state.config.reuseOnlyMode !== false) {
      console.log('[JobQueueManager] Reuse-only mode active: Skipping queue worker generation lifecycle ($0 cost, 0 AI calls).');
      return;
    }

    // Process pending jobs one by one, freshly reading state on each iteration
    while (true) {
      const currentState = readEngineState();
      const nextPendingJob = currentState.activeJobs.find(j => j.stage === 'selected');
      if (!nextPendingJob) {
        break;
      }

      console.log(`[JobQueueManager] Processing pending job ${nextPendingJob.id} ("${nextPendingJob.topic.keyword}")...`);
      try {
        await executeJobLifecycle(nextPendingJob.id);
      } catch (err) {
        console.error(`[JobQueueManager] Error processing job ${nextPendingJob.id}:`, err);
        // Mark job as failed so the queue worker does not loop indefinitely on the same job
        updateJobInState(nextPendingJob.id, j => {
          j.stage = 'failed';
          j.logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Job lifecycle failed: ${err instanceof Error ? err.message : String(err)}`,
          });
          return j;
        });
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}
