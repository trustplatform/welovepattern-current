/**
 * SEO Content Engine - Dedicated OpenAI Client
 * 
 * Production AI Provider for Article Generation and Research Synthesis.
 * 
 * SECURITY:
 * OPENAI_API_KEY is read strictly from process.env on the server.
 * Never exposed to browser bundles, client requests, system logs, or error responses.
 * 
 * ARCHITECTURE:
 * OpenAI is the EXCLUSIVE production AI writer for the Content Engine.
 * If OpenAI is unavailable or errors, jobs fail safely into needs_attention/retry.
 * Zero fallback to Gemini or alternative writers.
 */

import OpenAI from 'openai';
import { recordCostTransaction } from '../cost/costTracker';

let cachedClient: OpenAI | null = null;

/**
 * Checks whether OPENAI_API_KEY is configured in the environment.
 */
export function isOpenAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

/**
 * Returns the cached OpenAI client instance or creates one safely.
 */
export function getOpenAiClient(): OpenAI | null {
  if (!isOpenAiConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!.trim(),
    });
  }

  return cachedClient;
}

export interface OpenAiCompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

/**
 * Calculates estimated USD cost for OpenAI model tokens.
 */
function calculateOpenAiCost(model: string, promptTokens: number, completionTokens: number): number {
  const m = model.toLowerCase();
  let inputRatePerMillion = 2.50;  // gpt-4o standard
  let outputRatePerMillion = 10.00;

  if (m.includes('mini')) {
    inputRatePerMillion = 0.15;
    outputRatePerMillion = 0.60;
  } else if (m.includes('o1') || m.includes('o3')) {
    inputRatePerMillion = 15.00;
    outputRatePerMillion = 60.00;
  }

  const cost = (promptTokens / 1_000_000) * inputRatePerMillion + (completionTokens / 1_000_000) * outputRatePerMillion;
  return Math.round(cost * 10000) / 10000;
}

/**
 * Helper to pause execution for millisecond duration.
 */
const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a structured chat completion using the OpenAI API.
 * Throws clean, sanitized errors if unconfigured or API fails.
 * Retries up to 3 times on transient rate limits (429) or server errors (5xx).
 */
export async function executeOpenAiChat(params: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  responseFormat?: 'json_object' | 'text';
  timeoutMs?: number;
  jobId?: string;
}): Promise<OpenAiCompletionResult> {
  const client = getOpenAiClient();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured on the server. Cannot execute article generation.');
  }

  const model = params.model || process.env.OPENAI_MODEL || 'gpt-4o';
  const temperature = params.temperature ?? 0.7;
  const timeoutMs = params.timeoutMs ?? 60000;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: params.systemPrompt },
    { role: 'user', content: params.userPrompt },
  ];

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages,
          temperature,
          response_format: params.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
        },
        {
          timeout: timeoutMs,
        }
      );

      const choice = response.choices?.[0];
      const content = choice?.message?.content?.trim() || '';

      if (!content) {
        throw new Error(`OpenAI API returned an empty completion (model: ${model})`);
      }

      const usage = response.usage;
      const promptTokens = usage?.prompt_tokens ?? 0;
      const completionTokens = usage?.completion_tokens ?? 0;
      const totalTokens = usage?.total_tokens ?? 0;
      const estimatedCostUsd = calculateOpenAiCost(model, promptTokens, completionTokens);

      recordCostTransaction({
        jobId: params.jobId,
        provider: 'openai',
        operation: 'chat_completion',
        unitsConsumed: totalTokens,
        costUsd: estimatedCostUsd,
        meta: { model, promptTokens, completionTokens }
      });

      return {
        content,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
      };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const isTransient = status === 429 || (typeof status === 'number' && status >= 500 && status < 600) || err?.code === 'ETIMEDOUT' || err?.code === 'ECONNRESET';

      if (isTransient && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
        console.warn(`[OpenAI Client] Transient error (HTTP ${status || err?.code}) on attempt ${attempt}/${maxRetries}. Retrying in ${backoffMs}ms...`);
        await waitMs(backoffMs);
        continue;
      }

      break;
    }
  }

  // Sanitize error message to guarantee no internal keys, tokens, or headers are exposed
  const rawMsg = lastError?.message || 'OpenAI API request failed';
  const safeMsg = rawMsg
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED_AUTH]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

  throw new Error(`OpenAI API Error (${model}): ${safeMsg}`);
}
