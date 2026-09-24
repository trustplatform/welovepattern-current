/**
 * SEO Content Engine - Dedicated OpenAI Article Generator
 * 
 * Production AI writer for WeLovePattern articles.
 * 
 * STRICT ARCHITECTURE & CONTENT RULES:
 * 1. OpenAI is the EXCLUSIVE AI writer. Zero fallback to alternative models or Gemini.
 * 2. The FactualResearchPacket is the strict Source of Truth. The model is forbidden
 *    from inventing conflicting yarn weights, gauge numbers, or hook sizes.
 * 3. Dynamic word count adheres strictly to minWordCount (default 800) and maxWordCount (default 2000).
 * 4. Content is sanitized with `sanitizeArticleHtml` and internal links are injected with `injectInternalLinks`.
 * 5. If OpenAI fails or key is missing, throws clean error for safe queue failure.
 */

import { DiscoveredTopic, FactualResearchPacket, SeoEngineConfig, VerifiedInternalLink } from '../types';
import { executeOpenAiChat, isOpenAiConfigured } from './openAiClient';
import { sanitizeArticleHtml, countHtmlWords } from './articleHtmlSanitizer';
import { injectInternalLinks } from './internalLinkInjector';
import { validateArticleFactualGrounding, FactualValidationOutput } from '../validation/articleFactualValidator';

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  wordCount: number;
  category: string;
  tags: string[];
  seoMeta: {
    title: string;
    description: string;
    keywords: string;
  };
  internalLinks: VerifiedInternalLink[];
  heroImage?: {
    prompt?: string;
    assetPath?: string;
    publicUrl?: string;
  };
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  factualValidationResult?: FactualValidationOutput;
}

/**
 * Calculates optimal target word count based on topic format and complexity.
 */
function determineTargetWordCount(topic: DiscoveredTopic, minCount: number, maxCount: number): number {
  let target = 1100;

  switch (topic.targetContentFormat) {
    case 'tool_focus':
      target = 950;
      break;
    case 'explainer_comparison':
      target = 1150;
      break;
    case 'guide':
      target = 1350;
      break;
    case 'tutorial':
      target = 1500;
      break;
    case 'pattern_roundup':
      target = 1600;
      break;
    default:
      target = 1200;
  }

  return Math.min(maxCount, Math.max(minCount, target));
}

/**
 * Converts a string title into a clean, URL-safe slug.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Formats factual research context into explicit, structured constraints.
 */
function formatFactualContext(packet: FactualResearchPacket): string {
  const parts: string[] = [
    `TOPIC FOCUS: "${packet.topic}"`,
    `SEARCH INTENT: ${packet.searchIntent}`,
    `CRAFT TYPE: ${packet.craftType}`,
    `APPROVED YARN WEIGHTS: ${packet.verifiedMaterials.yarnWeights.join(', ')}`,
    `APPROVED HOOK SIZES: ${packet.verifiedMaterials.hookSizes.join(', ')}`,
    `STANDARD YARDAGE BASELINES: ${packet.verifiedMaterials.standardYardages || 'Standard yardages based on craft gauge'}`
  ];

  if (packet.verifiedMaterials.verifiedDimensions) {
    const dimLines = Object.entries(packet.verifiedMaterials.verifiedDimensions)
      .map(([k, v]) => `  • ${k}: ${v}`);
    parts.push(`VERIFIED DIMENSIONS / SIZES:\n${dimLines.join('\n')}\n  NOTE: ONLY mention dimensions explicitly listed above. DO NOT invent Full, Queen, King, or other dimensions.`);
  } else {
    parts.push('VERIFIED DIMENSIONS: None specified. DO NOT invent arbitrary measurements or dimensions.');
  }

  if (packet.verifiedFormulas && packet.verifiedFormulas.length > 0) {
    const formulaLines = packet.verifiedFormulas.map(f => 
      `  • ${f.name}:\n    Formula: ${f.formulaText}\n    Steps:\n    ${f.steps.map(s => `      - ${s}`).join('\n')}`
    );
    parts.push(`VERIFIED CALCULATION METHODOLOGY:\n${formulaLines.join('\n')}\n  NOTE: NEVER invent formulas like "divide by stitches per skein". Skeins are sold by weight/length, not stitch count.`);
  }

  if (packet.supportedClaims && packet.supportedClaims.length > 0) {
    const claimLines = packet.supportedClaims.map(c => `  • ${c}`);
    parts.push(`SUPPORTED CRAFT CLAIMS:\n${claimLines.join('\n')}\n  NOTE: ONLY make stitch consumption or comparison claims that are explicitly supported above.`);
  }

  parts.push(`TECHNIQUE KEY POINTS:\n${packet.techniqueKeyPoints.map(p => `  • ${p}`).join('\n')}`);
  parts.push(`MAKER PAIN POINTS TO SOLVE:\n${packet.makerPainPoints.map(p => `  • ${p}`).join('\n')}`);
  parts.push(`FACTUAL FAQS (Use answers faithfully):\n${JSON.stringify(packet.faqItems, null, 2)}`);

  return parts.join('\n\n');
}

