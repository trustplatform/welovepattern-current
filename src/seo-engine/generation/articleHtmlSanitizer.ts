/**
 * SEO Content Engine - Hardened Article HTML Sanitizer & Word Counter
 * 
 * Sanitizes generated article HTML using strict allowlists to prevent XSS,
 * prompt injection, malformed markup, or broken styling, and accurately computes word count.
 * 
 * ADVERSARIAL DEFENSES:
 * 1. Strips all <script>, <iframe>, <object>, <embed>, <svg>, <style>, <form>, <input>.
 * 2. Strips all inline event handlers (onload, onerror, onclick, onmouseover, etc.).
 * 3. Restricts URI schemes to http, https, mailto (strictly forbids javascript:, data:, vbscript:).
 * 4. Strips HTML comments (<!-- ... -->) to eliminate hidden payload injection.
 * 5. Scrubs prompt injection / system prompt leaking phrases from article body.
 */

import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'ul', 'ol', 'li', 'blockquote',
  'strong', 'em', 'b', 'i', 'u', 's',
  'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr', 'br', 'code', 'pre'
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'rel', 'class', 'id', 'target'],
  div: ['class', 'id', 'data-type'],
  span: ['class', 'id'],
  table: ['class'],
  th: ['class', 'scope'],
  td: ['class'],
  h2: ['id', 'class'],
  h3: ['id', 'class'],
  h4: ['id', 'class'],
  p: ['class'],
  ul: ['class'],
  ol: ['class'],
  li: ['class'],
  blockquote: ['class']
};

/** Known adversarial prompt injection / jailbreak patterns */
const ADVERSARIAL_PATTERNS = [
  /(?:ignore|disregard)\s+(?:all\s+)?(?:previous|prior)\s+instructions/gi,
  /(?:system\s+prompt|as\s+an\s+ai\s+language\s+model)/gi,
  /(?:you\s+are\s+a\s+helpful\s+assistant)/gi,
  /(?:drop\s+table|delete\s+from|rm\s+-rf)/gi,
  /\{\{\s*config\.[^}]+\s*\}\}/gi,
];

/**
 * Sanitizes article HTML content.
 */
export function sanitizeArticleHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // 1. Scrub prompt injections & system leak phrases
  let cleaned = rawHtml;
  for (const pattern of ADVERSARIAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[Content Removed]');
  }

  // 2. Strict HTML sanitization
  const sanitized = sanitizeHtml(cleaned, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    // Prohibit HTML comments
    exclusiveFilter: (frame) => {
      // Discard comment nodes
      return frame.tag === '!--';
    },
    transformTags: {
      a: (tagName, attribs) => {
        let href = (attribs.href || '').trim();

        // Disallow dangerous or pseudo schemes
        if (/^(?:javascript|data|vbscript|file):/i.test(href)) {
          return { tagName: 'span', attribs: { class: 'neutralized-link' } };
        }

        // Clean query strings and hashes from internal routes if present
        if (href.startsWith('/')) {
          const cleanPath = href.split('?')[0].split('#')[0];
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              href: cleanPath,
            }
          };
        }

        // External links get noopener and noreferrer
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            href,
            rel: 'noopener noreferrer'
          }
        };
      }
    }
  });

  return sanitized;
}

/**
 * Calculates plain-text word count of an HTML string accurately.
 */
export function countHtmlWords(html: string): number {
  if (!html || typeof html !== 'string') return 0;

  // Strip all HTML tags
  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return 0;

  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}
