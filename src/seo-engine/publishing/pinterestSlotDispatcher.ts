/**
 * SEO Content Engine - Pinterest Slot Dispatcher
 * 
 * Maps 6 daily Pinterest publishing slots to exact Pins across today's 3 published articles:
 * Slot 1 (08:30): Article 1, Pin 1
 * Slot 2 (09:00): Article 1, Pin 2
 * Slot 3 (12:30): Article 2, Pin 1
 * Slot 4 (13:00): Article 2, Pin 2
 * Slot 5 (16:30): Article 3, Pin 1
 * Slot 6 (17:00): Article 3, Pin 2
 * 
 * SAFETY & IDEMPOTENCY:
 * - Selects exactly ONE unpublished Pin corresponding to the active slot.
 * - Verifies the parent article is already published.
 * - Verifies the local image file exists.
 * - Dispatches the Pin via the existing Pinterest API integration.
 * - Records returned Pinterest Pin ID and ISO timestamp.
 * - Does not publish if autoPublishPinterest === false.
 */

import fs from 'fs';
import { readEngineState, updateJobInState } from '../queue/engineStorage';
import { publishPinToPinterest, PublishPinResult } from './pinterestPublisher';
import { getPinterestAuthRecord } from '../../pinterest/pinterestOAuth';
import { getLiveBlogPosts } from './articlePublisher';
import { isValidLocalAsset } from '../queue/assetRecovery';
import {
  getConnectedPinterestBoards,
  selectBestPinterestBoard,
  isRealNumericPinterestBoardId,
  isPlaceholderBoardId,
} from './pinterestBoardSelector';

export function isPinterestConnected(): boolean {
  const useSandbox = process.env.PINTEREST_USE_SANDBOX === 'true';
  if (useSandbox) {
    return Boolean(process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim());
  }
  const authRecord = getPinterestAuthRecord();
  return Boolean(authRecord && authRecord.accessToken);
}

export interface DispatchPinterestSlotResult {
  triggered: boolean;
  pinPublished: boolean;
  slotIndex?: number;
  jobId?: string;
  pinNumber?: number;
  pinterestPinId?: string;
  reason?: string;
  error?: string;
}

/**
 * Dispatches the specific Pin scheduled for the current Pinterest slot.
 */
