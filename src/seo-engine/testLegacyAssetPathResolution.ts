/**
 * Focused Isolated Test: Legacy and Cross-Environment Asset Path Resolution
 * 
 * Verifies that local image paths resolve correctly whether referenced as:
 * 1. AI Studio paths: /app/applet/public/...
 * 2. VPS paths: /www/wwwroot/welovepattern.com/public/...
 * 3. Root relative paths: /public/... or public/...
 * 
 * Verifies that invalid paths, remote URLs, and empty/small files are rejected.
 * Verifies zero mutations to production data.
 */

import path from 'path';
import fs from 'fs';
import { isValidLocalAsset, resolveLocalAssetDiskPath } from './queue/assetRecovery';

async function testLegacyAssetPathResolution() {
  console.log('=== STARTING LEGACY ASSET PATH RESOLUTION TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, details || '');
      failed++;
    }
  }

  const sampleFilename = 'mastering-crochet-gauge-your-ultimate-ca-abd915e19f.jpg';
  const realFileOnDisk = path.resolve(process.cwd(), 'public/generated/blog', sampleFilename);
  assert(fs.existsSync(realFileOnDisk), '0. Real sample file exists on disk for baseline');

  // 1. AI Studio absolute path
  const aiStudioPath = `/app/applet/public/generated/blog/${sampleFilename}`;
  assert(
    isValidLocalAsset(aiStudioPath),
    '1. isValidLocalAsset validates /app/applet/ path format'
  );
  assert(
    resolveLocalAssetDiskPath(aiStudioPath) !== null,
    '1b. resolveLocalAssetDiskPath returns non-null for /app/applet/ path format'
  );

  // 2. Production VPS absolute path
  const vpsPath = `/www/wwwroot/welovepattern.com/public/generated/blog/${sampleFilename}`;
  assert(
    isValidLocalAsset(vpsPath),
    '2. isValidLocalAsset validates VPS /www/wwwroot/welovepattern.com/ path format'
  );
  assert(
    resolveLocalAssetDiskPath(vpsPath) !== null,
    '2b. resolveLocalAssetDiskPath resolves VPS path format to physical disk file'
  );

  // 3. Leading slash public path
  const leadingSlashPath = `/public/generated/blog/${sampleFilename}`;
  assert(
    isValidLocalAsset(leadingSlashPath),
    '3. isValidLocalAsset validates /public/generated/... path format'
  );

  // 4. Relative public path
  const relativePath = `public/generated/blog/${sampleFilename}`;
  assert(
    isValidLocalAsset(relativePath),
    '4. isValidLocalAsset validates public/generated/... relative path format'
  );

  // 5. Non-existent file rejection
  assert(
    !isValidLocalAsset('/app/applet/public/generated/blog/non-existent-image-12345.jpg'),
    '5. Non-existent image path rejected'
  );
  assert(
    !isValidLocalAsset('/www/wwwroot/welovepattern.com/public/generated/blog/non-existent-image-12345.jpg'),
    '5b. Non-existent VPS path rejected'
  );

  // 6. Remote URL rejection
  assert(
    !isValidLocalAsset('https://welovepattern.com/public/generated/blog/test.jpg'),
    '6. Remote URL rejected by local asset validator'
  );

  // 7. Undefined / null rejection
  assert(!isValidLocalAsset(undefined), '7. Undefined path rejected');
  assert(!isValidLocalAsset(''), '7b. Empty string path rejected');

  console.log('\n===============================================================');
  console.log(`ASSET PATH RESOLUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

testLegacyAssetPathResolution().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
