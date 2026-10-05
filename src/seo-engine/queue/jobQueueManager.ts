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
import { generatePinterestCreativeConcepts, resolveRealPinterestBoard, buildHiggsfieldHeroPrompt, validateToolCtaSemanticMatch } from '../generation/pinterestCreativeDirector';
import { NormalizedPinterestBoard } from '../../pinterest/pinterestApi';
import { evaluateProductionQualityGates } from '../validation/productionQualityGates';
import { getJobCostBreakdown, isBudgetPermitted, releaseBudgetReservation } from '../cost/costTracker';
import { generateHiggsfieldImage, isHiggsfieldConfigured } from '../generation/higgsfieldClient';
import { discoverDailyTwoSlotTopics } from '../discovery/topicDiscovery';
import { publishArticleToLiveSite } from '../publishing/articlePublisher';

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
export function queueJobForTopic(topic: DiscoveredTopic, config: SeoEngineConfig): SeoEngineArticleJob {
  const state = readEngineState();
  const todayStr = new Date().toISOString().split('T')[0];
  const jobId = `job_${todayStr}_${Math.random().toString(36).substring(2, 8)}`;
  const contentType: ArticleContentType = topic.contentType || (topic.category === 'tools' ? 'tool_guide' : 'trending_crochet');
  const category: 'crochet' | 'tools' = topic.category || (contentType === 'tool_guide' ? 'tools' : 'crochet');

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
 * Creates and queues the strict daily 2-slot production batch:
 * Slot 1: 1 x Trending Crochet article (Category: 'crochet', Type: 'trending_crochet')
 * Slot 2: 1 x Tool Guide article (Category: 'tools', Type: 'tool_guide')
 */
export async function createDailyProductionBatch(
  options?: { useRealDataForSeo?: boolean }
): Promise<[SeoEngineArticleJob, SeoEngineArticleJob]> {
  const state = readEngineState();
  const config = state.config;

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

  // 2. Queue both jobs atomically
  const job1 = queueJobForTopic(topicSlot1, config);
  const job2 = queueJobForTopic(topicSlot2, config);

  return [job1, job2];
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
      existingPin.publishStatus === 'image_ready' &&
      existingPin.stableAssetPath &&
      fs.existsSync(existingPin.stableAssetPath) &&
      fs.statSync(existingPin.stableAssetPath).size > 100
    );

    // 3. Exact original semantic validation condition: contentType === 'tool_guide' || Boolean(topic.toolSlug)
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

    // 4. Preserve existing valid pin without in-place mutation
    if (hasValidAsset && !hasCtaMismatch && existingPin) {
      if (
        resolvedBoard.id &&
        (!existingPin.targetBoardId || existingPin.targetBoardId !== resolvedBoard.id)
      ) {
        return {
          ...existingPin,
          targetBoardId: resolvedBoard.id,
          targetBoardName: resolvedBoard.name,
          boardName: resolvedBoard.name,
        };
      }
      return { ...existingPin };
    }

    // 5. Lazy-generate fresh creative concepts only when at least one pin requires replacement
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
  const job = getJobById(jobId);
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

  // Idempotency check: If already completed or awaiting approval, do not duplicate
  if (job.stage === 'completed' || job.stage === 'awaiting_approval') {
    return job;
  }

  const state = readEngineState();
  const config = state.config;

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
  // STAGE 3: PINTEREST CREATIVE CONCEPTS & HIGGSFIELD IMAGE GENERATION
  // -----------------------------------------------------------------
  updateJobInState(jobId, j => {
    j.stage = 'generating_images';
    j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Starting Stage 3: Board resolution and visual asset generation...' });
    return j;
  });

  // 1. Higgsfield configuration check: Block and require operator action if not configured
  if (!isHiggsfieldConfigured()) {
    updateJobInState(jobId, j => {
      j.stage = 'failed';
      if (j.articleContent) {
        j.articleContent.heroImage = {
          prompt: job.articleContent?.heroImage?.prompt || `Hero image for ${article.title}`,
          compactPrompt: (job.articleContent?.heroImage?.prompt || `Hero image for ${article.title}`).slice(0, 480),
          status: 'failed',
          errorMessage: 'Higgsfield is not configured on the server (HF_KEY missing). Job paused and requires operator action.',
        };
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Higgsfield is not configured on the server (HF_KEY missing). Job paused and requires operator action.',
      });
      return j;
    });
    return getJobById(jobId)!;
  }

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

  // 4. Sequential Image Generation: Hero (16:9) -> Pin 1 (2:3) -> Pin 2 (2:3)
  const estimatedImageCost = (typeof config.estimatedImageCostUsd === 'number' && config.estimatedImageCostUsd > 0)
    ? config.estimatedImageCostUsd
    : 0.03;

  // --- ASSET 1: HERO IMAGE (16:9, 1k, Marketing Studio Image 2.0 Alpha) ---
  const heroPrompt = job.articleContent?.heroImage?.prompt ||
    buildHiggsfieldHeroPrompt(job.topic, article, packet);

  let currentHeroImage = job.articleContent?.heroImage;
  const isHeroAlreadyValid = Boolean(
    currentHeroImage?.stableAssetPath &&
    fs.existsSync(currentHeroImage.stableAssetPath) &&
    fs.statSync(currentHeroImage.stableAssetPath).size > 100
  );

  if (!isHeroAlreadyValid) {
    const heroBudget = isBudgetPermitted(estimatedImageCost, config, jobId, true);
    if (!heroBudget.permitted) {
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Hero Image Budget Exceeded: ${heroBudget.reason}`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    updateJobInState(jobId, j => {
      if (j.articleContent) {
        j.articleContent.heroImage = {
          prompt: heroPrompt,
          compactPrompt: heroPrompt.slice(0, 480),
          higgsfieldRequestId: currentHeroImage?.higgsfieldRequestId,
          status: 'pending',
        };
      }
      j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Generating Hero image (Marketing Studio Image 2.0 Alpha, 1k, 16:9)...' });
      return j;
    });

    const heroRes = await generateHiggsfieldImage({
      prompt: heroPrompt,
      aspectRatio: '16:9',
      resolution: '1k',
      slug: article.slug,
      targetFolder: 'blog',
      jobId,
      estimatedCostUsd: estimatedImageCost,
      existingTaskId: currentHeroImage?.higgsfieldRequestId,
      onTaskIdReceived: (taskId: string) => {
        updateJobInState(jobId, j => {
          if (j.articleContent?.heroImage) {
            j.articleContent.heroImage.higgsfieldRequestId = taskId;
          }
          return j;
        });
      },
    });

    if (!heroRes.success || !heroRes.stableAssetPath) {
      releaseBudgetReservation(jobId);
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        if (j.articleContent?.heroImage) {
          j.articleContent.heroImage.status = 'failed';
          j.articleContent.heroImage.errorMessage = heroRes.error;
          if (heroRes.providerRequestId) {
            j.articleContent.heroImage.higgsfieldRequestId = heroRes.providerRequestId;
          }
        }
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Hero Image Generation Failed: ${heroRes.error} (Request ID: ${heroRes.providerRequestId || 'N/A'})`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    if (heroRes.costUsd === 0) {
      releaseBudgetReservation(jobId);
    }

    updateJobInState(jobId, j => {
      if (j.articleContent) {
        j.articleContent.heroImage = {
          prompt: heroPrompt,
          compactPrompt: heroPrompt.slice(0, 480),
          higgsfieldRequestId: heroRes.providerRequestId,
          stableAssetPath: heroRes.stableAssetPath,
          stablePublicUrl: heroRes.stablePublicUrl,
          status: 'ready',
        };
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Hero image generated and saved to ${heroRes.stablePublicUrl}`,
      });
      return j;
    });
    currentHeroImage = getJobById(jobId)?.articleContent?.heroImage;
  } else {
    updateJobInState(jobId, j => {
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Reusing existing valid Hero asset at ${currentHeroImage!.stablePublicUrl}`,
      });
      return j;
    });
  }

  // Bind hero asset to article object for downstream quality checks
  article.heroImage = {
    prompt: currentHeroImage?.prompt || heroPrompt,
    assetPath: currentHeroImage?.stableAssetPath,
    publicUrl: currentHeroImage?.stablePublicUrl,
  };

  // --- ASSET 2: PIN 1 IMAGE (2:3, 1k, Marketing Studio Image 2.0 Alpha) ---
  const isPin1AlreadyValid = Boolean(
    pins[0]?.stableAssetPath &&
    fs.existsSync(pins[0].stableAssetPath) &&
    fs.statSync(pins[0].stableAssetPath).size > 100
  );

  if (!isPin1AlreadyValid) {
    const pin1Budget = isBudgetPermitted(estimatedImageCost, config, jobId, true);
    if (!pin1Budget.permitted) {
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Pin 1 Budget Exceeded: ${pin1Budget.reason}. Hero image preserved.`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    updateJobInState(jobId, j => {
      if (j.pinterestPins[0]) {
        j.pinterestPins[0].publishStatus = 'generating_image';
      }
      j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Generating Pin 1 image (Marketing Studio Image 2.0 Alpha, 1k, 2:3)...' });
      return j;
    });

    const pin1Res = await generateHiggsfieldImage({
      prompt: pins[0].compactHiggsfieldPrompt,
      aspectRatio: '2:3',
      resolution: '1k',
      slug: `${article.slug}-pin-1`,
      targetFolder: 'pinterest',
      jobId,
      estimatedCostUsd: estimatedImageCost,
      existingTaskId: pins[0].higgsfieldRequestId,
      onTaskIdReceived: (taskId: string) => {
        updateJobInState(jobId, j => {
          if (j.pinterestPins[0]) {
            j.pinterestPins[0].higgsfieldRequestId = taskId;
          }
          return j;
        });
      },
    });

    if (!pin1Res.success || !pin1Res.stableAssetPath) {
      releaseBudgetReservation(jobId);
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        if (j.pinterestPins[0]) {
          j.pinterestPins[0].publishStatus = 'failed';
          j.pinterestPins[0].errorMessage = pin1Res.error;
          if (pin1Res.providerRequestId) {
            j.pinterestPins[0].higgsfieldRequestId = pin1Res.providerRequestId;
          }
        }
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Pin 1 Generation Failed: ${pin1Res.error} (Request ID: ${pin1Res.providerRequestId || 'N/A'}). Hero image preserved.`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    if (pin1Res.costUsd === 0) {
      releaseBudgetReservation(jobId);
    }

    updateJobInState(jobId, j => {
      if (j.pinterestPins[0]) {
        j.pinterestPins[0].stableAssetPath = pin1Res.stableAssetPath;
        j.pinterestPins[0].stablePublicUrl = pin1Res.stablePublicUrl;
        j.pinterestPins[0].higgsfieldRequestId = pin1Res.providerRequestId;
        j.pinterestPins[0].publishStatus = 'image_ready';
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Pin 1 generated and saved to ${pin1Res.stablePublicUrl}`,
      });
      return j;
    });
    pins = getJobById(jobId)?.pinterestPins || pins;
  } else {
    updateJobInState(jobId, j => {
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Reusing existing valid Pin 1 asset at ${pins[0].stablePublicUrl}`,
      });
      return j;
    });
  }

  // --- ASSET 3: PIN 2 IMAGE (2:3, 1k, Marketing Studio Image 2.0 Alpha) ---
  const isPin2AlreadyValid = Boolean(
    pins[1]?.stableAssetPath &&
    fs.existsSync(pins[1].stableAssetPath) &&
    fs.statSync(pins[1].stableAssetPath).size > 100
  );

  if (!isPin2AlreadyValid) {
    const pin2Budget = isBudgetPermitted(estimatedImageCost, config, jobId, true);
    if (!pin2Budget.permitted) {
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Pin 2 Budget Exceeded: ${pin2Budget.reason}. Hero and Pin 1 preserved.`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    updateJobInState(jobId, j => {
      if (j.pinterestPins[1]) {
        j.pinterestPins[1].publishStatus = 'generating_image';
      }
      j.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Generating Pin 2 image (Marketing Studio Image 2.0 Alpha, 1k, 2:3)...' });
      return j;
    });

    const pin2Res = await generateHiggsfieldImage({
      prompt: pins[1].compactHiggsfieldPrompt,
      aspectRatio: '2:3',
      resolution: '1k',
      slug: `${article.slug}-pin-2`,
      targetFolder: 'pinterest',
      jobId,
      estimatedCostUsd: estimatedImageCost,
      existingTaskId: pins[1].higgsfieldRequestId,
      onTaskIdReceived: (taskId: string) => {
        updateJobInState(jobId, j => {
          if (j.pinterestPins[1]) {
            j.pinterestPins[1].higgsfieldRequestId = taskId;
          }
          return j;
        });
      },
    });

    if (!pin2Res.success || !pin2Res.stableAssetPath) {
      releaseBudgetReservation(jobId);
      updateJobInState(jobId, j => {
        j.stage = 'failed';
        if (j.pinterestPins[1]) {
          j.pinterestPins[1].publishStatus = 'failed';
          j.pinterestPins[1].errorMessage = pin2Res.error;
          if (pin2Res.providerRequestId) {
            j.pinterestPins[1].higgsfieldRequestId = pin2Res.providerRequestId;
          }
        }
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Pin 2 Generation Failed: ${pin2Res.error} (Request ID: ${pin2Res.providerRequestId || 'N/A'}). Hero and Pin 1 are safely preserved.`,
        });
        return j;
      });
      return getJobById(jobId)!;
    }

    if (pin2Res.costUsd === 0) {
      releaseBudgetReservation(jobId);
    }

    updateJobInState(jobId, j => {
      if (j.pinterestPins[1]) {
        j.pinterestPins[1].stableAssetPath = pin2Res.stableAssetPath;
        j.pinterestPins[1].stablePublicUrl = pin2Res.stablePublicUrl;
        j.pinterestPins[1].higgsfieldRequestId = pin2Res.providerRequestId;
        j.pinterestPins[1].publishStatus = 'image_ready';
      }
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Pin 2 generated and saved to ${pin2Res.stablePublicUrl}`,
      });
      return j;
    });
    pins = getJobById(jobId)?.pinterestPins || pins;
  } else {
    updateJobInState(jobId, j => {
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Reusing existing valid Pin 2 asset at ${pins[1].stablePublicUrl}`,
      });
      return j;
    });
  }

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
    
    // Process pending jobs one by one, freshly reading state on each iteration
    while (true) {
      const state = readEngineState();
      const nextPendingJob = state.activeJobs.find(j => j.stage === 'selected');
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
