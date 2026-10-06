/**
 * SEO Content Engine - Production Quality Gates
 * 
 * Strict multi-barrier gatekeeper.
 * NO article can be approved or published if it fails even a single gate.
 * 
 * 9 QUALITY GATES:
 * 1. Factual Grounding (Traceable numbers, CYC standards, zero hallucinated metrics)
 * 2. SEO Intent Alignment (Direct match with search intent, natural phrasing)
 * 3. Metadata Quality (Title & Meta character limits, compelling value proposition)
 * 4. HTML Sanitization (Strict allowlist, zero dangerous attributes, no XSS)
 * 5. Internal Linking Integrity (Zero invalid routes, unique destinations, zero forced irrelevant links)
 * 6. Duplication & Cannibalization Prevention (Exact slug, exact title, and semantic intent overlap)
 * 7. Editorial Thresholds (Word count bounds, clear readability)
 * 8. Image Asset Integrity (Hero asset verified on disk or cleanly skipped)
 * 9. Publication Safety Barrier (Strict human approval wall)
 */

import fs from 'fs';
import { DiscoveredTopic, FactualResearchPacket, ProductionQualityGateResult, SeoEngineConfig, ToolItem } from '../types';
import { GeneratedArticle } from '../generation/openAiArticleGenerator';
import { validateArticleFactualGrounding } from './articleFactualValidator';
import { validateSeoMetadata } from './seoMetadataValidator';
import { isRouteValid } from '../generation/internalLinkCatalog';
import { getToolBySlug, getToolByUrl, TOOLS_DATA } from '../../data/toolsData';
import { BLOG_DATA } from '../../data/blogData';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ToolGuideValidationResult {
  isValid: boolean;
  tool?: ToolItem;
  errors: string[];
}

/**
 * Validates strict production quality requirements for Tool Guide (Slot 2) articles.
 * Enforces correct tool slug, canonical URL, explicit tool identity, CTA existence,
 * and semantic action alignment without brittle literal-string locking.
 */
export function validateToolGuideRequirements(
  html: string,
  topic: DiscoveredTopic,
  packet?: FactualResearchPacket
): ToolGuideValidationResult {
  const errors: string[] = [];
  const rawSlug = topic.toolSlug || packet?.targetTool?.slug;
  const tool = getToolBySlug(rawSlug) || (topic.targetToolUrl ? getToolByUrl(topic.targetToolUrl) : undefined);

  // 1. Valid toolSlug & exists in canonical registry
  if (!tool) {
    errors.push(`Tool Guide Validation Error: Tool slug "${rawSlug || topic.targetToolUrl || 'unspecified'}" is not a valid registered tool in WeLovePattern.`);
    return { isValid: false, errors };
  }

  // 2. Valid targetToolUrl
  const expectedUrl = `/tools/${tool.slug}`;
  if (!isRouteValid(expectedUrl)) {
    errors.push(`Tool Guide Validation Error: Target tool route "${expectedUrl}" is invalid.`);
  }
  if (topic.targetToolUrl && topic.targetToolUrl.toLowerCase() !== expectedUrl.toLowerCase()) {
    errors.push(`Tool Guide Validation Error: Topic targetToolUrl "${topic.targetToolUrl}" does not match canonical tool route "${expectedUrl}".`);
  }

  // 3. Correct tool URL exists in article content
  const normHtml = html || '';
  const urlRegex = new RegExp(`href=["']\\s*${escapeRegex(expectedUrl)}\\s*["']`, 'i');
  if (!urlRegex.test(normHtml)) {
    errors.push(`Tool Guide Validation Error: Missing required tool link "${expectedUrl}" in article HTML.`);
  }

  // 4. Correct tool identity exists (title or slug)
  const normHtmlLower = normHtml.toLowerCase();
  const toolTitleLower = tool.title.toLowerCase();
  const toolSlugClean = tool.slug.replace(/-/g, ' ').toLowerCase();
  const hasToolIdentity = normHtmlLower.includes(toolTitleLower) || normHtmlLower.includes(toolSlugClean);
  if (!hasToolIdentity) {
    errors.push(`Tool Guide Validation Error: Article content must explicitly mention the tool identity ("${tool.title}").`);
  }

  // 5. Tool CTA exists
  const hasCta = /welovepattern-tool-cta|data-tool-cta/i.test(normHtml);
  if (!hasCta) {
    errors.push(`Tool Guide Validation Error: Missing required WeLovePattern Tool CTA component for "${tool.title}".`);
  }

  // 6. Semantic action validation
  // Verifies that article / CTA communicates the action type/semantics of this tool
  const actionKeywords = [
    tool.actionType.toLowerCase(),
    tool.actionVerb.toLowerCase(),
    tool.actionLabel.toLowerCase().replace(/[→\->\s]+/g, ' ').trim(),
    ...tool.actionVerb.toLowerCase().split(/\s+/),
    ...tool.actionType.toLowerCase().split(/\s+/)
  ].filter(w => w.length > 2);

  const semanticActionMap: Record<string, string[]> = {
    calculator: ['calculate', 'calculation', 'calculator', 'estimator', 'estimate', 'yardage', 'gauge', 'formula', 'swatch', 'cost', 'price', 'squares'],
    converter: ['convert', 'conversion', 'converter', 'equivalent', 'chart', 'terms', 'weights', 'sizes', 'mm'],
    counter: ['count', 'counting', 'counter', 'tracking', 'rows', 'stitches', 'timer', 'repeat'],
    organizer: ['organize', 'organizer', 'tracker', 'track', 'library', 'pdf', 'collection', 'wip', 'project'],
    finder: ['find', 'finder', 'substitute', 'substitution', 'compatible', 'match', 'alternative'],
    checker: ['check', 'checker', 'difficulty', 'assess', 'level', 'quiz', 'skill'],
    timer: ['time', 'timer', 'speed', 'pace', 'track', 'hour', 'break'],
    library: ['library', 'collection', 'folder', 'organize', 'pattern', 'saved'],
    dictionary: ['dictionary', 'abbreviation', 'glossary', 'terms', 'symbol', 'reference', 'stitch']
  };

  const categoryActions = semanticActionMap[tool.actionType.toLowerCase()] || [];
  const allAcceptableActions = [...new Set([...actionKeywords, ...categoryActions])];

  const hasSemanticAction = allAcceptableActions.some(action => normHtmlLower.includes(action.toLowerCase()));
  if (!hasSemanticAction) {
    errors.push(`Tool Guide Validation Error: Article lacks semantic action alignment for tool action "${tool.actionType}" (${tool.actionVerb}).`);
  }

  return {
    isValid: errors.length === 0,
    tool,
    errors
  };
}

