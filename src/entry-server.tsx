import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { generateSeoHead, parsePathname } from './utils/seoRouting';
import { SITE_URL } from './constants';

export async function render(
  url: string, 
  origin: string = SITE_URL, 
  blogPosts?: any[], 
  categories?: any[],
  patternSeoArticles?: any[],
  sitePages?: any[],
  patterns?: any[]
) {
  const route = parsePathname(url, blogPosts, categories, sitePages, patterns);
  const head = generateSeoHead(url, origin, blogPosts, categories, patternSeoArticles, sitePages, patterns);
  const html = renderToString(
    <App 
      initialPath={url} 
      initialBlogPosts={blogPosts} 
      initialCategories={categories}
      initialPatternSeoArticles={patternSeoArticles}
      initialSitePages={sitePages}
      initialPatterns={patterns}
    />
  );
  const statusCode = route.isNotFound ? 404 : 200;
  return { html, head, statusCode };
}

