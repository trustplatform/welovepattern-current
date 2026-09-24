/**
 * SEO Content Engine - Dedicated Higgsfield Image Generation Client
 * 
 * Generates photorealistic craft imagery for Article Heroes and Pinterest Pins.
 * 
 * ENVIRONMENT CONFIGURATION:
 * Primary variable: process.env.HF_KEY (standard production secret)
 * Fallback variable: process.env.HIGGSFIELD_API_KEY
 * 
 * PERSISTENT STORAGE:
 * Automatically downloads provider CDN assets to permanent local storage:
 * - Articles: `public/generated/blog/`
 * - Pins: `public/generated/pinterest/seo-pins/`
 * 
 * Guarantees zero broken external image links and stable asset filenames.
 * Avoids any transient CDN URLs.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { recordCostTransaction } from '../cost/costTracker';
import { SEO_ENGINE_STORAGE_PATHS } from '../config';

export interface HiggsfieldGenerationOptions {
  prompt: string;
  aspectRatio: '1:1' | '2:3' | '3:4' | '16:9';
  resolution?: '1k' | string;
  slug: string;
  targetFolder?: 'blog' | 'pinterest';
  jobId?: string;
  timeoutMs?: number;
  existingTaskId?: string;
  onTaskIdReceived?: (taskId: string) => void;
  estimatedCostUsd?: number;
}

export interface HiggsfieldGenerationResult {
  success: boolean;
  notConfigured?: boolean;
  stableAssetPath?: string;
  stablePublicUrl?: string;
  providerRequestId?: string;
  costUsd?: number;
  error?: string;
}

/**
 * Resolves the configured Higgsfield API key from production environment.
 * Primary: HF_KEY
 * Secondary: HIGGSFIELD_API_KEY
 */
export function getHiggsfieldApiKey(): string | undefined {
  const key = process.env.HF_KEY || process.env.HIGGSFIELD_API_KEY;
  if (!key || typeof key !== 'string') return undefined;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Checks whether Higgsfield is configured on the server.
 */
export function isHiggsfieldConfigured(): boolean {
  return Boolean(getHiggsfieldApiKey());
}

/**
 * Tests Higgsfield API connectivity and authentication without exposing the key.
 */
export async function testHiggsfieldAuthentication(): Promise<{
  configured: boolean;
  authenticated: boolean;
  statusCode?: number;
  message: string;
}> {
  const apiKey = getHiggsfieldApiKey();
  if (!apiKey) {
    return {
      configured: false,
      authenticated: false,
      message: 'Higgsfield is not configured. Neither HF_KEY nor HIGGSFIELD_API_KEY is set in environment.'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Call user / models info endpoint to verify authentication
    const response = await fetch('https://api.higgsfield.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.status === 401 || response.status === 403) {
      return {
        configured: true,
        authenticated: false,
        statusCode: response.status,
        message: `Authentication failed (HTTP ${response.status}). Key was rejected.`
      };
    }

    return {
      configured: true,
      authenticated: response.ok,
      statusCode: response.status,
      message: response.ok
        ? 'Higgsfield authenticated successfully.'
        : `Higgsfield endpoint returned HTTP ${response.status}`
    };
  } catch (err: any) {
    return {
      configured: true,
      authenticated: false,
      message: `Network check error: ${err?.message || 'Connection timeout'}`
    };
  }
}

/**
 * Generates a stable deterministic filename based on slug and prompt hash.
 */
export function generateStableImageFilename(slug: string, prompt: string, ext = 'jpg'): string {
  const hash = crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex').substring(0, 10);
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
  return `${cleanSlug}-${hash}.${ext}`;
}

/**
 * Polls for completion of an asynchronous Higgsfield generation task.
 * Fails immediately on fatal HTTP 401, 403, and 404 responses while retrying transient errors.
 */
async function pollHiggsfieldTask(
  taskId: string,
  apiKey: string,
  maxWaitMs: number,
  explicitStatusUrl?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; fatalStatus?: number }> {
  const startTime = Date.now();
  const pollIntervalMs = 2500;

  const candidateUrls = explicitStatusUrl
    ? [explicitStatusUrl]
    : taskId.startsWith('http')
    ? [taskId]
    : [
        `https://platform.higgsfield.ai/requests/${taskId}/status`,
        `https://api.higgsfield.ai/requests/${taskId}/status`,
        `https://api.higgsfield.ai/v1/generations/${taskId}`,
      ];

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    for (const url of candidateUrls) {
      try {
        const resp = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        });

        if (!resp.ok) {
          // Immediate failure on fatal client/auth/not-found errors
          if (resp.status === 401 || resp.status === 403) {
            return {
              success: false,
              error: `Higgsfield task check failed with fatal HTTP ${resp.status}.`,
              fatalStatus: resp.status,
            };
          }
          if (resp.status === 404 && candidateUrls.length === 1) {
            return {
              success: false,
              error: `Higgsfield task not found (HTTP 404).`,
              fatalStatus: 404,
            };
          }
          // Transient error (5xx, 429, etc.), keep retrying until timeout
          continue;
        }

        const data: any = await resp.json();
        const status = data?.status?.toLowerCase();

        if (status === 'completed' || status === 'succeeded' || status === 'done') {
          const rawUrl =
            data?.output_url ||
            data?.image_url ||
            data?.result?.[0]?.url ||
            data?.images?.[0] ||
            data?.media?.[0]?.url ||
            data?.url;
          const urlStr = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || undefined);
          if (urlStr) {
            return { success: true, imageUrl: urlStr };
          }
          return { success: false, error: 'Higgsfield task completed but no image URL was returned.' };
        }

        if (status === 'failed' || status === 'error' || status === 'nsfw') {
          return {
            success: false,
            error: data?.error?.message || data?.error || `Generation task ${status} on Higgsfield`,
          };
        }

        // Status is in_progress, queued, or processing; continue polling
        break;
      } catch {
        // Continue polling until timeout on transient network issues
      }
    }
  }

  return { success: false, error: `Polling timed out after ${maxWaitMs / 1000}s` };
}

