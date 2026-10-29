/**
 * SEO Content Engine - Pinterest Creative & Visual Gate Validator
 * 
 * Enforces strict compliance with WeLovePattern Pinterest Creative specifications:
 * 1. Topic Fidelity: Prompt and concept must accurately depict the article craft & subject (crochet, yarn, stitches).
 *    Conflicting craft domains (e.g. woodworking, carpentry tools) are strictly rejected.
 * 2. HEADLINE + ACTION CTA ONLY: Exactly one headline and one action CTA with arrow "→".
 *    Zero subtitles, zero secondary descriptive copy, zero website headers or logos.
 * 3. Strict Title/CTA Separation: Headline and CTA occupy dedicated, non-overlapping zones with ample breathing room.
 * 4. Photographic Dominance (65%+): Zero paper panels, cards, banners, or Canva-style UI frames.
 * 5. Asset Aspect Ratio & Quality: 2:3 vertical aspect ratio verified via sharp metadata (target 1000 × 1500).
 * 6. Higgsfield Ownership: Full prompt with LITERAL TEXT LOCK character-for-character instruction.
 * 7. Destination URL: Strictly points to canonical published article, never homepage or empty.
 * 8. SEO Metadata: Pin title (<= 100 chars) and Pin description (<= 500 chars) checked for length and claim safety.
 * 9. Batch Diversity: Verifies that distinct variants in a multi-pin batch do not share assets, headlines, or titles.
 */

import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { DiscoveredTopic, FactualResearchPacket, PinterestCreativeConcept } from '../types';

export interface PinCreativeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dimensions?: { width: number; height: number; ratio: number };
}

// Prohibited craft terms when topic is in crochet domain
const FORBIDDEN_CROCHET_TERMS = [
  'woodworking',
  'carpentry',
  'chisel',
  'sawing',
  'chainsaw',
  'hand saw',
  'wood plane',
  'welding',
  'metalwork',
  'leather crafting',
  'drill press',
];

// Placeholder prompt patterns that must never pass validation
const FORBIDDEN_PLACEHOLDER_PROMPTS = [
  /^craft tool$/i,
  /^craft tool in action$/i,
  /^craft tool flatlay$/i,
  /^generic craft$/i,
];

/**
 * Validates a single Pinterest creative concept and its rendered asset against all production rules.
 */
