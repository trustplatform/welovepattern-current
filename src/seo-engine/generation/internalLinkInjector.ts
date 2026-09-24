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

import { VerifiedInternalLink } from '../types';
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
 * Injects verified internal links into raw article HTML safely.
 */
export function injectInternalLinks(
  html: string,
  candidateLinks: VerifiedInternalLink[],
  options?: {
    maxLinks?: number;
    wordsPerLink?: number;
    currentArticleSlug?: string;
  }
): LinkInjectionResult {
  if (!html || candidateLinks.length === 0) {
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

  // First pass: scan and clean any pre-existing <a href="..."> tags in the incoming HTML
  // If an existing link is invalid or a duplicate destination, unwrap it.
  // If valid, preserve it, apply standard classes, and record in injectedUrls.
  let preProcessedHtml = html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi, (match, beforeHref, url, afterHref, innerText) => {
    const normUrl = url.trim().toLowerCase();
    
    // Check validity
    if (!isRouteValid(url) || injectedUrls.has(normUrl) || injectedLinks.length >= maxLinks) {
      // Unwrap link (keep inner text) to avoid invalid route or duplicate destination
      return innerText;
    }

    // Determine entity type
    const matchedCandidate = candidateLinks.find(c => c.url.toLowerCase() === normUrl);
    const entityType = matchedCandidate?.entityType || (normUrl.startsWith('/tools/') ? 'tool' : 'blog');
    const linkClass = entityType === 'tool'
      ? 'text-amber-800 underline decoration-amber-500 font-semibold hover:text-amber-900 transition-colors'
      : 'text-amber-700 underline hover:text-amber-800 transition-colors';

    injectedUrls.add(normUrl);
    injectedLinks.push({
      anchorText: innerText.replace(/<[^>]+>/g, '').trim(),
      url: matchedCandidate?.url || url,
      entityType
    });

    return `<a href="${matchedCandidate?.url || url}" class="${linkClass}">${innerText}</a>`;
  });

  // Pre-filter candidate links to ensure route validity and uniqueness
  const validCandidates: VerifiedInternalLink[] = [];
  for (const link of candidateLinks) {
    const normUrl = link.url.trim().toLowerCase();
    if (injectedUrls.has(normUrl)) continue;
    if (!isRouteValid(link.url)) continue;
    validCandidates.push(link);
  }

  // Parse HTML into segments to avoid modifying inside headings or existing links
  const protectedTagRegex = /(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<a[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi;
  
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

      const anchor = candidate.anchorText.trim();
      if (anchor.length < 3) continue;

      // Word-boundary case-insensitive regex for the anchor text
      const regex = new RegExp(`\\b(${escapeRegex(anchor)})\\b`, 'i');
      const textMatch = tokens[i].text.match(regex);

      if (textMatch && textMatch.index !== undefined) {
        const matchedStr = textMatch[0];
        const linkClass = candidate.entityType === 'tool'
          ? 'text-amber-800 underline decoration-amber-500 font-semibold hover:text-amber-900 transition-colors'
          : 'text-amber-700 underline hover:text-amber-800 transition-colors';

        const replacement = `<a href="${candidate.url}" class="${linkClass}">${matchedStr}</a>`;

        tokens[i].text = tokens[i].text.replace(regex, replacement);
        injectedUrls.add(candidate.url.toLowerCase());
        injectedLinks.push({
          ...candidate,
          anchorText: matchedStr
        });
      }
    }
  }

  const resultHtml = tokens.map(t => t.text).join('');

  return {
    html: resultHtml,
    injectedCount: injectedLinks.length,
    injectedLinks
  };
}
