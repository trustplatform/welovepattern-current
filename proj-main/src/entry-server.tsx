import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { generateSeoHead, parsePathname } from './utils/seoRouting';

export async function render(
  url: string, 
  origin: string = 'https://welovepattern.com', 
  blogPosts?: any[], 
  categories?: any[],
  patternSeoArticles?: any[],
  sitePages?: any[]
) {
  const route = parsePathname(url, blogPosts, categories, sitePages);
  const head = generateSeoHead(url, origin, blogPosts, categories, patternSeoArticles, sitePages);
  const html = renderToString(
    <App 
      initialPath={url} 
      initialBlogPosts={blogPosts} 
      initialCategories={categories}
      initialPatternSeoArticles={patternSeoArticles}
      initialSitePages={sitePages}
    />
  );
  const statusCode = route.isNotFound ? 404 : 200;
  return { html, head, statusCode };
}