export async function dispatchScheduledPinterestSlot(
  slotTime: string,
  targetDateStr: string
): Promise<DispatchPinterestSlotResult> {
  const state = readEngineState();
  const config = state.config;

  if (!config.engineActive) {
    return { triggered: false, pinPublished: false, reason: 'Engine is inactive.' };
  }

  if (config.autoPublishPinterest === false) {
    return { triggered: false, pinPublished: false, reason: 'autoPublishPinterest is disabled.' };
  }

  const pinterestPublishTimes = config.pinterestPublishTimes?.length ? config.pinterestPublishTimes : ['09:15'];
  const slotIndex = pinterestPublishTimes.indexOf(slotTime);

  if (slotIndex === -1) {
    return { triggered: false, pinPublished: false, reason: `Time ${slotTime} is not a configured Pinterest slot.` };
  }

  // Filter today's jobs (matching assignedPublishDate or fallback dateScheduled)
  const todaysJobs = state.activeJobs
    .filter(j => (j.assignedPublishDate === targetDateStr) || (!j.assignedPublishDate && j.dateScheduled === targetDateStr))
    .sort((a, b) => {
      const timeA = a.assignedSlotTime || a.publicationScheduledAt || '';
      const timeB = b.assignedSlotTime || b.publicationScheduledAt || '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

  if (todaysJobs.length === 0) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `No active jobs found for date ${targetDateStr}.`,
    };
  }

  // Enforce HARD daily Pinterest cap: max configured published pins per calendar day
  let publishedPinsToday = 0;
  for (const j of todaysJobs) {
    for (const p of (j.pinterestPins || [])) {
      if (p.publishStatus === 'published' && p.pinterestPinId) {
        publishedPinsToday++;
      }
    }
  }

  if (publishedPinsToday >= pinterestPublishTimes.length) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Daily Pinterest publishing limit reached (${publishedPinsToday}/${pinterestPublishTimes.length} pins published) for date ${targetDateStr}.`,
    };
  }

  // Dynamic slot mapping across configured Pinterest slots and pins per article:
  // e.g. With 1 pin per article: Slot 0 (09:15) -> Article 1 (09:00 slot), Pin 1
  // With 2 pins per article: Slot 0 -> Article 1, Pin 1; Slot 1 -> Article 1, Pin 2
  const pinsPerArt = Math.max(1, config.pinsPerArticle || 1);
  const targetArticleIndex = Math.floor(slotIndex / pinsPerArt);
  const targetPinIndex = slotIndex % pinsPerArt;
  const articlePublishTimes = config.articlePublishTimes?.length ? config.articlePublishTimes : ['09:00'];
  const targetArticleSlotTime = articlePublishTimes[targetArticleIndex] || articlePublishTimes[0] || '09:00';

  // Deterministically match article job for this Pinterest slot:
  // 1. By pin assignedSlotTime or scheduledTime (e.g. 08:30)
  // 2. By parent article assignedSlotTime (e.g. 08:00)
  // 3. By positional index in today's sorted jobs
  let job = todaysJobs.find(j =>
    j.pinterestPins?.some(p => p.assignedSlotTime === slotTime || p.scheduledTime === slotTime)
  );

  if (!job) {
    job = todaysJobs.find(j =>
      j.assignedSlotTime === targetArticleSlotTime || j.publicationScheduledAt === targetArticleSlotTime
    );
  }

  if (!job) {
    job = todaysJobs[targetArticleIndex];
  }

  if (!job) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      reason: `Article ${targetArticleIndex + 1} does not exist for Pinterest Slot ${slotIndex + 1} (${slotTime}).`,
    };
  }

  // Resolve target pin on the job (matching this slot time or targetPinIndex)
  let pin = job.pinterestPins?.find(p => p.assignedSlotTime === slotTime || p.scheduledTime === slotTime);
  if (!pin) {
    pin = job.pinterestPins?.[targetPinIndex];
  }

  if (!pin) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      reason: `Pin ${targetPinIndex + 1} not configured on article "${job.articleContent?.title || job.id}".`,
    };
  }

  // 1. Verify Article is Strictly Published and Live on the Website
  const livePosts = getLiveBlogPosts();
  const isParentLive = livePosts.some(p =>
    (job.publishedBlogPostId && p.id === job.publishedBlogPostId) ||
    (p.seoEngineJobId && p.seoEngineJobId === job.id) ||
    (job.articleContent?.slug && p.slug === job.articleContent.slug) ||
    (job.publishedSlug && p.slug === job.publishedSlug)
  );

  if (job.stage !== 'completed' || !job.publishedBlogPostId || Boolean(job.publicationError) || !isParentLive) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Parent article "${job.articleContent?.title || job.id}" is not yet confirmed live on website. Pin publication deferred.`,
    };
  }

  // 2. Local asset check
  if (!isValidLocalAsset(pin.stableAssetPath)) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Pin ${pin.pinNumber} local image asset is missing or invalid on disk.`,
    };
  }

  // 3. Idempotency Check
  if (pin.publishStatus === 'published' && pin.pinterestPinId) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      pinterestPinId: pin.pinterestPinId,
      reason: `Pin ${pin.pinNumber} for job ${job.id} is already published (Pin ID: ${pin.pinterestPinId}).`,
    };
  }

  // 4. Retry Bounding: Stop retrying if maximum attempts reached or error was permanent
  if (pin.isPermanentFailure || (pin.retryCount && pin.retryCount >= 3)) {
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: `Pin ${pin.pinNumber} reached maximum retry limit (${pin.retryCount || 0} attempts) or permanent failure: ${pin.errorMessage || 'permanent error'}`,
    };
  }

  // 5. Pre-flight Check: Pinterest connection
  if (!isPinterestConnected()) {
    console.log(`[PinterestSlotDispatcher] ℹ️ Pinterest account is not connected. Deferring live Pin dispatch for Slot ${slotIndex + 1} (${slotTime}) until connected in Admin Settings.`);
    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      reason: 'Pinterest account is not connected. Please connect Pinterest in Admin Settings.',
    };
  }

  // 6. Dynamic Pinterest Board Resolution & Validation
  // If pin has no targetBoardId or has an internal placeholder (e.g. 'board_tools'),
  // dynamically resolve the best genuine numeric board ID from connected account
  if (!pin.targetBoardId || isPlaceholderBoardId(pin.targetBoardId)) {
    console.log(`[PinterestSlotDispatcher] 🔍 Dynamically selecting Pinterest board for Job ${job.id}, Pin ${pin.pinNumber} (Category: ${job.category || job.contentType})...`);
    const availableBoards = await getConnectedPinterestBoards();
    const fallbackBoard = (config.fallbackBoardId && config.fallbackBoardName)
      ? { id: config.fallbackBoardId, name: config.fallbackBoardName }
      : undefined;

    const boardSelection = selectBestPinterestBoard({
      topic: job.topic,
      category: job.category || job.contentType,
      availableBoards,
      fallbackBoard,
    });

    if (boardSelection.success && boardSelection.board && isRealNumericPinterestBoardId(boardSelection.board.id)) {
      pin.targetBoardId = boardSelection.board.id;
      pin.targetBoardName = boardSelection.board.name;
      pin.boardName = boardSelection.board.name;

      updateJobInState(job.id, j => {
        const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
        if (p) {
          p.targetBoardId = boardSelection.board!.id;
          p.targetBoardName = boardSelection.board!.name;
          p.boardName = boardSelection.board!.name;
        }
        if (!Array.isArray(j.logs)) j.logs = [];
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Pinterest dynamic board selection for Pin ${pin.pinNumber}: ${boardSelection.reason}`,
        });
        return j;
      });
    } else {
      // Board selection could not find a valid numeric board.
      // CRITICAL INDEPENDENCE RULE:
      // - Pinterest board selection failure MUST NOT fail or unpublish the website article.
      // - The parent article remains published on the website.
      // - Pin is retained in a retryable state with clear diagnostic logs.
      const diagReason = boardSelection.reason || 'No valid Pinterest board found';
      updateJobInState(job.id, j => {
        const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
        if (p) {
          p.publishStatus = 'failed';
          p.retryCount = (p.retryCount || 0) + 1;
          p.lastAttemptAt = new Date().toISOString();
          p.errorMessage = `Pinterest board resolution failed: ${diagReason}`;
          if (p.retryCount >= 3) {
            p.isPermanentFailure = true;
          }
        }
        if (!Array.isArray(j.logs)) j.logs = [];
        j.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `Pinterest Slot ${slotIndex + 1} (${slotTime}) Pin ${pin.pinNumber}: ${diagReason}. Pin retained in retryable state (attempt ${p?.retryCount || 1}/3). Parent article remains safely live on website.`,
        });
        return j;
      });

      return {
        triggered: true,
        pinPublished: false,
        slotIndex,
        jobId: job.id,
        pinNumber: pin.pinNumber,
        reason: `No suitable Pinterest board found in connected account (${diagReason}). Pin retained in retryable state.`,
      };
    }
  }

  console.log(`[PinterestSlotDispatcher] 📌 Dispatching Slot ${slotIndex + 1} (${slotTime}) -> Job ${job.id}, Pin ${pin.pinNumber}...`);

  // 7. Dispatch to Pinterest API
  const pubResult: PublishPinResult = await publishPinToPinterest(job, pin);

  if (pubResult.success && pubResult.pinId) {
    updateJobInState(job.id, j => {
      const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
      if (p) {
        p.publishStatus = 'published';
        p.pinterestPinId = pubResult.pinId;
        p.scheduledTime = slotTime;
        p.publishedAt = new Date().toISOString();
        p.errorMessage = undefined;
      }
      if (!Array.isArray(j.logs)) j.logs = [];
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Pinterest Slot ${slotTime} published Pin ${pin.pinNumber} (Pinterest Pin ID: ${pubResult.pinId}).`,
      });
      return j;
    });

    return {
      triggered: true,
      pinPublished: true,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      pinterestPinId: pubResult.pinId,
      reason: `Successfully published Pin ${pin.pinNumber} for job ${job.id}`,
    };
  } else {
    const errorMsg = pubResult.error || 'Pinterest API dispatch failed';
    // Differentiate permanent errors (400, 401, 403, 404, invalid board) from transient ones (429, 500, network)
    const isPermanent = /400|401|403|404|unauthorized|forbidden|invalid board|bad request/i.test(errorMsg);

    updateJobInState(job.id, j => {
      const p = j.pinterestPins?.find(item => item.pinNumber === pin.pinNumber);
      if (p) {
        p.publishStatus = 'failed';
        p.retryCount = (p.retryCount || 0) + 1;
        p.lastAttemptAt = new Date().toISOString();
        p.errorMessage = errorMsg;
        if (isPermanent || p.retryCount >= 3) {
          p.isPermanentFailure = true;
        }
      }
      if (!Array.isArray(j.logs)) j.logs = [];
      j.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Pinterest Slot ${slotTime} failed for Pin ${pin.pinNumber} (attempt ${(p?.retryCount || 1)}/3): ${errorMsg}`,
      });
      return j;
    });

    return {
      triggered: true,
      pinPublished: false,
      slotIndex,
      jobId: job.id,
      pinNumber: pin.pinNumber,
      error: pubResult.error,
      reason: `Failed to publish Pin ${pin.pinNumber}: ${pubResult.error}`,
    };
  }
}