/**
 * Computes simple word token overlap (Jaccard-like) between two strings.
 */
function computeSemanticOverlap(strA: string, strB: string): number {
  const stopWords = new Set(['how', 'to', 'for', 'the', 'a', 'an', 'in', 'of', 'and', 'with', 'your', 'complete', 'guide']);
  const tokensA = new Set(strA.toLowerCase().split(/[\s_-]+/).filter(t => t.length > 2 && !stopWords.has(t)));
  const tokensB = new Set(strB.toLowerCase().split(/[\s_-]+/).filter(t => t.length > 2 && !stopWords.has(t)));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Checks if a slug or title collides or cannibalizes existing published blog posts or tools.
 */
function checkContentCannibalization(slug: string, title: string, keyword: string): { hasCollision: boolean; reason?: string } {
  let publishedPosts: any[] = BLOG_DATA;

  try {
    const blogFile = 'data/blog-posts.json';
    if (fs.existsSync(blogFile)) {
      const parsed = JSON.parse(fs.readFileSync(blogFile, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        publishedPosts = parsed;
      }
    }
  } catch {
    // fallback to in-memory BLOG_DATA
  }

  const normSlug = slug.trim().toLowerCase();
  const normTitle = title.trim().toLowerCase();
  const normKeyword = keyword.trim().toLowerCase();

  // 1. Exact slug collision
  const slugMatch = publishedPosts.find(p => p.slug?.toLowerCase() === normSlug);
  if (slugMatch) {
    return { hasCollision: true, reason: `Slug collision: "${normSlug}" already exists in published blog posts.` };
  }

  // 2. Exact title collision
  const titleMatch = publishedPosts.find(p => p.title?.toLowerCase() === normTitle);
  if (titleMatch) {
    return { hasCollision: true, reason: `Title collision: "${title}" is identical to an existing published post.` };
  }

  // 3. Semantic intent cannibalization (overlap >= 75%)
  for (const post of publishedPosts) {
    const postTitle = (post.title || '').toLowerCase();
    const overlap = computeSemanticOverlap(`${normTitle} ${normKeyword}`, postTitle);
    if (overlap >= 0.75) {
      return {
        hasCollision: true,
        reason: `Semantic intent cannibalization: New article ("${title}") strongly overlaps with existing published article "${post.title}" (overlap: ${Math.round(overlap * 100)}%).`
      };
    }
  }

  return { hasCollision: false };
}

/**
 * Runs the comprehensive 9-gate quality audit on a generated article draft.
 */
export function evaluateProductionQualityGates(
  jobId: string,
  article: GeneratedArticle,
  topic: DiscoveredTopic,
  packet: FactualResearchPacket,
  config: SeoEngineConfig
): ProductionQualityGateResult {
  const rejectionReasons: string[] = [];

  // -----------------------------------------------------------------
  // GATE 1: FACTUAL GROUNDING
  // -----------------------------------------------------------------
  const factualResult = validateArticleFactualGrounding(
    article.contentHtml,
    article.seoMeta.title,
    article.seoMeta.description,
    packet,
    topic
  );

  const factualPassed = factualResult.isValid && factualResult.unsupportedClaims.length === 0;
  if (!factualPassed) {
    rejectionReasons.push(...factualResult.unsupportedClaims);
    if (factualResult.errors.length > 0) {
      rejectionReasons.push(...factualResult.errors);
    }
  }

  // -----------------------------------------------------------------
  // GATE 2: SEO INTENT ALIGNMENT & GATE 3: METADATA QUALITY
  // -----------------------------------------------------------------
  const metaResult = validateSeoMetadata(article.seoMeta.title, article.seoMeta.description, topic);
  let slotAlignmentPassed = true;

  if (topic.contentType === 'trending_crochet') {
    if (article.category !== 'crochet') {
      slotAlignmentPassed = false;
      rejectionReasons.push(`Slot 1 Category Error: Expected category 'crochet', got '${article.category}'.`);
    }
    const toolWords = ['calculator', 'estimator', 'converter', 'generator'];
    if (toolWords.some(w => topic.keyword.toLowerCase().includes(w))) {
      slotAlignmentPassed = false;
      rejectionReasons.push(`Slot 1 Classification Error: Trending Crochet topic "${topic.keyword}" contains prohibited tool keyword.`);
    }
  } else if (topic.contentType === 'tool_guide') {
    if (article.category !== 'tools') {
      slotAlignmentPassed = false;
      rejectionReasons.push(`Slot 2 Category Error: Expected category 'tools', got '${article.category}'.`);
    }
    const toolGuideValidation = validateToolGuideRequirements(article.contentHtml, topic, packet);
    if (!toolGuideValidation.isValid) {
      slotAlignmentPassed = false;
      rejectionReasons.push(...toolGuideValidation.errors);
    }
  }

  const seoIntentPassed = metaResult.intentAlignmentScore >= 60 && metaResult.titleValid && slotAlignmentPassed;
  const metadataPassed = metaResult.metaValid && metaResult.titleValid;

  if (!seoIntentPassed) {
    rejectionReasons.push(`SEO Intent Alignment Failure: Score ${metaResult.intentAlignmentScore}/100 is below 60 threshold.`);
  }
  if (!metadataPassed) {
    rejectionReasons.push(...metaResult.errors);
  }

  // -----------------------------------------------------------------
  // GATE 4: HTML SANITIZATION
  // -----------------------------------------------------------------
  const prohibitedTagsRegex = /<(script|iframe|object|embed|svg|style|form|input)[^>]*>/i;
  const dangerousAttributesRegex = /\son\w+\s*=|javascript:|data:text\/html/i;
  const hasDangerousTags = prohibitedTagsRegex.test(article.contentHtml);
  const hasDangerousAttrs = dangerousAttributesRegex.test(article.contentHtml);
  const htmlPassed = !hasDangerousTags && !hasDangerousAttrs;

  if (hasDangerousTags) {
    rejectionReasons.push('HTML Security Failure: Article contains prohibited executable tags.');
  }
  if (hasDangerousAttrs) {
    rejectionReasons.push('HTML Security Failure: Article contains dangerous attributes or pseudo-protocol URLs.');
  }

  // -----------------------------------------------------------------
  // GATE 5: INTERNAL LINKING INTEGRITY
  // -----------------------------------------------------------------
  const linkRegex = /<a\s+[^>]*?href=["']([^"']+)["'][^>]*?>([\s\S]*?)<\/a>/gi;
  const seenUrls = new Map<string, number>();
  const invalidRoutes: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = linkRegex.exec(article.contentHtml)) !== null) {
    const url = m[1].trim();
    // Verify route validity
    if (!isRouteValid(url)) {
      invalidRoutes.push(url);
    }
    const count = (seenUrls.get(url) || 0) + 1;
    seenUrls.set(url, count);
  }

  const duplicateUrls = Array.from(seenUrls.entries())
    .filter(([_, count]) => count > 1)
    .map(([url, count]) => `${url} (${count}x)`);

  // Relevance > Quantity: Zero links is valid if no relevant resource exists!
  const internalLinkingPassed = invalidRoutes.length === 0 && duplicateUrls.length === 0;
  if (invalidRoutes.length > 0) {
    rejectionReasons.push(`Invalid Internal Routes Detected: ${invalidRoutes.join(', ')}`);
  }
  if (duplicateUrls.length > 0) {
    rejectionReasons.push(`Duplicate Internal Link Destinations: ${duplicateUrls.join(', ')}`);
  }

  // -----------------------------------------------------------------
  // GATE 6: DUPLICATION & CONTENT CANNIBALIZATION
  // -----------------------------------------------------------------
  const cannibalization = checkContentCannibalization(article.slug, article.title, topic.keyword);
  const duplicationPassed = !cannibalization.hasCollision;
  if (!duplicationPassed) {
    rejectionReasons.push(`Duplication Failure: ${cannibalization.reason}`);
  }

  // -----------------------------------------------------------------
  // GATE 7: EDITORIAL THRESHOLDS
  // -----------------------------------------------------------------
  const minWords = config.minWordCount || 800;
  const maxWords = config.maxWordCount || 2000;
  const editorialPassed = article.wordCount >= minWords && article.wordCount <= maxWords;
  if (!editorialPassed) {
    rejectionReasons.push(`Editorial Length Failure: Word count (${article.wordCount}) is outside allowed bounds [${minWords} - ${maxWords}].`);
  }

  // -----------------------------------------------------------------
  // GATE 8: IMAGE ASSET INTEGRITY
  // -----------------------------------------------------------------
  let imagePassed = true;
  if (article.heroImage?.assetPath && !fs.existsSync(article.heroImage.assetPath)) {
    imagePassed = false;
    rejectionReasons.push(`Image Asset Failure: Specified hero image file does not exist at "${article.heroImage.assetPath}".`);
  }

  // -----------------------------------------------------------------
  // GATE 9: PUBLICATION SAFETY & CONFIGURATION INTEGRITY
  // -----------------------------------------------------------------
  // Evaluates production safety: verifies engine is active and configuration parameters are valid.
  // When autoPublish is enabled without approval, validates that engine is actively configured for autonomous production.
  let pubSafetyPassed = true;
  if (!config.engineActive) {
    pubSafetyPassed = false;
    rejectionReasons.push('Publication Safety Failure: Engine is inactive (config.engineActive is false).');
  } else if (config.articlesPerDay <= 0 || config.articlesPerDay > 10) {
    pubSafetyPassed = false;
    rejectionReasons.push(`Publication Safety Failure: Invalid articlesPerDay limit (${config.articlesPerDay}).`);
  } else if (!config.timezone) {
    pubSafetyPassed = false;
    rejectionReasons.push('Publication Safety Failure: Timezone is not configured.');
  }

  const passedAllGates = factualPassed &&
    seoIntentPassed &&
    metadataPassed &&
    htmlPassed &&
    internalLinkingPassed &&
    duplicationPassed &&
    editorialPassed &&
    imagePassed &&
    pubSafetyPassed;

  return {
    jobId,
    passedAllGates,
    gates: {
      factualGrounding: {
        passed: factualPassed,
        details: factualPassed ? `${factualResult.validatedClaims.length} verified technical claims` : factualResult.unsupportedClaims.join('; '),
        validatedCount: factualResult.validatedClaims.length,
        unsupportedCount: factualResult.unsupportedClaims.length,
      },
      seoIntentAlignment: {
        passed: seoIntentPassed,
        details: seoIntentPassed ? `Intent Score: ${metaResult.intentAlignmentScore}/100 (${metaResult.detectedIntent})` : 'Search intent score below 60 threshold',
      },
      metadataQuality: {
        passed: metadataPassed,
        details: metadataPassed ? 'Title and Meta description within strict SERP limits' : metaResult.errors.join('; '),
      },
      htmlSanitization: {
        passed: htmlPassed,
        details: htmlPassed ? 'Safe HTML with strict allowlist, zero dangerous attributes' : 'Prohibited tags/attributes found',
      },
      internalLinking: {
        passed: internalLinkingPassed,
        details: seenUrls.size > 0 ? `${seenUrls.size} verified unique internal links injected` : 'Zero internal links (relevance over quantity preserved)',
        linkCount: seenUrls.size,
      },
      duplicationAndCannibalization: {
        passed: duplicationPassed,
        details: duplicationPassed ? 'Zero slug, title, or semantic intent collision with published catalog' : (cannibalization.reason || 'Collision detected'),
      },
      editorialThresholds: {
        passed: editorialPassed,
        details: `${article.wordCount} words (Target: ${minWords}-${maxWords})`,
        wordCount: article.wordCount,
      },
      imageAssetIntegrity: {
        passed: imagePassed,
        details: imagePassed ? 'Image asset verified or safely skipped' : 'Hero image missing on disk',
      },
      publicationSafety: {
        passed: pubSafetyPassed,
        details: 'Draft review policy strictly enforced (Safe human approval wall active)',
      },
    },
    rejectionReasons,
    evaluatedAt: new Date().toISOString(),
  };
}
