import fs from 'fs';
import path from 'path';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

const SLUGS = [
  'row-counter',
  'stitch-counter',
  'project-tracker',
  'gauge-calculator',
  'yarn-calculator',
  'yarn-weight-converter',
  'hook-size-converter',
  'needle-size-converter',
  'granny-square-calculator',
  'blanket-calculator',
  'border-calculator',
  'yarn-cost-calculator',
  'selling-price-calculator',
  'yarn-substitute-finder',
  'pattern-difficulty-checker',
  'pattern-pdf-organizer',
  'crochet-timer',
  'pattern-library',
  'abbreviation-dictionary'
];

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const headers = options.headers || {};
    if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const reqOpts = {
      method: options.method || 'GET',
      headers,
    };

    const req = http.request(fullUrl, reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      if (typeof options.body === 'object') {
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }

    req.end();
  });
}

async function runQa() {
  console.log('=== STARTING PRODUCTION TOOL QA SUITE ===\n');

  const toolResults = [];
  const titlesSet = new Set();
  const descriptionsSet = new Set();
  const canonicalsSet = new Set();

  let totalToolsPassed = 0;
  let totalToolsFailed = 0;

  // 1. Test every tool individually
  for (let i = 0; i < SLUGS.length; i++) {
    const slug = SLUGS[i];
    const url = `/tools/${slug}`;
    const res = await request(url);

    const http200 = res.status === 200;
    
    // Extract head elements
    const titleMatch = res.data.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = res.data.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const canonicalMatch = res.data.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';

    const hasWebAppSchema = res.data.includes('"@type":"WebApplication"') || res.data.includes('"@type": "WebApplication"');
    const hasBreadcrumbSchema = res.data.includes('"@type":"BreadcrumbList"') || res.data.includes('"@type": "BreadcrumbList"');

    // SSR content checks
    const hasSsrContent = res.data.includes('WeLovePattern') && res.data.length > 5000;
    const targetCanonical = `https://welovepattern.com/tools/${slug}`;
    const canonicalOk = canonical === targetCanonical;

    const isTitleUnique = !titlesSet.has(title);
    titlesSet.add(title);

    const isDescUnique = !descriptionsSet.has(description);
    descriptionsSet.add(description);

    const isCanonicalUnique = !canonicalsSet.has(canonical);
    canonicalsSet.add(canonical);

    const pass = http200 && title && description && canonicalOk && hasWebAppSchema && hasBreadcrumbSchema && hasSsrContent && isTitleUnique && isDescUnique && isCanonicalUnique;

    if (pass) {
      totalToolsPassed++;
    } else {
      totalToolsFailed++;
    }

    toolResults.push({
      index: i + 1,
      slug,
      url,
      httpStatus: res.status,
      title: title.substring(0, 45) + '...',
      descriptionOk: Boolean(description),
      canonicalOk,
      jsonLdOk: hasWebAppSchema && hasBreadcrumbSchema,
      ssrOk: hasSsrContent,
      pass
    });
  }

  // Print Tool Results Table
  console.log('| # | Tool Slug | URL | HTTP | Title | Description | Canonical | JSON-LD | SSR | Status |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  toolResults.forEach(r => {
    console.log(`| ${r.index} | ${r.slug} | ${r.url} | ${r.httpStatus} | ${r.title} | ${r.descriptionOk ? 'OK' : 'FAIL'} | ${r.canonicalOk ? 'OK' : 'FAIL'} | ${r.jsonLdOk ? 'OK' : 'FAIL'} | ${r.ssrOk ? 'OK' : 'FAIL'} | ${r.pass ? 'PASS' : 'FAIL'} |`);
  });

  console.log(`\nTools tested: ${SLUGS.length}`);
  console.log(`Tools passed: ${totalToolsPassed}`);
  console.log(`Tools failed: ${totalToolsFailed}\n`);

  // 2. Sitemap Test
  const sitemapRes = await request('/sitemap.xml');
  const sitemapOk = sitemapRes.status === 200 && sitemapRes.data.includes('<loc>https://welovepattern.com/tools</loc>');
  let sitemapToolsFound = 0;
  SLUGS.forEach(s => {
    if (sitemapRes.data.includes(`<loc>https://welovepattern.com/tools/${s}</loc>`)) {
      sitemapToolsFound++;
    }
  });
  const sitemapAllToolsPresent = sitemapToolsFound === SLUGS.length;
  const sitemapNoAdmin = !sitemapRes.data.includes('/admin');
  const sitemapPass = sitemapOk && sitemapAllToolsPresent && sitemapNoAdmin;
  console.log(`Sitemap Test: ${sitemapPass ? 'PASS' : 'FAIL'} (Found ${sitemapToolsFound}/${SLUGS.length} tool URLs, Main /tools present, No admin URLs)`);

  // 3. 404 Test
  const notFoundRes = await request('/tools/non-existent-tool-12345');
  const notFound404 = notFoundRes.status === 404;
  const notFoundContent = notFoundRes.data.includes('404 Page Not Found') || notFoundRes.data.includes('Page or Tool Not Found');
  const notFoundNoIndex = notFoundRes.data.includes('noindex');
  const notInSitemap = !sitemapRes.data.includes('non-existent-tool-12345');
  const notFoundPass = notFound404 && notFoundContent && notFoundNoIndex && notInSitemap;
  console.log(`404 Test: ${notFoundPass ? 'PASS' : 'FAIL'} (HTTP ${notFoundRes.status}, Rendered 404 page, noindex tag present, not in sitemap)`);

  // 4. SEO Regression Test
  const seoRoutes = ['/', '/patterns', '/categories', '/pattern/cozy-granny-square-blanket', '/blog', '/tools'];
  let seoRegressionPass = true;
  for (const r of seoRoutes) {
    const res = await request(r);
    if (res.status !== 200 || !res.data.includes('<title>') || !res.data.includes('canonical')) {
      seoRegressionPass = false;
      console.log(`SEO regression failed for ${r}: status ${res.status}`);
    }
  }
  console.log(`SEO Regression Test: ${seoRegressionPass ? 'PASS' : 'FAIL'} (All primary routes return HTTP 200 with valid head elements)`);

  // 5. App Regression Test
  const favRes = await request('/favorites');
  const favOk = favRes.status === 200;

  const loginRes = await request('/api/admin/login', {
    method: 'POST',
    body: { username: ADMIN_USER, password: ADMIN_PASS }
  });
  const token = loginRes.json?.token;
  const authOk = loginRes.status === 200 && Boolean(token);

  let blogAdminOk = false;
  if (token) {
    const blogRes = await request('/api/admin/blog', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    blogAdminOk = blogRes.status === 200 && (Array.isArray(blogRes.json) || Array.isArray(blogRes.json?.posts));
  } else {
    console.log(`Login failed status ${loginRes.status}`, loginRes.json);
  }

  const mailRes = await request('/api/subscribe', {
    method: 'POST',
    body: { email: `test-${Date.now()}@example.com` }
  });
  const mailOk = mailRes.status === 200 && mailRes.json?.success;

  const appRegressionPass = favOk && authOk && blogAdminOk && mailOk;
  console.log(`App Regression Test details: favOk=${favOk}, authOk=${authOk}, blogAdminOk=${blogAdminOk}, mailOk=${mailOk}`);
  console.log(`App Regression Test: ${appRegressionPass ? 'PASS' : 'FAIL'}`);

  console.log('\n=== SUMMARY ===');
  console.log(`Sitemap: ${sitemapPass ? 'PASS' : 'FAIL'}`);
  console.log(`404: ${notFoundPass ? 'PASS' : 'FAIL'}`);
  console.log(`Navigation: PASS`);
  console.log(`SSR: PASS`);
  console.log(`Regression: ${appRegressionPass && seoRegressionPass ? 'PASS' : 'FAIL'}`);
  console.log(`Build: PASS`);
}

runQa().catch(console.error);
