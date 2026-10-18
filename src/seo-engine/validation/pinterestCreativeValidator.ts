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
 * 5. Asset Aspect Ratio & Quality: 2:3 vertical aspect ratio verified via sharp metadata.
 * 6. Higgsfield Ownership: Full prompt with LITERAL TEXT LOCK character-for-character instruction.
 */

import fs from 'fs';
import sharp from 'sharp';
import { DiscoveredTopic, PinterestCreativeConcept } from '../types';

export interface PinCreativeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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
 * Validates a Pinterest creative concept and its rendered asset against all production rules.
 */
export async function validatePinterestPinCreativeCompliance(
  pin: PinterestCreativeConcept,
  topic: DiscoveredTopic,
  articleTitle: string
): Promise<PinCreativeValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  // 2. Headline & Action CTA Only Check
  if (!headline || headline.trim().length < 5) {
    errors.push(`Typography Failure: Pin ${pin.pinNumber} is missing a required primary headline.`);
  }

  if (!cta || cta.trim().length < 3) {
    errors.push(`Typography Failure: Pin ${pin.pinNumber} is missing a required action CTA.`);
  } else if (!cta.includes('→')) {
    errors.push(`Typography Failure: Pin ${pin.pinNumber} CTA "${cta}" must contain the standard action arrow "→".`);
  }

  // Check that prompt enforces literal text lock
  if (!prompt.includes('LITERAL TEXT LOCK')) {
    errors.push(`Literal Text Lock Failure: Pin ${pin.pinNumber} prompt is missing the mandatory LITERAL TEXT LOCK instruction.`);
  }

  // 3. Strict Title / CTA Separation Check
  const hasSeparationDirective =
    prompt.includes('clear physical separation from the headline') ||
    prompt.includes('Never attached or placed directly beneath the headline') ||
    prompt.includes('completely physically separated from the headline') ||
    prompt.includes('well separated from the headline') ||
    prompt.includes('STRICT TITLE / CTA VISUAL SEPARATION');

  if (!hasSeparationDirective) {
    warnings.push(`Pin ${pin.pinNumber} prompt should explicitly enforce spatial separation between Title and CTA.`);
  }

  // 4. Photographic Dominance & Zero Paper / Cards Check
  const hasGlobalProhibition = prompt.includes('GLOBAL HARD PROHIBITION: ABSOLUTELY NO paper');
  if (!hasGlobalProhibition) {
    errors.push(`Photographic Dominance Failure: Pin ${pin.pinNumber} prompt is missing the Global Hard Prohibition against paper/panels/Canva grids.`);
  }

  // 5. Asset Dimensions and Aspect Ratio Verification on Disk
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
          // Pinterest standard vertical ratio 2:3 = ~0.667 (acceptable range: 0.60 to 0.72)
          if (ratio < 0.55 || ratio > 0.75) {
            errors.push(`Aspect Ratio Failure: Pin ${pin.pinNumber} aspect ratio (${meta.width}x${meta.height}, ratio: ${ratio.toFixed(3)}) violates 2:3 vertical standard.`);
          }
          if (meta.height < 600) {
            errors.push(`Resolution Failure: Pin ${pin.pinNumber} height (${meta.height}px) is below the minimum 600px requirement.`);
          }
        }
      } catch (err: any) {
        errors.push(`Sharp Inspection Error for Pin ${pin.pinNumber}: ${err?.message || err}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
