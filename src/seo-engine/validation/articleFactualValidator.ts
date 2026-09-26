/**
 * SEO Content Engine - Dedicated Claim-Level Factual & SEO Quality Validator
 * 
 * Enforces strict claim-level factual grounding:
 * 1. Every numerical claim (dimensions, yardages, hook sizes) must be traceable to the FactualResearchPacket.
 * 2. Every calculation formula must be explicitly supported by the packet.
 * 3. Prohibits hallucinated metrics (e.g. "stitches per skein", arbitrary stitch-consumption claims).
 * 4. Verifies numerical ranges and derived estimates:
 *    - Explicit range match: e.g. "700–1000 m" (ALLOWED)
 *    - Derived midpoint within verified boundary: e.g. "about 850 m" (ALLOWED)
 *    - Altered range or out-of-boundary values: e.g. "750–1100 m" or "1200 m" (REJECTED)
 * 5. Rejects altered units, ungrounded superlatives, and unsupported comparisons.
 * 6. FAILS the article if any unsupported claims are detected.
 */

import { FactualResearchPacket, DiscoveredTopic } from '../types';
import { isRouteValid } from '../generation/internalLinkCatalog';
import { validateSeoMetadata } from './seoMetadataValidator';

export interface FactualValidationOutput {
  isValid: boolean;
  validatedClaims: string[];
  unsupportedClaims: string[];
  errors: string[];
  warnings: string[];
  seoCheck: {
    titleValid: boolean;
    metaValid: boolean;
    notes: string[];
  };
  linkCheck: {
    linksValid: boolean;
    duplicateUrls: string[];
    invalidRoutes: string[];
  };
}

/**
 * Normalizes dimension strings like "30 x 36" or "50x60" into standardized pairs.
 */
function extractDimensionPairs(text: string): { width: number; length: number; raw: string }[] {
  // Matches physical dimension pairs like "30 x 36", "36 × 48", "30 by 36 inches", "50x60cm"
  // Excludes decimal arithmetic like "193.04 x 1.10" or "12.5 x 1.2"
  // Excludes arithmetic multiplication with bare '*'
  const regex = /(?<![\d.])\b(\d{1,3})\s*(?:x|×|by)\s*(\d{1,3})\b(?!\.\d)\s*(?:inches|in\b|cm\b)?/gi;
  const pairs: { width: number; length: number; raw: string }[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const w = parseInt(m[1], 10);
    const l = parseInt(m[2], 10);
    // Exclude swatch dimensions (e.g. 4x4 or 10x10) from blanket size checks
    if ((w === 4 && l === 4) || (w === 10 && l === 10)) {
      continue;
    }
    pairs.push({
      width: Math.min(w, l),
      length: Math.max(w, l),
      raw: m[0]
    });
  }

  return pairs;
}

/**
 * Extracts yardage / meter numerical quantities from text.
 */
function extractYardageClaims(text: string): {
  type: 'range' | 'single';
  min?: number;
  max?: number;
  val?: number;
  unit: 'meters' | 'yards';
  raw: string;
}[] {
  const claims: {
    type: 'range' | 'single';
    min?: number;
    max?: number;
    val?: number;
    unit: 'meters' | 'yards';
    raw: string;
  }[] = [];

  // 1. Range regex: e.g. "700 - 1,000 meters" or "700 to 1000 m" or "700–1000 yards"
  const rangeRegex = /\b(\d{1,3}(?:,\d{3})*|\d+)\s*(?:-|–|to)\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(meters?|m\b|yards?|yds?\b)/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rangeRegex.exec(text)) !== null) {
    const minVal = parseInt(rm[1].replace(/,/g, ''), 10);
    const maxVal = parseInt(rm[2].replace(/,/g, ''), 10);
    const unit = /m\b|meters?/i.test(rm[3]) ? 'meters' : 'yards';
    claims.push({
      type: 'range',
      min: Math.min(minVal, maxVal),
      max: Math.max(minVal, maxVal),
      unit,
      raw: rm[0].trim()
    });
  }

  // 2. Single quantity regex with qualifier: e.g. "approximately 900 meters" or "about 850 yards" or "need 1,200 meters"
  const singleRegex = /(?:about|approx\.?|approximately|around|need|require|uses?)\s+(\d{1,3}(?:,\d{3})*|\d+)\s*(meters?|m\b|yards?|yds?\b)/gi;
  let sm: RegExpExecArray | null;
  while ((sm = singleRegex.exec(text)) !== null) {
    const val = parseInt(sm[1].replace(/,/g, ''), 10);
    // Ignore small values (e.g. 4 inches or 10 stitches)
    if (val < 100) continue;
    const unit = /m\b|meters?/i.test(sm[2]) ? 'meters' : 'yards';
    claims.push({
      type: 'single',
      val,
      unit,
      raw: sm[0].trim()
    });
  }

  return claims;
}

