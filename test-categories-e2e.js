import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e){}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Category Management E2E Tests...\n');
  let cookie = '';

  // 1. Public GET /api/categories
  console.log('Test 1: Public GET /api/categories');
  const pubRes = await request({ host: 'localhost', port: 3000, path: '/api/categories', method: 'GET' });
  if (pubRes.statusCode === 200 && Array.isArray(pubRes.body.categories)) {
    console.log(`  ✅ Passed: Returned ${pubRes.body.categories.length} active categories.`);
  } else {
    console.error('  ❌ Failed Public GET /api/categories:', pubRes);
    process.exit(1);
  }

  // 2. Unauthenticated GET /api/admin/categories
  console.log('\nTest 2: Unauthenticated GET /api/admin/categories');
  const unauthRes = await request({ host: 'localhost', port: 3000, path: '/api/admin/categories', method: 'GET' });
  if (unauthRes.statusCode === 401 || unauthRes.statusCode === 403) {
    console.log(`  ✅ Passed: Rejected with status ${unauthRes.statusCode}.`);
  } else {
    console.error('  ❌ Failed Unauthenticated GET:', unauthRes);
    process.exit(1);
  }

  // 3. Admin Login
  console.log('\nTest 3: Admin Login /api/admin/login');
  const loginRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'password123' });

  if (loginRes.statusCode === 200 && loginRes.body.success) {
    const setCookie = loginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      cookie = setCookie[0].split(';')[0];
    }
    console.log(`  ✅ Passed: Admin authenticated. Cookie: ${cookie}`);
  } else {
    console.error('  ❌ Failed Admin Login:', loginRes);
    process.exit(1);
  }

  // 4. Authenticated Admin GET /api/admin/categories
  console.log('\nTest 4: Authenticated GET /api/admin/categories');
  const adminCatRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/categories',
    method: 'GET',
    headers: { Cookie: cookie }
  });

  if (adminCatRes.statusCode === 200 && Array.isArray(adminCatRes.body.categories)) {
    console.log(`  ✅ Passed: Loaded ${adminCatRes.body.totalCount} total categories.`);
  } else {
    console.error('  ❌ Failed Admin GET /api/admin/categories:', adminCatRes);
    process.exit(1);
  }

  // 5. Create Test Category
  console.log('\nTest 5: Create Test Category /api/admin/categories');
  const createRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/categories',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie }
  }, {
    name: 'Hats & Caps',
    slug: 'hats-caps',
    description: 'Cozy crochet beanies and sun hats',
    isFreeBadge: true,
    displayOrder: 140,
    isActive: true
  });

  if (createRes.statusCode === 201 && createRes.body.success) {
    console.log(`  ✅ Passed: Created category "${createRes.body.category.name}" (${createRes.body.category.slug}).`);
  } else {
    console.error('  ❌ Failed Create Category:', createRes);
    process.exit(1);
  }

  // 6. Toggle Category Status
  console.log('\nTest 6: Toggle Status /api/admin/categories/hats-caps/status');
  const toggleRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/categories/hats-caps/status',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie }
  }, { isActive: false });

  if (toggleRes.statusCode === 200 && toggleRes.body.category.isActive === false) {
    console.log('  ✅ Passed: Category status updated to hidden.');
  } else {
    console.error('  ❌ Failed Toggle Status:', toggleRes);
    process.exit(1);
  }

  // 7. Update Category
  console.log('\nTest 7: Update Category /api/admin/categories/hats-caps');
  const updateRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/categories/hats-caps',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie }
  }, {
    name: 'Hats & Slouchies',
    description: 'Updated beanie & slouchy hat pattern collection'
  });

  if (updateRes.statusCode === 200 && updateRes.body.category.name === 'Hats & Slouchies') {
    console.log('  ✅ Passed: Category updated successfully.');
  } else {
    console.error('  ❌ Failed Update Category:', updateRes);
    process.exit(1);
  }

  // 8. Delete Test Category
  console.log('\nTest 8: Delete Category /api/admin/categories/hats-caps');
  const deleteRes = await request({
    host: 'localhost',
    port: 3000,
    path: '/api/admin/categories/hats-caps',
    method: 'DELETE',
    headers: { Cookie: cookie }
  });

  if (deleteRes.statusCode === 200 && deleteRes.body.success) {
    console.log('  ✅ Passed: Category deleted safely.');
  } else {
    console.error('  ❌ Failed Delete Category:', deleteRes);
    process.exit(1);
  }

  console.log('\n🎉 ALL 8 E2E CATEGORY MANAGEMENT TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