/**
 * Generates an image via Higgsfield and saves it directly to local disk.
 */
export async function generateHiggsfieldImage(
  options: HiggsfieldGenerationOptions
): Promise<HiggsfieldGenerationResult> {
  const {
    prompt,
    aspectRatio,
    resolution = '1k',
    slug,
    targetFolder = 'blog',
    jobId,
    timeoutMs = 60000,
    existingTaskId,
    onTaskIdReceived,
    estimatedCostUsd = 0.03,
  } = options;

  // Determine local target directory
  const relativeDir = targetFolder === 'blog'
    ? SEO_ENGINE_STORAGE_PATHS.BLOG_IMAGES_DIR
    : SEO_ENGINE_STORAGE_PATHS.SEO_PINS_DIR;
  const absoluteDir = path.resolve(process.cwd(), relativeDir);

  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  const filename = generateStableImageFilename(slug, prompt);
  const localFilePath = path.join(absoluteDir, filename);
  const publicUrl = `/${relativeDir}/${filename}`;

  // 1. Duplicate check: If asset already exists on local disk, reuse it immediately (idempotency)
  if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 100) {
    return {
      success: true,
      stableAssetPath: localFilePath,
      stablePublicUrl: publicUrl,
      costUsd: 0,
    };
  }

  // 2. Configuration check
  const apiKey = getHiggsfieldApiKey();
  if (!apiKey) {
    return {
      success: false,
      notConfigured: true,
      error: 'HF_KEY is not configured on the server. Image generation paused.',
    };
  }

  const estimatedCost = typeof estimatedCostUsd === 'number' && estimatedCostUsd > 0 ? estimatedCostUsd : 0.03;
  let currentTaskId: string | undefined = existingTaskId;
  let cdnUrl: string | undefined;

  try {
    // 3. Resume existing remote task OR create a new generation request
    if (existingTaskId) {
      // Direct polling of existing task without creating a duplicate paid POST request
      const pollResult = await pollHiggsfieldTask(existingTaskId, apiKey, 45000);
      if (!pollResult.success || !pollResult.imageUrl) {
        return {
          success: false,
          providerRequestId: existingTaskId,
          error: pollResult.error || 'Failed to obtain generated image from existing task polling',
        };
      }
      cdnUrl = pollResult.imageUrl;
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Initial generation request - Higgsfield Marketing Studio Image 2.0 Alpha API
      const response = await fetch('https://api.higgsfield.ai/marketing-studio/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.slice(0, 480),
          resolution: '1k',
          aspect_ratio: aspectRatio,
          enhance_prompt: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          error: `Higgsfield API responded with HTTP ${response.status}: ${errorText.slice(0, 200)}`,
        };
      }

      const data: any = await response.json();
      currentTaskId = data?.id || data?.request_id || data?.requestId;

      // Immediately notify caller of remote task ID so it can be saved before polling
      if (currentTaskId && typeof onTaskIdReceived === 'function') {
        try {
          onTaskIdReceived(currentTaskId);
        } catch (cbErr) {
          console.warn('[HiggsfieldClient] onTaskIdReceived callback threw:', cbErr);
        }
      }

      const rawUrl =
        data?.image_url ||
        data?.output_url ||
        data?.result?.[0]?.url ||
        data?.images?.[0] ||
        data?.media?.[0]?.url ||
        data?.url;
      cdnUrl = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || undefined);

      // If response is async task, poll for completion
      if (!cdnUrl && currentTaskId) {
        const pollResult = await pollHiggsfieldTask(
          currentTaskId,
          apiKey,
          45000,
          data?.status_url || data?.statusUrl
        );
        if (!pollResult.success || !pollResult.imageUrl) {
          return {
            success: false,
            providerRequestId: currentTaskId,
            error: pollResult.error || 'Failed to obtain generated image from Higgsfield polling task',
          };
        }
        cdnUrl = pollResult.imageUrl;
      }
    }

    if (!cdnUrl) {
      return {
        success: false,
        providerRequestId: currentTaskId,
        error: 'Higgsfield did not return a valid image URL or task ID',
      };
    }

    // 4. Download provider CDN image and save directly to permanent local storage
    const imageResponse = await fetch(cdnUrl);
    if (!imageResponse.ok) {
      return {
        success: false,
        providerRequestId: currentTaskId,
        error: `Failed to download image from CDN: HTTP ${imageResponse.status}`,
      };
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    if (buffer.length < 500) {
      return {
        success: false,
        providerRequestId: currentTaskId,
        error: 'Downloaded image file is truncated or invalid',
      };
    }

    fs.writeFileSync(localFilePath, buffer);

    recordCostTransaction({
      jobId,
      provider: 'higgsfield',
      operation: 'image_generation',
      unitsConsumed: 1,
      costUsd: estimatedCost,
      meta: { prompt: prompt.slice(0, 100), targetFolder },
    });

    return {
      success: true,
      stableAssetPath: localFilePath,
      stablePublicUrl: publicUrl,
      providerRequestId: currentTaskId,
      costUsd: estimatedCost,
    };
  } catch (err: any) {
    const safeMsg = err?.message?.replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED_AUTH]') || 'Network failure';
    return {
      success: false,
      providerRequestId: currentTaskId,
      error: `Higgsfield Generation Error: ${safeMsg}`,
    };
  }
}