/**
 * In strict 1-to-1 slot architecture, catch-up bundling is disabled to prevent
 * multi-pin bursts and ensure exactly 1 pin is dispatched per slot.
 */
export async function dispatchNextOverduePinterestPin(
  currentTimeStr: string,
  targetDateStr: string
): Promise<DispatchPinterestSlotResult | null> {
  const state = readEngineState();
  const config = state.config;
  if (!config.engineActive || config.autoPublishPinterest === false) return null;

  const slots = config.pinterestPublishTimes?.length ? config.pinterestPublishTimes : ['09:15'];
  const eligibleSlots = slots.filter(s => s <= currentTimeStr);
  if (eligibleSlots.length === 0) return null;

  const jobs = state.activeJobs
    .filter(j => j.assignedPublishDate === targetDateStr || (!j.assignedPublishDate && j.dateScheduled === targetDateStr))
    .sort((a, b) => ((a.assignedSlotTime || a.publicationScheduledAt || '')).localeCompare(b.assignedSlotTime || b.publicationScheduledAt || ''));

  const articlePublishTimes = config.articlePublishTimes?.length ? config.articlePublishTimes : ['09:00'];
  const pinsPerArt = Math.max(1, config.pinsPerArticle || 1);

  for (const slot of eligibleSlots) {
    const idx = slots.indexOf(slot);
    const articleIndex = Math.floor(idx / pinsPerArt);
    const pinIndex = idx % pinsPerArt;
    const targetArticleSlotTime = articlePublishTimes[articleIndex] || articlePublishTimes[0] || '09:00';

    let job = jobs.find(j => j.pinterestPins?.some(p => p.assignedSlotTime === slot || p.scheduledTime === slot));
    if (!job) {
      job = jobs.find(j => j.assignedSlotTime === targetArticleSlotTime || j.publicationScheduledAt === targetArticleSlotTime);
    }
    if (!job) {
      job = jobs[articleIndex];
    }

    let pin = job?.pinterestPins?.find(p => p.assignedSlotTime === slot || p.scheduledTime === slot);
    if (!pin) {
      pin = job?.pinterestPins?.[pinIndex];
    }

    if (!job || !pin || pin.publishStatus === 'published' || pin.pinterestPinId) continue;
    if (job.stage !== 'completed' || !job.publishedBlogPostId || job.publicationError) continue;
    if (pin.isPermanentFailure || (pin.retryCount && pin.retryCount >= 3)) continue;

    // Exponential backoff check: retry 1 wait 2m, retry 2 wait 5m
    if (pin.lastAttemptAt) {
      const backoffMs = (pin.retryCount || 1) * 2 * 60 * 1000;
      const elapsed = Date.now() - new Date(pin.lastAttemptAt).getTime();
      if (elapsed < backoffMs) continue;
    }

    const result = await dispatchScheduledPinterestSlot(slot, targetDateStr);
    if (result.pinPublished) return result;
  }
  return null;
}