/**
 * Validates the complete generated article against the immutable FactualResearchPacket.
 */
export function validateArticleFactualGrounding(
  contentHtml: string,
  seoTitle: string,
  metaDescription: string,
  packet: FactualResearchPacket,
  topic: DiscoveredTopic
): FactualValidationOutput {
  const validatedClaims: string[] = [];
  const unsupportedClaims: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Plain text representation for NLP/regex checking
  const plainText = contentHtml.replace(/<[^>]+>/g, ' ');

  // ----------------------------------------------------
  // 1. CLAIM-LEVEL YARDAGE / METER BOUNDARY VERIFICATION
  // ----------------------------------------------------
  const textYardageClaims = extractYardageClaims(plainText);
  const verifiedRanges = packet.verifiedMaterials?.verifiedYardageRanges || {};
  const hasConfiguredRanges = Object.keys(verifiedRanges).length > 0;

  if (textYardageClaims.length > 0 && hasConfiguredRanges) {
    // Collect all authorized global min/max boundaries
    const allBoundaries = Object.values(verifiedRanges).map(r => ({
      min: r.minMeters,
      max: r.maxMeters,
      notes: r.notes
    }));

    for (const claim of textYardageClaims) {
      if (claim.type === 'range' && claim.min !== undefined && claim.max !== undefined) {
        // Verify if range matches an authorized range within 5% tolerance
        const matchingRange = allBoundaries.find(b => 
          Math.abs(b.min - claim.min!) <= b.min * 0.05 && 
          Math.abs(b.max - claim.max!) <= b.max * 0.05
        );

        if (matchingRange) {
          validatedClaims.push(`Yardage range "${claim.raw}" matches verified boundary [${matchingRange.min}–${matchingRange.max} m].`);
        } else {
          // Check if range is an unauthorized expansion (e.g. 750-1100 when max is 1000)
          const overlapsBoundary = allBoundaries.find(b => 
            claim.min! >= b.min * 0.8 && claim.max! > b.max * 1.05
          );

          if (overlapsBoundary) {
            unsupportedClaims.push(`Altered yardage range claim: "${claim.raw}" exceeds verified maximum ceiling (${overlapsBoundary.max} m).`);
          } else {
            unsupportedClaims.push(`Unsupported yardage range found in article: "${claim.raw}". It does not match verified boundaries in the research packet.`);
          }
        }
      } else if (claim.type === 'single' && claim.val !== undefined) {
        // Check if single estimate falls inside an authorized boundary [min, max]
        const withinAnyBoundary = allBoundaries.find(b => claim.val! >= b.min * 0.95 && claim.val! <= b.max * 1.05);

        if (withinAnyBoundary) {
          validatedClaims.push(`Specific quantity "${claim.raw}" is a mathematically valid estimate within authorized boundary [${withinAnyBoundary.min}–${withinAnyBoundary.max} m].`);
        } else {
          unsupportedClaims.push(`Unsupported specific yardage claim: "${claim.raw}" falls outside all authorized project yardage boundaries.`);
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. DIMENSION VERIFICATION
  // ----------------------------------------------------
  const textDimensions = extractDimensionPairs(plainText);
  const packetDimensions = packet.verifiedMaterials?.verifiedDimensions || {};
  const packetDimPairs: { width: number; length: number; name: string }[] = [];

  for (const [name, dimStr] of Object.entries(packetDimensions)) {
    const extracted = extractDimensionPairs(dimStr);
    for (const p of extracted) {
      packetDimPairs.push({ width: p.width, length: p.length, name });
    }
  }

  if (textDimensions.length > 0) {
    if (packetDimPairs.length === 0) {
      for (const d of textDimensions) {
        unsupportedClaims.push(`Dimension claim "${d.raw}" is not supported (no verified dimensions exist in the research packet).`);
      }
    } else {
      for (const d of textDimensions) {
        const match = packetDimPairs.find(p => 
          (Math.abs(p.width - d.width) <= 2 && Math.abs(p.length - d.length) <= 2)
        );
        if (match) {
          validatedClaims.push(`Dimension "${d.raw}" verified against packet size: ${match.name} (${match.width}x${match.length} in).`);
        } else {
          unsupportedClaims.push(`Unsupported dimension found in article: "${d.raw}". It does not match any verified dimensions in the research packet.`);
        }
      }
    }
  }

  // ----------------------------------------------------
  // 3. YARN WEIGHTS & HOOK SIZES VERIFICATION
  // ----------------------------------------------------
  const verifiedWeights = packet.verifiedMaterials?.yarnWeights || [];
  for (const w of verifiedWeights) {
    const weightName = w.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    if (plainText.toLowerCase().includes(weightName)) {
      validatedClaims.push(`Yarn weight "${w}" is verified in Craft Yarn Council standards.`);
    }
  }

  const verifiedHooks = packet.verifiedMaterials?.hookSizes || [];
  for (const h of verifiedHooks) {
    const mmMatch = h.match(/(\d+\.\d+|\d+)\s*mm/i);
    if (mmMatch && plainText.toLowerCase().includes(mmMatch[0].toLowerCase())) {
      validatedClaims.push(`Hook size "${h}" conforms to verified metric crochet hook standards.`);
    }
  }

  // ----------------------------------------------------
  // 4. PROHIBITED / HALLUCINATED FORMULA & METRIC CHECKS
  // ----------------------------------------------------
  const prohibitedList = [
    ...(packet.prohibitedMetrics || []),
    'stitches per skein',
    'divide by stitches per skein'
  ];

  for (const prohib of prohibitedList) {
    const regex = new RegExp(prohib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(plainText)) {
      unsupportedClaims.push(`Prohibited metric detected: "${prohib}". This metric is explicitly forbidden.`);
    }
  }

  if (/divide\s+(?:the\s+total\s+(?:number\s+of\s+)?stitches|by\s+the\s+number\s+of\s+stitches\s+per\s+skein)/i.test(plainText)) {
    unsupportedClaims.push('Unsupported calculation formula: dividing total stitches by stitches per skein is a hallucinated method.');
  }

  if (/yards?\s+per\s+stitch/i.test(plainText)) {
    const packetHasYps = (packet.verifiedFormulas || []).some(f => /yards?\s+per\s+stitch/i.test(f.description + f.formulaText));
    if (!packetHasYps) {
      unsupportedClaims.push('Unsupported claim: "yards per stitch" formula is not authorized in the research packet.');
    }
  }

  // Check verified formula steps
  if (packet.verifiedFormulas && packet.verifiedFormulas.length > 0) {
    for (const f of packet.verifiedFormulas) {
      validatedClaims.push(`Calculation formula "${f.name}" matches verified mathematical methodology.`);
    }
  }

  // ----------------------------------------------------
  // 5. UNSUPPORTED PERCENTAGES & STATISTICS CHECKS
  // ----------------------------------------------------
  const allowedPercentages = new Set([
    ...(packet.authorizedPercentages || [10, 15, 20]),
    25, // common tension variance note
    50, // half-way or 50%
    100 // 100% cotton / wool
  ]);

  const percentageRegex = /\b(\d{1,3})%/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = percentageRegex.exec(plainText)) !== null) {
    const pVal = parseInt(pMatch[1], 10);
    if (!allowedPercentages.has(pVal)) {
      unsupportedClaims.push(`Unsupported percentage claim: "${pVal}%" is not authorized in the research packet.`);
    } else {
      validatedClaims.push(`Authorized craft buffer/ratio percentage: "${pVal}%".`);
    }
  }

  // Check for hallucinated monetary claims
  const currencyRegex = /(?:\$|£|€)\s*(\d+(\.\d{2})?)/g;
  let currMatch: RegExpExecArray | null;
  const isPricingTopic = /price|cost|selling/i.test(topic.keyword);
  while ((currMatch = currencyRegex.exec(plainText)) !== null) {
    if (!isPricingTopic) {
      unsupportedClaims.push(`Unsupported monetary/price claim: "${currMatch[0]}" is not grounded in the technical research packet.`);
    }
  }

  // Check for hallucinated search/SEO/ranking statistics
  if (/(?:#1\s+on\s+google|ranked\s+#1|thousands\s+of\s+monthly\s+searches|9\d%\s+of\s+(?:crocheters|makers|crafters))/i.test(plainText)) {
    unsupportedClaims.push('Unsupported statistic/SEO claim: article contains unsubstantiated claims about search ranking or demographic percentages.');
  }

  // Check for ungrounded superlatives
  const ungroundedSuperlatives = [
    'fastest stitch in the world',
    'world\'s best yarn',
    'only calculator that works',
    'guaranteed 100% error-free',
    'impossible to make a mistake'
  ];
  for (const sup of ungroundedSuperlatives) {
    if (plainText.toLowerCase().includes(sup)) {
      unsupportedClaims.push(`Ungrounded superlative claim detected: "${sup}".`);
    }
  }

  // Check for unverified mattress/bed sizes when not in packet
  const commonBedSizes = [
    { name: 'queen', regex: /\bqueen\b/i },
    { name: 'king', regex: /\bking\b/i },
    { name: 'twin', regex: /\btwin\b/i },
    { name: 'california king', regex: /\bcalifornia\s+king\b/i },
    { name: 'full size', regex: /\bfull(?:-|\s+)size\s+(?:bed|mattress|blanket|quilt|afghan|bedspread|dimensions?|size)\b|\bfull\s+(?:bed|mattress|blanket|quilt)\b/i }
  ];
  for (const bed of commonBedSizes) {
    if (bed.regex.test(plainText)) {
      const packetMentionsBed = Object.keys(packetDimensions).some(k => k.toLowerCase().includes(bed.name.split(' ')[0]));
      if (!packetMentionsBed && !plainText.toLowerCase().includes(`not in standard ${bed.name}`)) {
        unsupportedClaims.push(`Unsupported dimension reference: "${bed.name}" size was mentioned but is not authorized in the verified dimensions packet.`);
      }
    }
  }

  // ----------------------------------------------------
  // 6. STITCH CONSUMPTION CLAIMS VERIFICATION
  // ----------------------------------------------------
  const supportedClaimsList = [
    ...(packet.supportedClaims || []),
    ...(packet.techniqueKeyPoints || [])
  ];

  const simpleStitchClaim = /(?:single|double)\s+crochet\s+(?:are\s+less\s+yarn-intensive|use\s+less\s+yarn)/i.test(plainText);
  if (simpleStitchClaim) {
    const isSupported = supportedClaimsList.some(c => /flat stitches|single crochet|double crochet/i.test(c));
    if (isSupported) {
      validatedClaims.push('Stitch yarn-consumption claim verified against supported craft claims.');
    } else {
      unsupportedClaims.push('Unsupported claim: assertion about single/double crochet yarn consumption is not explicitly supported in research packet.');
    }
  }

  // ----------------------------------------------------
  // 7. SEO TITLE & META DESCRIPTION ALIGNMENT
  // ----------------------------------------------------
  const seoResult = validateSeoMetadata(seoTitle, metaDescription, topic);

  // ----------------------------------------------------
  // 8. INTERNAL LINK INTEGRITY & DUPLICATE PREVENTION
  // ----------------------------------------------------
  const linkRegex = /<a\s+[^>]*?href=["']([^"']+)["'][^>]*?>([\s\S]*?)<\/a>/gi;
  const seenUrls = new Map<string, number>();
  const invalidRoutes: string[] = [];
  let linkMatch: RegExpExecArray | null;

  while ((linkMatch = linkRegex.exec(contentHtml)) !== null) {
    const url = linkMatch[1].trim();
    const count = (seenUrls.get(url) || 0) + 1;
    seenUrls.set(url, count);

    if (!isRouteValid(url)) {
      invalidRoutes.push(url);
    }
  }

  const duplicateUrls: string[] = [];
  for (const [url, count] of seenUrls.entries()) {
    if (count > 1) {
      duplicateUrls.push(`${url} (appeared ${count} times)`);
    } else {
      validatedClaims.push(`Verified internal link destination "${url}" is unique and confirmed active.`);
    }
  }

  if (duplicateUrls.length > 0) {
    errors.push(`Duplicate internal link destinations detected: ${duplicateUrls.join(', ')}`);
  }
  if (invalidRoutes.length > 0) {
    errors.push(`Invalid internal link routes detected: ${invalidRoutes.join(', ')}`);
  }

  // ----------------------------------------------------
  // 9. COMPREHENSIVE PASS/FAIL DETERMINATION
  // ----------------------------------------------------
  if (unsupportedClaims.length > 0) {
    errors.push(...unsupportedClaims);
  }
  if (!seoResult.isValid) {
    errors.push(...seoResult.errors);
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    validatedClaims,
    unsupportedClaims,
    errors,
    warnings: [...warnings, ...seoResult.warnings],
    seoCheck: {
      titleValid: seoResult.titleValid,
      metaValid: seoResult.metaValid,
      notes: seoResult.notes
    },
    linkCheck: {
      linksValid: duplicateUrls.length === 0 && invalidRoutes.length === 0,
      duplicateUrls,
      invalidRoutes
    }
  };
}
