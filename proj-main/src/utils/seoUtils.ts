/**
 * Utility to dynamically update HTML <head> meta tags for SEO and Social Media (OpenGraph / Twitter Cards)
 */

export interface SeoOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
}

export function updateHeadMetaTags(options: SeoOptions) {
  if (typeof document === 'undefined') return;

  const siteTitle = 'WeLovePattern - Free Crochet Patterns & Tools';
  const fullTitle = options.title ? `${options.title} | WeLovePattern` : siteTitle;

  // 1. Update <title>
  document.title = fullTitle;

  // Helper function to create or update <meta> tags
  const setMetaTag = (selector: string, keyName: 'name' | 'property', keyValue: string, contentValue: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(keyName, keyValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', contentValue || '');
  };

  // Helper function to create or update <link rel="canonical">
  const setCanonicalLink = (hrefValue: string) => {
    let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      document.head.appendChild(element);
    }
    element.setAttribute('href', hrefValue || window.location.href);
  };

  // 2. Standard Meta Tags
  if (options.description) {
    setMetaTag('meta[name="description"]', 'name', 'description', options.description);
  }
  if (options.keywords) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', options.keywords);
  }
  if (options.author) {
    setMetaTag('meta[name="author"]', 'name', 'author', options.author);
  }

  // 3. OpenGraph (Facebook / Pinterest / WhatsApp)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', options.title || siteTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', options.description || '');
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', options.type || 'website');
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', options.url || window.location.href);
  if (options.image) {
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', options.image);
  }

  // 4. Twitter Cards
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', options.title || siteTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', options.description || '');
  if (options.image) {
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', options.image);
  }

  // 5. Canonical URL
  if (options.url) {
    setCanonicalLink(options.url);
  }
}
