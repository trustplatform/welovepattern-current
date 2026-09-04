import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML string for safe rendering in blog articles.
 * Uses AST-based HTML parsing to prevent XSS, blocking dangerous tags,
 * event handlers, script injections, and obfuscated URLs.
 */
export function sanitizeBlogHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's', 'u',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'code', 'pre', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      '*': ['class', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        // If external link, add safe rel attributes
        if (href.startsWith('http://') || href.startsWith('https://')) {
          attribs.rel = 'noopener noreferrer nofollow';
        }
        return {
          tagName,
          attribs
        };
      }
    }
  });
}

/**
 * Sanitizes HTML string specifically for Pattern SEO / Helpful Content.
 * Enforces strictly NO H1 tags (downgrades <h1> to <h2> so pattern title remains the only H1).
 * Uses AST-based HTML parsing to remove all scripts, iframes, forms, objects, inline event handlers,
 * and dangerous protocols.
 */
export function sanitizePatternSeoHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's', 'u',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'code', 'pre', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      '*': ['class', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      h1: (_tagName, attribs) => ({
        tagName: 'h2',
        attribs
      }),
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        if (href.startsWith('http://') || href.startsWith('https://')) {
          attribs.rel = 'noopener noreferrer nofollow';
        }
        return {
          tagName,
          attribs
        };
      }
    }
  });
}

/**
 * Sanitizes HTML string specifically for Site Pages (Privacy, Terms, Sitemap & Schema).
 * Allows H1, H2, H3, H4, p, a, b, i, strong, em, strike, s, u, ul, ol, li, blockquote, hr, br,
 * table, thead, tbody, tr, th, td, code, pre, span, div.
 * Strips script, javascript: schemes, event handlers, iframes, objects, forms, and dangerous protocols.
 */
export function sanitizePageHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's', 'u',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'code', 'pre', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      '*': ['class', 'id']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        if (href.startsWith('http://') || href.startsWith('https://')) {
          attribs.rel = 'noopener noreferrer';
        }
        return {
          tagName,
          attribs
        };
      }
    }
  });
}