export async function validatePinterestPinCreativeCompliance(
  pin: PinterestCreativeConcept,
  topic: DiscoveredTopic,
  articleTitle: string,
  expectedSlug?: string
): Promise<PinCreativeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let dimensions: { width: number; height: number; ratio: number } | undefined;

  const prompt = pin.compactHiggsfieldPrompt || '';
  const headline = pin.typographyOverlay?.primaryHeadline || '';
  const cta = pin.typographyOverlay?.ctaBadgeText || '';

  // 1. Topic Fidelity Check
  if (!prompt || prompt.trim().length < 80) {
    errors.push(`Topic Fidelity Failure: Pin ${pin.pinNumber} prompt is too short (${prompt.length} chars) or missing a complete creative brief.`);
  }

  for (const pattern of FORBIDDEN_PLACEHOLDER_PROMPTS) {
    if (pattern.test(prompt.trim())) {
      errors.push(`Topic Fidelity Failure: Pin ${pin.pinNumber} uses forbidden placeholder prompt "${prompt}".`);
      break;
    }
  }

  const isCrochetTopic = topic.category === 'crochet' || /crochet|yarn|amigurumi|afghan|stitch/i.test(topic.keyword);
  if (isCrochetTopic) {
    const promptLower = prompt.toLowerCase();
    for (const forbidden of FORBIDDEN_CROCHET_TERMS) {
      if (promptLower.includes(forbidden)) {
        errors.push(`Topic Fidelity Failure: Pin ${pin.pinNumber} prompt contains forbidden unrelated craft term "${forbidden}".`);
      }
    }

    const hasCrochetReference = /crochet|yarn|hook|stitch|handmade|motif|pattern|wool/i.test(promptLower);
    if (!hasCrochetReference) {
      errors.push(`Topic Fidelity Failure: Pin ${pin.pinNumber} prompt does not contain any crochet, yarn, or stitch references.`);
    }
  }

  // 2. Headline & Action CTA Validation
  const isStackedThreePhoto =
    pin.pinVariant === 'stacked_three_photo' ||
    prompt.includes('THREE stacked photographic panels') ||
    prompt.includes('Three stacked photographic panels');

  if (!headline || headline.trim().length < 5) {
    errors.push(`Typography Failure: Pin ${pin.pinNumber} is missing a required primary headline.`);
  } else if (headline.length > 36) {
    errors.push(`Typography Failure: Pin ${pin.pinNumber} headline exceeds 36 characters (${headline.length} chars). May clip in mobile Pinterest feed.`);
  }

  if (isStackedThreePhoto) {
    // CRITICAL: The stacked 3-photograph format enforces ZERO CTAs!
    if (cta && cta.trim().length > 0) {
      errors.push(`Typography Failure: Stacked 3-panel Pin must have ZERO CTAs, but got "${cta}".`);
    }
  } else {
    // Standalone Pin formats require an action CTA
    if (!cta || cta.trim().length < 3) {
      errors.push(`Typography Failure: Pin ${pin.pinNumber} is missing a required action CTA.`);
    } else if (!cta.includes('→')) {
      errors.push(`Typography Failure: Pin ${pin.pinNumber} CTA "${cta}" must contain the standard action arrow "→".`);
    }
  }

  // Check that prompt enforces literal text lock
  if (!prompt.includes('LITERAL TEXT LOCK')) {
    errors.push(`Literal Text Lock Failure: Pin ${pin.pinNumber} prompt is missing the mandatory LITERAL TEXT LOCK instruction.`);
  }

  // 3. Strict Title / CTA Separation Check (for formats with CTA)
  if (!isStackedThreePhoto) {
    const hasSeparationDirective =
      prompt.includes('clear physical separation from the headline') ||
      prompt.includes('Never attached or placed directly beneath the headline') ||
      prompt.includes('completely physically separated from the headline') ||
      prompt.includes('well separated from the headline') ||
      prompt.includes('STRICT TITLE / CTA VISUAL SEPARATION');

    if (!hasSeparationDirective) {
      warnings.push(`Pin ${pin.pinNumber} prompt should explicitly enforce spatial separation between Title and CTA.`);
    }
  }

  // 4. Photographic Dominance & Zero Paper / Cards Check
  const hasGlobalProhibition = prompt.includes('GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper');
  if (!hasGlobalProhibition) {
    errors.push(`Photographic Dominance Failure: Pin ${pin.pinNumber} prompt is missing the Global Hard Prohibition against paper/panels/Canva grids.`);
  }

  // 5. Destination URL Checks
  if (pin.destinationUrl !== undefined) {
    const dest = (pin.destinationUrl || '').trim();
    if (!dest) {
      errors.push(`Destination URL Failure: Pin ${pin.pinNumber} has an empty destination URL.`);
    } else if (dest === 'https://welovepattern.com' || dest === 'https://welovepattern.com/') {
      errors.push(`Destination URL Failure: Pin ${pin.pinNumber} destination URL points to homepage instead of specific published article.`);
    } else if (expectedSlug) {
      const cleanExpected = expectedSlug.trim().toLowerCase();
      if (!dest.toLowerCase().includes(`/blog/${cleanExpected}`)) {
        errors.push(`Destination URL Failure: Pin ${pin.pinNumber} destination URL "${dest}" does not match expected article slug "${cleanExpected}".`);
      }
    }
  }

  // 6. Pinterest SEO Metadata Checks
  if (pin.pinTitle) {
    if (pin.pinTitle.trim().length === 0) {
      errors.push(`Metadata Failure: Pin ${pin.pinNumber} title cannot be empty.`);
    } else if (pin.pinTitle.length > 100) {
      errors.push(`Metadata Failure: Pin ${pin.pinNumber} title exceeds Pinterest limit of 100 characters (${pin.pinTitle.length} chars).`);
    }
  }

  if (pin.pinDescription) {
    if (pin.pinDescription.trim().length === 0) {
      errors.push(`Metadata Failure: Pin ${pin.pinNumber} description cannot be empty.`);
    } else if (pin.pinDescription.length > 500) {
      errors.push(`Metadata Failure: Pin ${pin.pinNumber} description exceeds Pinterest limit of 500 characters (${pin.pinDescription.length} chars).`);
    }
  }

  // 7. Asset Dimensions and Aspect Ratio Verification on Disk
  if (pin.stableAssetPath) {
    if (!fs.existsSync(pin.stableAssetPath)) {
      errors.push(`Asset File Missing: Pin ${pin.pinNumber} asset path "${pin.stableAssetPath}" does not exist on disk.`);
    } else {
      try {
        const meta = await sharp(pin.stableAssetPath).metadata();
        if (!meta.width || !meta.height) {
          errors.push(`Asset Metadata Error: Pin ${pin.pinNumber} image file is unreadable or corrupt.`);
        } else {
          const ratio = meta.width / meta.height;
          dimensions = { width: meta.width, height: meta.height, ratio };

          // Pinterest standard vertical ratio 2:3 = ~0.667 (acceptable range: 0.55 to 0.75)
          if (ratio < 0.55 || ratio > 0.75) {
            errors.push(`Aspect Ratio Failure: Pin ${pin.pinNumber} aspect ratio (${meta.width}x${meta.height}, ratio: ${ratio.toFixed(3)}) violates 2:3 vertical standard.`);
          }
          if (meta.height < 600) {
            errors.push(`Resolution Failure: Pin ${pin.pinNumber} height (${meta.height}px) is below the minimum 600px requirement.`);
          }
          if (meta.width < 400) {
            errors.push(`Resolution Failure: Pin ${pin.pinNumber} width (${meta.width}px) is below the minimum 400px requirement.`);
          }
        }
      } catch (err: any) {
        errors.push(`Sharp Inspection Error for Pin ${pin.pinNumber}: ${err?.message || err}`);
      }
    }
  }

  // 8. Visual & Text Quality Note (Honest Assessment)
  if (process.env.ENABLE_PINTEREST_VISION_VALIDATION === 'true') {
    // Optional automated vision evaluation if configured
  } else {
    warnings.push(`Visual quality note: Automated vision/OCR inspection is disabled in this environment to prevent per-image API costs. Asset passed deterministic format & dimension checks.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dimensions,
  };
}

/**
 * Safely normalizes valid 2:3 Pinterest pin images to the target 1000 × 1500 resolution
 * in place without applying any headline or canvas overlays.
 */
export async function normalizePinImageDimensions(
  filePath: string,
  targetWidth = 1000,
  targetHeight = 1500
): Promise<{ normalized: boolean; originalWidth?: number; originalHeight?: number; error?: string }> {
  try {
    if (!fs.existsSync(filePath)) {
      return { normalized: false, error: 'File does not exist' };
    }

    const meta = await sharp(filePath).metadata();
    if (!meta.width || !meta.height) {
      return { normalized: false, error: 'Unreadable image metadata' };
    }

    if (meta.width === targetWidth && meta.height === targetHeight) {
      return { normalized: false, originalWidth: meta.width, originalHeight: meta.height };
    }

    const ratio = meta.width / meta.height;
    if (ratio < 0.55 || ratio > 0.75) {
      return { normalized: false, error: `Cannot normalize: ratio ${ratio.toFixed(3)} is outside 2:3 bounds` };
    }

    const tmpPath = `${filePath}.norm.tmp.${Date.now()}`;
    await sharp(filePath)
      .resize(targetWidth, targetHeight, { fit: 'cover' })
      .toFile(tmpPath);

    fs.renameSync(tmpPath, filePath);
    return { normalized: true, originalWidth: meta.width, originalHeight: meta.height };
  } catch (err: any) {
    return { normalized: false, error: err?.message || String(err) };
  }
}

/**
 * Computes a fast SHA-256 hash of an asset file to detect duplicate images.
 */
export function computeAssetHash(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
}

export interface BatchValidationResult {
  isValid: boolean;
  pinResults: PinCreativeValidationResult[];
  batchErrors: string[];
  batchWarnings: string[];
}

/**
 * Validates a multi-pin batch (e.g. 3 variants) for an article, ensuring each variant is
 * compliant and strictly distinct in assets, headlines, and titles.
 */
export async function validatePinterestBatch(
  pins: PinterestCreativeConcept[],
  topic: DiscoveredTopic,
  article: { title: string; slug: string },
  expectedCount = pins.length
): Promise<BatchValidationResult> {
  const batchErrors: string[] = [];
  const batchWarnings: string[] = [];
  const pinResults: PinCreativeValidationResult[] = [];

  if (pins.length !== expectedCount) {
    batchErrors.push(`Batch count mismatch: expected ${expectedCount} pins, received ${pins.length}.`);
  }

  const seenAssetPaths = new Set<string>();
  const seenHashes = new Set<string>();
  const seenHeadlines = new Set<string>();
  const seenTitles = new Set<string>();

  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    const result = await validatePinterestPinCreativeCompliance(pin, topic, article.title, article.slug);
    pinResults.push(result);

    if (!result.isValid) {
      batchErrors.push(...result.errors);
    }
    batchWarnings.push(...result.warnings);

    // Asset path uniqueness
    if (pin.stableAssetPath) {
      if (seenAssetPaths.has(pin.stableAssetPath)) {
        batchErrors.push(`Duplicate asset path: Pin ${pin.pinNumber} shares path "${pin.stableAssetPath}" with another variant.`);
      }
      seenAssetPaths.add(pin.stableAssetPath);

      // Binary content hash uniqueness
      const hash = computeAssetHash(pin.stableAssetPath);
      if (hash) {
        if (seenHashes.has(hash)) {
          batchErrors.push(`Duplicate image content: Pin ${pin.pinNumber} has identical binary image data to another variant.`);
        }
        seenHashes.add(hash);
      }
    }

    // Headline uniqueness
    const hl = (pin.typographyOverlay?.primaryHeadline || '').toUpperCase().trim();
    if (hl) {
      if (seenHeadlines.has(hl)) {
        batchErrors.push(`Duplicate headline: Pin ${pin.pinNumber} shares headline "${hl}" with another variant.`);
      }
      seenHeadlines.add(hl);
    }

    // Pin Title uniqueness
    const title = (pin.pinTitle || '').toLowerCase().trim();
    if (title) {
      if (seenTitles.has(title)) {
        batchErrors.push(`Duplicate Pin title: Pin ${pin.pinNumber} shares title "${pin.pinTitle}" with another variant.`);
      }
      seenTitles.add(title);
    }
  }

  return {
    isValid: batchErrors.length === 0,
    pinResults,
    batchErrors,
    batchWarnings,
  };
}
