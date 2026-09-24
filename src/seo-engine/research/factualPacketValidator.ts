/**
 * SEO Content Engine - Factual Research Packet Validator
 * 
 * Strict quality gate ensuring every FactualResearchPacket complies with
 * technical crochet standards, contains zero hallucinated measurements or impossible gauges,
 * and only includes verified internal site links.
 */

import { FactualResearchPacket } from '../types';
import { isRouteValid } from '../generation/internalLinkCatalog';

export interface PacketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPacket: FactualResearchPacket;
}

const SUSPICIOUS_PATTERNS = [
  /\[insert\s+/i,
  /todo/i,
  /lorem\s+ipsum/i,
  /undefined/i,
  /null/i,
  /\$9999/
];

/**
 * Validates and sanitizes a FactualResearchPacket before passing to article generation.
 */
export function validateFactualResearchPacket(packet: FactualResearchPacket): PacketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Topic & Intent Check
  if (!packet.topic || packet.topic.trim().length < 3) {
    errors.push('Packet topic is missing or invalid');
  }

  // 2. Craft Type Check
  if (packet.craftType !== 'crochet') {
    errors.push(`Invalid craftType: "${packet.craftType}". Only "crochet" is supported.`);
  }

  // 3. Materials Validation: Hook Sizes
  const hookSizes = packet.verifiedMaterials?.hookSizes || [];
  if (hookSizes.length === 0) {
    errors.push('No hook sizes provided in verifiedMaterials.');
  } else {
    // Ensure at least one hook size specifies millimeter dimensions
    const hasMetricMm = hookSizes.some(h => /\d+(\.\d+)?\s*mm/i.test(h));
    if (!hasMetricMm) {
      warnings.push('Hook sizes should include metric millimeter (mm) dimensions.');
    }
  }

  // 4. Materials Validation: Yarn Weights
  const yarnWeights = packet.verifiedMaterials?.yarnWeights || [];
  if (yarnWeights.length === 0) {
    errors.push('No yarn weights specified in verifiedMaterials.');
  }

  // 5. Technique & Pain Points Depth
  if (!Array.isArray(packet.techniqueKeyPoints) || packet.techniqueKeyPoints.length < 2) {
    errors.push('Factual packet requires at least 2 distinct techniqueKeyPoints.');
  }

  if (!Array.isArray(packet.makerPainPoints) || packet.makerPainPoints.length < 2) {
    errors.push('Factual packet requires at least 2 makerPainPoints.');
  }

  // 6. FAQ Quality
  if (!Array.isArray(packet.faqItems) || packet.faqItems.length < 2) {
    warnings.push('Factual packet should ideally contain 3 FAQ items.');
  } else {
    for (const [idx, item] of packet.faqItems.entries()) {
      if (!item.question || item.question.length < 10) {
        errors.push(`FAQ item #${idx + 1} has insufficient question length.`);
      }
      if (!item.factualAnswer || item.factualAnswer.length < 20) {
        errors.push(`FAQ item #${idx + 1} answer is too brief or missing.`);
      }
    }
  }

  // 7. Verified Internal Links Audit
  const sanitizedLinks = [];
  for (const link of packet.verifiedInternalLinks || []) {
    if (isRouteValid(link.url)) {
      sanitizedLinks.push(link);
    } else {
      warnings.push(`Stripped unverified internal URL from packet: "${link.url}"`);
    }
  }

  // 8. Conflicting Factual Data Checks
  // e.g. using a tiny 1.5mm hook for Chunky/Bulky yarn, or a 10mm hook for Lace
  const hasLaceWeight = yarnWeights.some(w => /lace|#0/i.test(w));
  const hasJumboWeight = yarnWeights.some(w => /jumbo|super bulky|#6|#7/i.test(w));
  const hasTinyHookOnly = hookSizes.length > 0 && hookSizes.every(h => {
    const mm = parseFloat(h.match(/(\d+(\.\d+)?)\s*mm/i)?.[1] || '5');
    return mm <= 2.5;
  });
  const hasGiantHookOnly = hookSizes.length > 0 && hookSizes.every(h => {
    const mm = parseFloat(h.match(/(\d+(\.\d+)?)\s*mm/i)?.[1] || '5');
    return mm >= 9.0;
  });

  if (hasJumboWeight && hasTinyHookOnly) {
    errors.push('Conflicting technical data: Jumbo yarn (#6/#7) cannot be worked with hooks 2.5mm or smaller.');
  }
  if (hasLaceWeight && hasGiantHookOnly) {
    errors.push('Conflicting technical data: Lace weight (#0) cannot be standardly worked with giant hooks 9.0mm or larger.');
  }

  // 9. Prohibited formula validation inside packet
  if (packet.verifiedFormulas && packet.verifiedFormulas.length > 0) {
    for (const f of packet.verifiedFormulas) {
      if (/stitches\s+per\s+skein/i.test(f.description + f.formulaText)) {
        errors.push(`Packet contains prohibited formula metric: "${f.name}" mentions "stitches per skein".`);
      }
      if (!Array.isArray(f.steps) || f.steps.length < 2) {
        errors.push(`Formula "${f.name}" lacks sufficient step-by-step instructions.`);
      }
    }
  }

  // 10. Hallucination / Placeholder check across all text
  const serialized = JSON.stringify(packet);
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(`Detected placeholder or unverified token matching ${pattern.toString()}`);
    }
  }

  const defaultProhibitions = [
    'stitches per skein',
    'divide stitches by stitches per skein',
    'arbitrary yards per stitch',
    'invented mattress or bed sizes',
    'commercial sales pricing or revenue claims'
  ];

  const sanitizedPacket: FactualResearchPacket = {
    ...packet,
    sourceAuthority: packet.sourceAuthority || 'Craft Yarn Council Technical Standards',
    cycStandardVersion: packet.cycStandardVersion || 'CYC 2024 Guidelines',
    generatedAt: packet.generatedAt || new Date().toISOString(),
    prohibitedMetrics: Array.isArray(packet.prohibitedMetrics) && packet.prohibitedMetrics.length > 0
      ? packet.prohibitedMetrics
      : defaultProhibitions,
    authorizedPercentages: Array.isArray(packet.authorizedPercentages) && packet.authorizedPercentages.length > 0
      ? packet.authorizedPercentages
      : [10, 15, 20],
    verifiedInternalLinks: sanitizedLinks
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedPacket
  };
}
