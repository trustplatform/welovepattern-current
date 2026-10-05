import express from 'express';
import http from 'http';
import { createSeoEngineRouter } from './api/seoEngineRouter';

async function testServerApiRoutes() {
  console.log('=== STARTING SERVER ROUTE INTEGRATION TESTS ===');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string, details?: any) {
    if (cond) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  // Mock Admin Auth Middleware (simulates authorized admin session)
  const mockRequireAdminAuth: express.RequestHandler = (req, res, next) => {
    next();
  };

  const app = express();
  app.use(express.json());

  // Mount router as configured in server.ts
  const seoEngineRouter = createSeoEngineRouter(mockRequireAdminAuth);
  app.use('/api/seo-engine', seoEngineRouter);
  app.use('/api/admin/seo-engine', seoEngineRouter);

  // Catch-all JSON 404 for /api/*
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found', code: 'NOT_FOUND' });
  });

  // Wildcard SPA route
  app.get('*', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!DOCTYPE html><html><head><title>App</title></head><body><div id="root"></div></body></html>');
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. GET /api/seo-engine/status
    const statusRes = await fetch(`${baseUrl}/api/seo-engine/status`, {
      headers: { 'Accept': 'application/json' }
    });
    const statusJson = await statusRes.json();
    assert(statusRes.status === 200, '1. GET /api/seo-engine/status returns HTTP 200');
    assert(statusJson.success === true, '1b. GET /api/seo-engine/status returns success: true');
    assert(typeof statusJson.integrations === 'object', '1c. GET /api/seo-engine/status returns integrations object');

    // 2. GET /api/seo-engine/config
    const configRes = await fetch(`${baseUrl}/api/seo-engine/config`, {
      headers: { 'Accept': 'application/json' }
    });
    const configJson = await configRes.json();
    assert(configRes.status === 200, '2. GET /api/seo-engine/config returns HTTP 200');
    assert(configJson.success === true, '2b. GET /api/seo-engine/config returns config object');
    assert(configJson.config.articlesPerDay === 2, '2c. Active config has articlesPerDay === 2');

    // 3. GET /api/seo-engine/costs
    const costsRes = await fetch(`${baseUrl}/api/seo-engine/costs`, {
      headers: { 'Accept': 'application/json' }
    });
    const costsJson = await costsRes.json();
    assert(costsRes.status === 200, '3. GET /api/seo-engine/costs returns HTTP 200');
    assert(costsJson.success === true, '3b. GET /api/seo-engine/costs returns success: true');

    // 4. POST /api/seo-engine/config
    const postConfigRes = await fetch(`${baseUrl}/api/seo-engine/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minOpportunityScore: 65 })
    });
    const postConfigJson = await postConfigRes.json();
    assert(postConfigRes.status === 200, '4. POST /api/seo-engine/config returns HTTP 200');
    assert(postConfigJson.success === true, '4b. POST /api/seo-engine/config updates successfully');

    // 5. Unknown API route returns JSON 404 (not HTML)
    const unknownApiRes = await fetch(`${baseUrl}/api/non-existent-endpoint`, {
      headers: { 'Accept': 'application/json' }
    });
    const unknownApiJson = await unknownApiRes.json();
    assert(unknownApiRes.status === 404, '5. Unknown API route returns HTTP 404');
    assert(unknownApiJson.error === 'API route not found', '5b. Unknown API route returns JSON error instead of HTML');

    // 6. SPA Route returns HTML
    const spaRes = await fetch(`${baseUrl}/admin/engine-settings`);
    const spaText = await spaRes.text();
    assert(spaRes.status === 200, '6. Non-API route returns HTTP 200');
    assert(spaText.startsWith('<!DOCTYPE html>'), '6b. Non-API route returns HTML template');

  } finally {
    server.close();
  }

  console.log(`\n===============================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

testServerApiRoutes().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