/**
 * Builds the comprehensive prompt for OpenAI article generation.
 */
function buildGenerationPrompt(
  topic: DiscoveredTopic,
  packet: FactualResearchPacket,
  targetWords: number,
  minWords: number,
  maxWords: number
): { systemPrompt: string; userPrompt: string } {
  const factualContext = formatFactualContext(packet);

  const systemPrompt = `You are the Senior Editorial Director for WeLovePattern (welovepattern.com), the premier authoritative crochet and yarn crafting resource.
You write deeply helpful, comprehensive, friendly, and technically impeccable articles for makers of all skill levels.

AUTHORITATIVE FACTUAL CONTEXT (MANDATORY IMMUTABLE SOURCE OF TRUTH):
${factualContext}

STRICT EDITORIAL & FACTUAL GROUNDING RULES:
1. WORD COUNT: The article body MUST be between ${minWords} and ${maxWords} words (Target: ~${targetWords} words). Do not write shallow or truncated articles.
2. ZERO HALLUCINATED NUMBERS:
   - Every single dimension (inches/cm) MUST come from the Verified Dimensions above. If a size (e.g. Full, Queen, King) is not in the list, DO NOT invent dimensions for it.
   - Every yardage range must match the baseline yardages in the packet.
3. ZERO HALLUCINATED FORMULAS:
   - Use ONLY the calculation steps from Verified Calculation Methodology.
   - NEVER say "divide by stitches per skein" or invent arbitrary "yards per stitch" claims. Skeins are sold by weight and length, never by stitch count.
4. ZERO UNSUPPORTED CLAIMS:
   - Only make comparative stitch claims (e.g. textured stitches vs flat stitches) if explicitly listed under Supported Craft Claims.
5. SEARCH INTENT ALIGNMENT:
   - SEO Title MUST directly target the user query "${topic.keyword}" (50-65 characters).
   - Meta Description MUST directly address the query within 120-155 characters.
6. STRUCTURE:
   - Provide 4 to 6 detailed <h2> sections with practical, actionable craft steps, calculations, and troubleshooting.
   - Use <h3> subsections and bullet points/ordered lists.
   - Include a dedicated "Frequently Asked Questions" section formatted with <h3> for each question and clear paragraph answers.
   - Do NOT manually write raw <a href="..."> anchor tags. Clean body text is required; internal links are injected automatically by the verified link system.
7. FORMAT: Return strict JSON matching the schema.`;

  const userPrompt = `Generate a complete, publish-ready crochet article for the topic: "${topic.keyword}".
Content Format: ${topic.targetContentFormat}
Target word count: ~${targetWords} words (Minimum: ${minWords} words).

Output your response as strict JSON with this exact structure:
{
  "title": "Compelling, search-optimized title directly addressing '${topic.keyword}' (50-65 characters)",
  "excerpt": "Engaging 1-2 sentence article summary (140-160 characters)",
  "category": "One of: blankets, tutorials, tools, tips, guides, amigurumi, yarn",
  "tags": ["3 to 6 relevant craft tags"],
  "seoMeta": {
    "title": "SEO title tag (< 60 chars)",
    "description": "Meta description answering '${topic.keyword}' (< 155 chars)",
    "keywords": "comma-separated primary keywords"
  },
  "contentHtml": "Complete, rich article HTML starting directly with <h2> (do NOT include <h1>). Use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <blockquote>. Must contain full, in-depth text reaching the target word count without inventing unverified numbers."
}`;

  return { systemPrompt, userPrompt };
}

/**
 * Generates a full article using OpenAI based on the validated FactualResearchPacket.
 */
