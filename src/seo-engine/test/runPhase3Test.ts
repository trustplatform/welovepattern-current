/**
 * SEO Content Engine - Phase 3 End-to-End Test Runner
 * 
 * Topic: "How Much Yarn Do I Need for a Crochet Blanket?"
 * 
 * Pipeline:
 * 1. Topic Discovery & Opportunity Scoring
 * 2. Dedicated Factual Research Layer (Craft Yarn Council standards, metric hook sizes)
 * 3. Factual Packet Validation Gate
 * 4. Production Article Generation (OpenAI / Schema-compliant synthesis)
 * 5. HTML Sanitization
 * 6. Verified Internal Link Injection (Never in headings, density limit, route verified)
 * 7. Final Validation & Draft Persistence
 */

import fs from 'fs';
import path from 'path';
import { scoreTopicOpportunity } from '../discovery/opportunityScorer';
import { conductTopicResearch } from '../research/topicResearcher';
import { validateFactualResearchPacket } from '../research/factualPacketValidator';
import { sanitizeArticleHtml, countHtmlWords } from '../generation/articleHtmlSanitizer';
import { injectInternalLinks } from '../generation/internalLinkInjector';
import { isOpenAiConfigured, executeOpenAiChat } from '../generation/openAiClient';
import { generateOpenAiArticle } from '../generation/openAiArticleGenerator';
import { DiscoveredTopic, FactualResearchPacket, SeoEngineConfig } from '../types';
import { DEFAULT_SEO_ENGINE_CONFIG } from '../config';

export interface TestPipelineResult {
  topic: string;
  openAiConfigured: boolean;
  modelUsed: string;
  tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  regenerationAttempts: number;
  warnings: string[];
  factualPacketSummary: {
    topic: string;
    searchIntent: string;
    yarnWeights: string[];
    hookSizes: string[];
    standardYardages: string;
    techniqueKeyPoints: string[];
    makerPainPoints: string[];
    faqCount: number;
    verifiedLinksCount: number;
  };
  validationResults: {
    factualPacketValid: boolean;
    factualPacketErrors: string[];
    finalArticleValid: boolean;
    finalArticleErrors: string[];
  };
  article: {
    seoTitle: string;
    metaDescription: string;
    h1Title: string;
    wordCount: number;
    category: string;
    tags: string[];
    internalLinksInserted: { anchorText: string; url: string; entityType: string }[];
    articleBodyHtml: string;
  };
}

export async function runEndToEndArticleTest(): Promise<TestPipelineResult> {
  const keyword = "How Much Yarn Do I Need for a Crochet Blanket?";
  const warnings: string[] = [];

  // --- Step 1: Topic Opportunity Scoring ---
  const scoreResult = scoreTopicOpportunity(keyword);
  const discoveredTopic: DiscoveredTopic = {
    id: `test_${Date.now()}`,
    keyword,
    source: 'gsc_seed',
    searchTrendSignal: 85,
    relevanceScore: scoreResult.relevanceScore,
    siteFitScore: scoreResult.siteFitScore,
    opportunityScore: scoreResult.totalOpportunityScore,
    targetContentFormat: scoreResult.targetFormat,
    targetToolUrl: scoreResult.targetToolUrl,
    targetCategoryUrl: scoreResult.targetCategoryUrl,
    targetPatternUrls: scoreResult.targetPatternUrls,
    discoveredAt: new Date().toISOString(),
    status: 'selected'
  };

  // --- Step 2: Factual Research ---
  const factualPacket = await conductTopicResearch(discoveredTopic);

  // --- Step 3: Factual Packet Validation ---
  const packetValidation = validateFactualResearchPacket(factualPacket);
  if (!packetValidation.isValid) {
    warnings.push(...packetValidation.errors);
  }
  warnings.push(...packetValidation.warnings);

  // --- Step 4: Article Generation (OpenAI Production Writer) ---
  const hasOpenAiKey = isOpenAiConfigured();
  const modelUsed = DEFAULT_SEO_ENGINE_CONFIG.openAiModel || process.env.OPENAI_MODEL || 'gpt-4o';
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let regensAttempted = 0;

  let rawTitle = '';
  let rawMetaDescription = '';
  let rawCategory = 'guides';
  let rawTags: string[] = [];
  let finalBodyHtml = '';
  let finalWordCount = 0;
  let injectedLinks: any[] = [];
  const finalValidationErrors: string[] = [];

  if (!hasOpenAiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server. Cannot execute live OpenAI test.');
  }

  try {
    // Call the official production article generator
    const generated = await generateOpenAiArticle(discoveredTopic, factualPacket, DEFAULT_SEO_ENGINE_CONFIG);
    promptTokens = generated.tokensUsed.promptTokens;
    completionTokens = generated.tokensUsed.completionTokens;
    totalTokens = generated.tokensUsed.totalTokens;

    rawTitle = generated.title;
    rawMetaDescription = generated.seoMeta.description;
    rawCategory = generated.category;
    rawTags = generated.tags;
    finalBodyHtml = generated.contentHtml;
    finalWordCount = generated.wordCount;
    injectedLinks = generated.internalLinks;

    // --- Step 5: Final Validation ---
    if (finalWordCount < 800) {
      finalValidationErrors.push(`Article word count (${finalWordCount}) is below minimum threshold (800 words).`);
    }
    if (!rawTitle || rawTitle.length < 20) {
      finalValidationErrors.push('SEO Title is too short or missing.');
    }
    if (!rawMetaDescription || rawMetaDescription.length < 50) {
      finalValidationErrors.push('Meta description is too short or missing.');
    }
  } catch (err: any) {
    warnings.push(`OpenAI Live Call Error: ${err?.message}`);
    finalValidationErrors.push(`Article generation failed: ${err?.message}`);
  }

  const result: TestPipelineResult = {
    topic: keyword,
    openAiConfigured: hasOpenAiKey,
    modelUsed,
    tokensUsed: {
      promptTokens,
      completionTokens,
      totalTokens
    },
    regenerationAttempts: regensAttempted,
    warnings,
    factualPacketSummary: {
      topic: factualPacket.topic,
      searchIntent: factualPacket.searchIntent,
      yarnWeights: factualPacket.verifiedMaterials.yarnWeights,
      hookSizes: factualPacket.verifiedMaterials.hookSizes,
      standardYardages: factualPacket.verifiedMaterials.standardYardages || 'N/A',
      techniqueKeyPoints: factualPacket.techniqueKeyPoints,
      makerPainPoints: factualPacket.makerPainPoints,
      faqCount: factualPacket.faqItems.length,
      verifiedLinksCount: factualPacket.verifiedInternalLinks.length
    },
    validationResults: {
      factualPacketValid: packetValidation.isValid,
      factualPacketErrors: packetValidation.errors,
      finalArticleValid: finalValidationErrors.length === 0,
      finalArticleErrors: finalValidationErrors
    },
    article: {
      seoTitle: rawTitle,
      metaDescription: rawMetaDescription,
      h1Title: rawTitle,
      wordCount: finalWordCount,
      category: rawCategory,
      tags: rawTags,
      internalLinksInserted: injectedLinks,
      articleBodyHtml: finalBodyHtml
    }
  };

  // Save draft output to data directory without publishing
  const outPath = path.resolve('data/seo-engine-test-draft.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  return result;
}
