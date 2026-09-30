/**
 * SEO Content Engine - Pinterest Publisher
 * 
 * Reuses the existing Pinterest API integration (`createPinterestPin`) from `src/pinterest/pinterestApi.ts`.
 * Dispatches live Pinterest Pins for published articles, handles token resolution, and records Pinterest Pin IDs.
 */

import fs from 'fs';
import path from 'path';
import { PinterestCreativeConcept, SeoEngineArticleJob } from '../types';
import { createPinterestPin, getValidPinterestAccessToken } from '../../pinterest/pinterestApi';
import { getPinterestAuthRecord } from '../../pinterest/pinterestOAuth';

const SITE_URL = 'https://welovepattern.com';

export interface PublishPinResult {
  success: boolean;
  pinId?: string;
  pinUrl?: string;
  alreadyPublished?: boolean;
  error?: string;
}

/**
 * Publishes a single Pinterest creative concept to Pinterest using the existing Pinterest API integration.
 */
export async function publishPinToPinterest(
  job: SeoEngineArticleJob,
  pin: PinterestCreativeConcept
): Promise<PublishPinResult> {
  try {
    // 1. Idempotency Check
    if (pin.publishStatus === 'published' && pin.pinterestPinId) {
      return {
        success: true,
        pinId: pin.pinterestPinId,
        alreadyPublished: true,
      };
    }

    // 2. Pre-flight checks: Destination article and Image must exist
    if (!job.articleContent || !job.articleContent.slug) {
      return {
        success: false,
        error: 'Article content or slug is missing. Article must be generated before publishing Pin.',
      };
    }

    const destinationUrl = pin.destinationUrl || `${SITE_URL}/blog/${job.articleContent.slug}`;

    // Verify local image file exists
    if (!pin.stableAssetPath || !fs.existsSync(pin.stableAssetPath)) {
      return {
        success: false,
        error: `Pin image asset does not exist on disk at "${pin.stableAssetPath}".`,
      };
    }

    const pinImageUrl = pin.stablePublicUrl?.startsWith('http')
      ? pin.stablePublicUrl
      : `${SITE_URL}${pin.stablePublicUrl || ''}`;

    const boardId = pin.targetBoardId;
    if (!boardId) {
      return {
        success: false,
        error: 'Target Pinterest board ID is required.',
      };
    }

    // Pre-flight check: Pinterest connection
    const useSandbox = process.env.PINTEREST_USE_SANDBOX === 'true';
    const sandboxToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN?.trim();
    const authRecord = getPinterestAuthRecord();
    if (!useSandbox && (!authRecord || !authRecord.accessToken)) {
      console.warn('[PinterestPublisher] ⚠️ Pinterest account is not connected. Please connect Pinterest in Admin Settings.');
      return {
        success: false,
        error: 'Pinterest account is not connected. Please connect Pinterest in Admin Settings.',
      };
    }
    if (useSandbox && !sandboxToken) {
      console.warn('[PinterestPublisher] ⚠️ Pinterest Sandbox token is not configured on the server.');
      return {
        success: false,
        error: 'Pinterest Sandbox token is not configured on the server.',
      };
    }

    const title = pin.typographyOverlay.primaryHeadline || job.articleContent.title;
    const description = pin.typographyOverlay.supportingText || job.articleContent.excerpt || job.articleContent.title;

    console.log(`[PinterestPublisher] 📌 Dispatching Pin to Pinterest board "${pin.targetBoardName || boardId}"...`);

    // 3. Call existing Pinterest API helper
    const apiResult = await createPinterestPin({
      boardId,
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      link: destinationUrl,
      imageUrl: pinImageUrl,
    });

    if (!apiResult.success || !apiResult.pinId) {
      const errorMsg = apiResult.error || 'Pinterest API failed to create Pin.';
      console.error(`[PinterestPublisher] ❌ Failed to dispatch Pin: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[PinterestPublisher] ✅ Successfully published Pin "${title}" (Pinterest ID: ${apiResult.pinId})`);

    return {
      success: true,
      pinId: apiResult.pinId,
      pinUrl: `https://www.pinterest.com/pin/${apiResult.pinId}`,
    };
  } catch (err: any) {
    console.error('[PinterestPublisher] Unexpected exception publishing Pin:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected exception during Pinterest publishing',
    };
  }
}