export async function generateOpenAiArticle(
  topic: DiscoveredTopic,
  packet: FactualResearchPacket,
  config: SeoEngineConfig
): Promise<GeneratedArticle> {
  if (!isOpenAiConfigured()) {
    throw new Error('OPENAI_API_KEY is not configured on the server. Cannot generate article.');
  }

  const minWords = config.minWordCount || 800;
  const maxWords = config.maxWordCount || 2000;
  const targetWords = determineTargetWordCount(topic, minWords, maxWords);
  const factualContext = formatFactualContext(packet);

  const { systemPrompt, userPrompt } = buildGenerationPrompt(
    topic,
    packet,
    targetWords,
    minWords,
    maxWords
  );

  let completion = await executeOpenAiChat({
    systemPrompt,
    userPrompt,
    model: config.openAiModel || process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: config.openAiTemperature ?? 0.6,
    responseFormat: 'json_object',
    timeoutMs: 90000,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(completion.content);
  } catch (err: any) {
    throw new Error(`Failed to parse OpenAI JSON output: ${err?.message}`);
  }

  let title = parsed.title?.trim() || topic.keyword;
  let slug = generateSlug(title);
  let excerpt = parsed.excerpt?.trim() || `Complete craft guide and tutorial for ${topic.keyword}.`;
  let rawHtml = parsed.contentHtml?.trim() || '';
  let category = parsed.category?.trim() || 'tutorials';
  let tags = Array.isArray(parsed.tags) ? parsed.tags : ['crochet', 'tutorial', 'yarn'];
  let seoMeta = {
    title: parsed.seoMeta?.title?.trim() || title,
    description: parsed.seoMeta?.description?.trim() || excerpt,
    keywords: parsed.seoMeta?.keywords?.trim() || topic.keyword
  };

  // 1. Sanitize HTML
  let cleanHtml = sanitizeArticleHtml(rawHtml);
  let currentWords = countHtmlWords(cleanHtml);

  // 2. Word count verification & expansion attempt if below threshold
  const maxRegens = config.maxRegenerationAttempts ?? 2;
  let regensAttempted = 0;

  while (currentWords < minWords && regensAttempted < maxRegens) {
    regensAttempted++;
    console.log(`[OpenAI Article Generator] Article for "${topic.keyword}" word count (${currentWords}) is below minimum (${minWords}). Running expansion attempt ${regensAttempted}/${maxRegens}...`);

    const expansionSystemPrompt = `You are the Senior Editorial Director for WeLovePattern.
The current draft of the crochet article on "${topic.keyword}" is too brief (${currentWords} words).
Expand the article comprehensively to reach at least ${targetWords} words.

CRITICAL FACTUAL BOUNDARIES:
${factualContext}

EXPANSION INSTRUCTIONS:
- Deepen the explanations of the approved swatch calculations, fiber choices (wool vs acrylic vs cotton), blocking procedures (wet vs steam blocking), and practical troubleshooting for uneven tension or border curling.
- DO NOT invent any new dimensions, blanket sizes, or mattress dimensions not in the packet.
- DO NOT invent calculation formulas or mention "stitches per skein".
- Return strict JSON with the expanded "contentHtml".`;

    const expansionUserPrompt = `Current draft HTML:\n${cleanHtml}\n\nPlease expand this article into a comprehensive guide of at least ${targetWords} words following all factual grounding boundaries. Return JSON: {"contentHtml": "..."}`;

    try {
      const expansionCompletion = await executeOpenAiChat({
        systemPrompt: expansionSystemPrompt,
        userPrompt: expansionUserPrompt,
        model: config.openAiModel || process.env.OPENAI_MODEL || 'gpt-4o',
        temperature: config.openAiTemperature ?? 0.6,
        responseFormat: 'json_object',
        timeoutMs: 90000,
      });

      const expParsed = JSON.parse(expansionCompletion.content);
      if (expParsed.contentHtml) {
        const candidateHtml = sanitizeArticleHtml(expParsed.contentHtml);
        const candidateWords = countHtmlWords(candidateHtml);
        if (candidateWords > currentWords) {
          cleanHtml = candidateHtml;
          currentWords = candidateWords;
          completion.promptTokens += expansionCompletion.promptTokens;
          completion.completionTokens += expansionCompletion.completionTokens;
          completion.totalTokens += expansionCompletion.totalTokens;
        }
      }
    } catch (expErr: any) {
      console.warn(`[OpenAI Article Generator] Expansion attempt ${regensAttempted} failed:`, expErr?.message);
      break;
    }
  }

  // 3. Inject verified internal links
  let injection = injectInternalLinks(cleanHtml, packet.verifiedInternalLinks, {
    maxLinks: config.maxInternalLinks || 8,
    currentArticleSlug: slug,
  });

  // 4. Validate Factual Grounding & SEO Constraints
  let factualValidation = validateArticleFactualGrounding(
    injection.html,
    seoMeta.title,
    seoMeta.description,
    packet,
    topic
  );

  // If factual validation failed and we still have regeneration budget, attempt targeted revision
  if (!factualValidation.isValid && regensAttempted < maxRegens) {
    regensAttempted++;
    console.log(`[OpenAI Article Generator] Draft failed factual validation. Running corrective revision ${regensAttempted}/${maxRegens}...`);
    console.log(`[OpenAI Article Generator] Errors detected:\n- ${factualValidation.errors.join('\n- ')}`);

    const revisionSystemPrompt = `You are the Senior Editorial Director for WeLovePattern.
Your draft on "${topic.keyword}" failed factual validation due to the following unsupported claims:

${factualValidation.errors.map(e => `• ${e}`).join('\n')}

AUTHORITATIVE FACTUAL CONTEXT (MANDATORY TRUTH):
${factualContext}

REVISION INSTRUCTIONS:
1. Fix or remove every unsupported claim listed above.
2. If unverified dimensions were flagged (e.g. Full, Queen, King), remove them completely. Use ONLY the verified dimensions from the packet.
3. If an invalid formula was flagged (e.g. "stitches per skein"), replace it with the verified Area Ratio Swatch Scaling method.
4. Ensure the SEO title directly targets "${topic.keyword}".
5. Ensure meta description directly answers "${topic.keyword}".
6. Maintain full depth without truncation.
7. Return strict JSON with corrected "title", "excerpt", "seoMeta", and "contentHtml".`;

    const revisionUserPrompt = `Current article HTML:\n${injection.html}\n\nPlease revise this article to strictly satisfy all factual constraints. Return JSON: {"title": "...", "excerpt": "...", "seoMeta": {"title": "...", "description": "...", "keywords": "..."}, "contentHtml": "..."}`;

    try {
      const revisionCompletion = await executeOpenAiChat({
        systemPrompt: revisionSystemPrompt,
        userPrompt: revisionUserPrompt,
        model: config.openAiModel || process.env.OPENAI_MODEL || 'gpt-4o',
        temperature: config.openAiTemperature ?? 0.5,
        responseFormat: 'json_object',
        timeoutMs: 90000,
      });

      const revParsed = JSON.parse(revisionCompletion.content);
      if (revParsed.contentHtml) {
        title = revParsed.title?.trim() || title;
        slug = generateSlug(title);
        excerpt = revParsed.excerpt?.trim() || excerpt;
        seoMeta = {
          title: revParsed.seoMeta?.title?.trim() || title,
          description: revParsed.seoMeta?.description?.trim() || excerpt,
          keywords: revParsed.seoMeta?.keywords?.trim() || topic.keyword
        };

        cleanHtml = sanitizeArticleHtml(revParsed.contentHtml);
        injection = injectInternalLinks(cleanHtml, packet.verifiedInternalLinks, {
          maxLinks: config.maxInternalLinks || 8,
          currentArticleSlug: slug,
        });

        completion.promptTokens += revisionCompletion.promptTokens;
        completion.completionTokens += revisionCompletion.completionTokens;
        completion.totalTokens += revisionCompletion.totalTokens;

        // Re-validate
        factualValidation = validateArticleFactualGrounding(
          injection.html,
          seoMeta.title,
          seoMeta.description,
          packet,
          topic
        );
      }
    } catch (revErr: any) {
      console.warn(`[OpenAI Article Generator] Revision attempt ${regensAttempted} failed:`, revErr?.message);
    }
  }

  return {
    title,
    slug,
    excerpt,
    contentHtml: injection.html,
    wordCount: countHtmlWords(injection.html),
    category,
    tags,
    seoMeta,
    internalLinks: injection.injectedLinks,
    tokensUsed: {
      promptTokens: completion.promptTokens,
      completionTokens: completion.completionTokens,
      totalTokens: completion.totalTokens,
    },
    factualValidationResult: factualValidation
  };
}
