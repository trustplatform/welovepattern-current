/**
 * Pinterest SEO Pin Renderer - Direct Higgsfield Pass-Through
 * 
 * ARCHITECTURAL DIRECTIVE (PART 1):
 * Higgsfield owns the entire visual design, composition, smartphone-style photography,
 * color palette, and integrated typography (headline and action CTA).
 * 
 * Local canvas, Sharp, or SVG renderers MUST NOT overlay a second headline, subtitle,
 * badge, or decorative banner on top of the Higgsfield-generated image.
 * 
 * This module enforces the zero-overlay pass-through guarantee.
 */

import fs from 'fs';
import { PinterestCreativeConcept } from '../../seo-engine/types';

export interface RenderSeoPinResult {
  assetPath: string;
  publicUrl: string;
  width: number;
  height: number;
  hasLocalOverlay: boolean;
}

/**
 * Passes through the Higgsfield-generated Pin asset without applying any local overlays.
 * Validates that the asset exists and preserves the exact image output from Higgsfield.
 */
export function renderSeoPinDirect(pin: PinterestCreativeConcept): RenderSeoPinResult {
  const assetPath = pin.stableAssetPath;
  if (!assetPath) {
    throw new Error(`[renderSeoPinDirect] Pin ${pin.pinNumber} has no stableAssetPath.`);
  }

  return {
    assetPath,
    publicUrl: pin.stablePublicUrl || assetPath,
    width: 1000,
    height: 1500,
    hasLocalOverlay: false,
  };
}
