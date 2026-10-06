/**
 * SEO Content Engine - Deterministic Internal Link Injector
 * 
 * Injects verified internal links into generated HTML body text.
 * 
 * STRICT RULES:
 * 1. Never inject inside headings (h1, h2, h3, h4, h5, h6).
 * 2. Never inject inside existing anchor tags (<a>...</a>).
 * 3. Never inject inside HTML attributes or script/style tags.
 * 4. Maximum 1 link per unique destination URL per article.
 * 5. Respects density limits (maximum 1 link per 250 words).
 * 6. Only injects URLs verified by `isRouteValid(url)`.
 */

import { ToolItem, VerifiedInternalLink } from '../types';
import { countHtmlWords } from './articleHtmlSanitizer';
import { isRouteValid } from './internalLinkCatalog';
import { CONTENT_ENGINE_LIMITS } from '../config';

export interface LinkInjectionResult {
  html: string;
  injectedCount: number;
  injectedLinks: VerifiedInternalLink[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the canonical, accessible HTML string for a tool conversion CTA box.
 * Fully styled for WeLovePattern without external React runtime dependencies.
 */
export function buildToolCtaHtml(tool: ToolItem): string {
  const toolUrl = `/tools/${tool.slug}`;
  return `<div class="welovepattern-tool-cta my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50/40 to-amber-50/50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800/60 border border-pink-200/70 dark:border-slate-700/80 shadow-sm not-prose" data-tool-cta="${tool.slug}">
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
    <div class="space-y-2 flex-1">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-100/80 dark:bg-pink-950/60 text-[#E96BA8] dark:text-pink-300">
        <span class="w-2 h-2 rounded-full bg-[#E96BA8] animate-pulse"></span>
        Interactive WeLovePattern Tool
      </div>
      <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
        ${tool.title}
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
        ${tool.description}
      </p>
    </div>
    <div class="shrink-0 w-full sm:w-auto">
      <a href="${toolUrl}" class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#E96BA8] to-[#FF8E53] hover:from-[#d85596] hover:to-[#e87d42] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 no-underline">
        <span>${tool.actionLabel}</span>
      </a>
    </div>
  </div>
</div>`;
}

/**
 * Checks whether an article HTML already contains a tool CTA box.
 */
export function hasToolCta(html: string, toolSlug?: string): boolean {
  if (!html) return false;
  if (toolSlug) {
    const slugRegex = new RegExp(`data-tool-cta=["']${escapeRegex(toolSlug)}["']|welovepattern-tool-cta[\\s\\S]*?\\/tools\\/${escapeRegex(toolSlug)}`, 'i');
    if (slugRegex.test(html)) return true;
  }
  return /welovepattern-tool-cta|data-tool-cta/i.test(html);
}

/**
 * Injects a tool CTA box into article HTML idempotently before FAQ/conclusion.
 */
export function injectToolCta(html: string, tool: ToolItem): string {
  if (!html || !tool) return html;

  // Idempotency: do not duplicate if already present
  if (hasToolCta(html, tool.slug)) {
    return html;
  }

  const ctaHtml = buildToolCtaHtml(tool);

  // Preferred position: immediately before FAQ, Conclusion, or Summary <h2>
  const faqHeadingRegex = /(<h2[^>]*>(?:[^<]*?(?:frequently asked questions|faq|conclusion|summary|troubleshooting|final tips|next steps|wrap-up)[^<]*?)<\/h2>)/i;
  const match = html.match(faqHeadingRegex);
  if (match && match.index !== undefined) {
    return `${html.slice(0, match.index)}\n\n${ctaHtml}\n\n${html.slice(match.index)}`;
  }

  // Second preference: before the last <h2> tag if multiple exist
  const allH2Matches = [...html.matchAll(/<h2[^>]*>/gi)];
  if (allH2Matches.length >= 2) {
    const lastH2 = allH2Matches[allH2Matches.length - 1];
    if (lastH2.index !== undefined) {
      return `${html.slice(0, lastH2.index)}\n\n${ctaHtml}\n\n${html.slice(lastH2.index)}`;
    }
  }

  // Fallback: before closing article tag or at the end
  if (/<\/article>/i.test(html)) {
    return html.replace(/<\/article>/i, `\n\n${ctaHtml}\n\n</article>`);
  }

  return `${html}\n\n${ctaHtml}`;
}

/**
 * Injects verified internal links and optional Tool conversion CTA into raw article HTML safely.
 */
export function injectInternalLinks(
  html: string,
  candidateLinks: VerifiedInternalLink[],
  options?: {
    maxLinks?: number;
    wordsPerLink?: number;
    currentArticleSlug?: string;
    targetTool?: ToolItem;
    contentType?: string;
  }
): LinkInjectionResult {
  if (!html) {
    return { html, injectedCount: 0, injectedLinks: [] };
  }

  const wordCount = countHtmlWords(html);
  const wordsPerLink = options?.wordsPerLink ?? CONTENT_ENGINE_LIMITS.WORDS_PER_INTERNAL_LINK;
  const densityCap = Math.max(1, Math.floor(wordCount / wordsPerLink));
  const maxLinks = Math.min(options?.maxLinks ?? CONTENT_ENGINE_LIMITS.MAX_INTERNAL_LINKS_PER_ARTICLE, densityCap);

  const injectedUrls = new Set<string>();
  const injectedLinks: VerifiedInternalLink[] = [];

  if (options?.currentArticleSlug) {
    injectedUrls.add(`/blog/${options.currentArticleSlug.toLowerCase()}`);
  }

  if (options?.contentType === 'tool_guide' && options?.targetTool) {
    injectedUrls.add(`/tools/${options.targetTool.slug.toLowerCase()}`);
  }

  // Strip pre-existing bare anchor tags (except structured CTA buttons) to clean plain inner text
  // to ensure links are injected deterministically without nesting or attribute corruption.
  const hasCtaAlready = hasToolCta(html, options?.targetTool?.slug);
  let preProcessedHtml = html;
  if (!hasCtaAlready) {
    preProcessedHtml = html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  }

  // Pre-filter candidate links to ensure route validity and uniqueness
  const validCandidates: VerifiedInternalLink[] = [];
  for (const link of candidateLinks) {
    const normUrl = link.url.trim().toLowerCase();
    if (injectedUrls.has(normUrl)) continue;
    if (!isRouteValid(link.url)) continue;
    validCandidates.push(link);
  }

  // Parse HTML into segments to avoid modifying inside headings, existing CTA blocks, or existing links
  const protectedTagRegex = /(<div\b[^>]*class=["'][^"']*welovepattern-tool-cta[\s\S]*?<\/div>[\s\S]*?<\/div>|<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<a[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi;
  
  const tokens: { text: string; isProtected: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = protectedTagRegex.exec(preProcessedHtml)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: preProcessedHtml.slice(lastIndex, match.index),
        isProtected: false
      });
    }
    tokens.push({
      text: match[0],
      isProtected: true
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < preProcessedHtml.length) {
    tokens.push({
      text: preProcessedHtml.slice(lastIndex),
      isProtected: false
    });
  }

  // Process non-protected tokens for link insertion
  for (let i = 0; i < tokens.length; i++) {
    if (injectedLinks.length >= maxLinks) break;
    if (tokens[i].isProtected) continue;

    for (const candidate of validCandidates) {
      if (injectedLinks.length >= maxLinks) break;
      if (injectedUrls.has(candidate.url.toLowerCase())) continue;

      const anchor = candidate.anchorText ? candidate.anchorText.trim() : '';
      if (anchor.length < 3) continue;

      // Word-boundary case-insensitive regex for the anchor text
      const regex = new RegExp(`\\b(${escapeRegex(anchor)})\\b`, 'i');
      const textMatch = tokens[i].text.match(regex);

      if (textMatch && textMatch.index !== undefined) {
        const matchedStr = textMatch[0];
        const matchIdx = textMatch.index;
        const linkClass = candidate.entityType === 'tool'
          ? 'text-amber-800 underline decoration-amber-500 font-semibold hover:text-amber-900 transition-colors'
          : 'text-amber-700 underline hover:text-amber-800 transition-colors';

        const before = tokens[i].text.slice(0, matchIdx);
        const linkTag = `<a href="${candidate.url}" class="${linkClass}">${matchedStr}</a>`;
        const after = tokens[i].text.slice(matchIdx + matchedStr.length);

        // Replace current token with: before (unprotected), linkTag (protected), after (unprotected)
        tokens.splice(
          i,
          1,
          { text: before, isProtected: false },
          { text: linkTag, isProtected: true },
          { text: after, isProtected: false }
        );

        injectedUrls.add(candidate.url.toLowerCase());
        injectedLinks.push({
          ...candidate,
          anchorText: matchedStr
        });

        // Continue from the 'after' token (index i + 2) or re-evaluate
        i = i + 1; // points to protected linkTag, next loop iteration will increment to 'after'
        break;
      }
    }
  }

  let resultHtml = tokens.map(t => t.text).join('');

  // Inject Tool-specific CTA for tool_guide articles ONLY
  if (options?.contentType === 'tool_guide' && options.targetTool) {
    resultHtml = injectToolCta(resultHtml, options.targetTool);
    const toolUrl = `/tools/${options.targetTool.slug}`;
    if (!injectedLinks.some(l => l.url.toLowerCase() === toolUrl.toLowerCase())) {
      injectedLinks.push({
        anchorText: options.targetTool.actionLabel,
        url: toolUrl,
        entityType: 'tool'
      });
    }
  }

  return {
    html: resultHtml,
    injectedCount: injectedLinks.length,
    injectedLinks
  };
}
