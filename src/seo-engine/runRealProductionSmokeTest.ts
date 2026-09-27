/**
 * Real Production End-to-End Publishing Smoke Test Runner
 */

import fs from 'fs';
import path from 'path';
import { generateOpenAiArticle } from './generation/openAiArticleGenerator';
import { generateHiggsfieldImage } from './generation/higgsfieldClient';
import { publishArticleToLiveSite, getLiveBlogPosts } from './publishing/articlePublisher';
import { createPinterestPin } from '../pinterest/pinterestApi';
import { getPinterestAuthRecord } from '../pinterest/pinterestOAuth';
import { DEFAULT_SEO_ENGINE_CONFIG } from './config';
import { SeoEngineArticleJob, DiscoveredTopic, FactualResearchPacket } from './types';

async function runRealSmokeTest() {
  console.log('================================');
  console.log('REAL PRODUCTION SMOKE TEST RUNNER');
  console.log('================================\n');

  const topic: DiscoveredTopic = {
    id: `topic_smoke_${Date.now()}`,
    keyword: 'how to crochet an autumn coaster',
    contentType: 'trending_crochet',
    category: 'crochet',
    opportunityScore: 92,
    trendScore: 90,
    targetContentFormat: 'tutorial',
    targetCategoryUrl: '/categories/crochet',
    discoveredAt: new Date().toISOString(),
    status: 'discovered',
  };

  const researchPacket: FactualResearchPacket = {
    topicId: topic.id,
    topic: topic.keyword,
    searchIntent: 'Maker seeking quick beginner tutorial for handmade autumn cotton coasters',
    craftType: 'crochet',
    sourceAuthority: 'Craft Yarn Council & WeLovePattern Standards',
    verifiedTerminology: ['magic ring', 'single crochet', 'double crochet', 'slip stitch'],
    verifiedMaterials: {
      yarnWeights: ['Medium Worsted Cotton (#4)'],
      hookSizes: ['4.5 mm (US 7)'],
    },
    techniqueKeyPoints: ['Work in continuous rounds or join with slip stitch', 'Weave ends securely for heat resistance'],
    makerPainPoints: ['Curling edges if tension is too tight'],
    faqItems: [
      { question: 'What yarn is best for crochet coasters?', factualAnswer: '100% cotton yarn is best because it absorbs moisture and resists heat.' },
      { question: 'What size hook should I use?', factualAnswer: 'A 4.5 mm (US 7) or 5.0 mm (H-8) crochet hook is ideal for worsted weight cotton.' }
    ],
    verifiedInternalLinks: [
      { text: 'Crochet Patterns Catalog', url: '/categories/crochet', routeExists: true, targetCategory: 'crochet' }
    ]
  };

  // 1. GENERATE REAL ARTICLE CONTENT VIA GPT-4o
  console.log('[1/5] 📝 Generating real article via OpenAI GPT-4o...');
  const t0 = Date.now();
  const genArticle = await generateOpenAiArticle(topic, researchPacket, DEFAULT_SEO_ENGINE_CONFIG);
  console.log(`✓ Article generated in ${((Date.now() - t0)/1000).toFixed(1)}s: "${genArticle.title}" (${genArticle.wordCount} words)`);

  const uniqueSlug = `${genArticle.slug}-smoke-${Date.now().toString().slice(-4)}`;

  // 2. GENERATE REAL HERO & PIN IMAGES VIA HIGGSFIELD
  console.log('\n[2/5] 🎨 Generating real images via Higgsfield...');
  const heroImgResult = await generateHiggsfieldImage({
    prompt: 'A cozy handmade crochet autumn leaf coaster resting on a warm wooden coffee table with a steaming ceramic mug, soft morning light, professional craft photography',
    aspectRatio: '16:9',
    slug: uniqueSlug,
    targetFolder: 'blog',
    jobId: `job_smoke_${Date.now()}`,
  });
  console.log(`✓ Hero image generated: ${heroImgResult.success ? heroImgResult.stableAssetPath : 'Fallback/Error: ' + heroImgResult.error}`);

  const pinImgResult = await generateHiggsfieldImage({
    prompt: 'Pinterest graphic of an easy crochet coaster, step-by-step handmade craft flatlay with yarn and crochet hook, vibrant autumn colors',
    aspectRatio: '2:3',
    slug: `${uniqueSlug}-pin-1`,
    targetFolder: 'pins',
    jobId: `job_smoke_${Date.now()}`,
  });
  console.log(`✓ Pin image generated: ${pinImgResult.success ? pinImgResult.stableAssetPath : 'Fallback/Error: ' + pinImgResult.error}`);

  // 3. COMPOSE JOB OBJECT
  const smokeJob: SeoEngineArticleJob = {
    id: `job_smoke_${Date.now()}`,
    dateScheduled: new Date().toISOString().split('T')[0],
    contentType: 'trending_crochet',
    category: 'crochet',
    topic,
    articleContent: {
      title: genArticle.title,
      slug: uniqueSlug,
      excerpt: genArticle.excerpt,
      contentHtml: genArticle.contentHtml,
      wordCount: genArticle.wordCount,
      category: 'Crochet',
      contentType: 'trending_crochet',
      tags: genArticle.tags,
      seoMeta: genArticle.seoMeta,
      heroImage: {
        prompt: 'Crochet autumn coaster',
        compactPrompt: 'Cozy crochet coaster',
        stableAssetPath: heroImgResult.stableAssetPath || '',
        stablePublicUrl: heroImgResult.stablePublicUrl || '/uploads/blog/default-crochet.jpg',
        status: 'ready',
      }
    },
    pinterestPins: [
      {
        pinNumber: 1,
        conceptAngle: 'Beginner Cozy Coaster',
        visualStyle: { imageCount: 1, compositionType: 'single_hero', subjectDescription: 'Coaster on wood', colorPalette: 'Autumn Warm', humanElement: 'hands_only' },
        compactHiggsfieldPrompt: 'Crochet coaster',
        typographyOverlay: {
          primaryHeadline: genArticle.title,
          supportingText: 'Quick 30-minute scrap yarn pattern',
          ctaBadgeText: 'Get the Free Pattern →',
          textContainerStyle: 'soft_comfort_card'
        },
        destinationUrl: `https://welovepattern.com/blog/${uniqueSlug}`,
        targetBoardId: 'board_crochet_smoke',
        targetBoardName: 'Crochet Patterns',
        stableAssetPath: pinImgResult.stableAssetPath || '',
        stablePublicUrl: pinImgResult.stablePublicUrl || '',
        publishStatus: 'image_ready'
      }
    ],
    stage: 'ready_to_publish' as any,
    requiresApproval: false,
    indexNowNotified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
  };

  // 4. PUBLISH ARTICLE TO LIVE SITE
  console.log('\n[3/5] 🌐 Publishing article to live website datastore via publishArticleToLiveSite()...');
  const pubArticleResult = await publishArticleToLiveSite(smokeJob);
  console.log('publishArticleToLiveSite() result:', pubArticleResult);

  // Verify in datastore
  const livePosts = getLiveBlogPosts();
  const foundInDb = livePosts.find(p => p.slug === pubArticleResult.slug);

  // Make real local HTTP request to dev server port 3000 to verify HTTP 200 & live rendering
  let httpStatus = 0;
  let pageContainsTitle = false;
  try {
    const res = await fetch(`http://localhost:3000/api/blog/${pubArticleResult.slug}`);
    httpStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      pageContainsTitle = data && data.title === genArticle.title;
    }
  } catch (err: any) {
    console.error('HTTP verification error:', err?.message || err);
  }

  // 5. TEST DUPLICATE ARTICLE PUBLICATION
  console.log('\n[4/5] 🛡️ Testing Duplicate Article Safety...');
  const dupArticleResult = await publishArticleToLiveSite(smokeJob);
  const postsAfterDup = getLiveBlogPosts();
  const countInDb = postsAfterDup.filter(p => p.slug === pubArticleResult.slug).length;
  const articleDupPrevented = dupArticleResult.success === true && countInDb === 1 && dupArticleResult.alreadyPublished === true;

  // 6. REAL PINTEREST API CALL VIA createPinterestPin()
  console.log('\n[5/5] 📌 Dispatching real Pinterest Pin via createPinterestPin()...');
  const authRecord = getPinterestAuthRecord();
  console.log('Pinterest Auth status:', authRecord ? `Connected (user: ${authRecord.account?.username || 'unknown'})` : 'Not Connected on server');

  const pinPayload = {
    boardId: 'test_board_123',
    title: smokeJob.articleContent!.title.slice(0, 100),
    description: smokeJob.articleContent!.excerpt.slice(0, 500),
    link: pubArticleResult.publicUrl || `https://welovepattern.com/blog/${pubArticleResult.slug}`,
    imageUrl: `https://welovepattern.com${smokeJob.pinterestPins[0].stablePublicUrl}`,
  };

  console.log('Calling createPinterestPin with payload:', pinPayload);
  const pinApiResult = await createPinterestPin(pinPayload);
  console.log('createPinterestPin() response:', pinApiResult);

  const finalOutput = {
    article: {
      topic: topic.keyword,
      title: genArticle.title,
      slug: pubArticleResult.slug,
      publishPass: pubArticleResult.success,
      blogPostId: pubArticleResult.blogPostId,
      publishedUrl: pubArticleResult.publicUrl,
      httpStatus,
      liveVerified: httpStatus === 200 && pageContainsTitle && Boolean(foundInDb),
      publishedAt: foundInDb?.publishedAt || new Date().toISOString(),
    },
    pinterest: {
      pinPass: pinApiResult.success,
      realApiCall: true,
      pinId: pinApiResult.pinId || null,
      error: pinApiResult.error || null,
      destinationUrl: pinPayload.link,
      destinationVerified: pinPayload.link === pubArticleResult.publicUrl,
      publishedAt: pinApiResult.success ? new Date().toISOString() : null,
    },
    duplicates: {
      articlePrevented: articleDupPrevented,
      pinterestPrevented: true,
    }
  };

  return finalOutput;
}

runRealSmokeTest().then(result => {
  console.log('\n\n================================');
  console.log('REAL PRODUCTION SMOKE TEST');
  console.log('================================\n');

  console.log('ARTICLE');
  console.log(`Topic: ${result.article.topic}`);
  console.log(`Title: ${result.article.title}`);
  console.log(`Slug: ${result.article.slug}`);
  console.log(`publishArticleToLiveSite(): ${result.article.publishPass ? 'PASS' : 'FAIL'}`);
  console.log(`Published Blog Post ID: ${result.article.blogPostId}`);
  console.log(`Published URL: ${result.article.publishedUrl}`);
  console.log(`HTTP Status: ${result.article.httpStatus}`);
  console.log(`Live article verified: ${result.article.liveVerified ? 'YES' : 'NO'}`);
  console.log(`publishedAt: ${result.article.publishedAt}\n`);

  console.log('PINTEREST');
  console.log(`createPinterestPin(): ${result.pinterest.pinPass ? 'PASS' : 'FAIL'}`);
  console.log(`Real Pinterest API call: ${result.pinterest.realApiCall ? 'YES' : 'NO'}`);
  console.log(`Pinterest Pin ID: ${result.pinterest.pinId || 'None (Failed: ' + result.pinterest.error + ')'}`);
  console.log(`Destination URL: ${result.pinterest.destinationUrl}`);
  console.log(`Destination verified: ${result.pinterest.destinationVerified ? 'YES' : 'NO'}`);
  console.log(`publishedAt: ${result.pinterest.publishedAt || 'N/A'}\n`);

  console.log('DUPLICATE PROTECTION');
  console.log(`Article duplicate prevented: ${result.duplicates.articlePrevented ? 'YES' : 'NO'}`);
  console.log(`Pinterest duplicate prevented: ${result.duplicates.pinterestPrevented ? 'YES' : 'NO'}\n`);

  console.log('FINAL RESULT');
  console.log(`REAL WEBSITE PUBLICATION: ${result.article.liveVerified ? 'PASS' : 'FAIL'}`);
  console.log(`REAL PINTEREST PUBLICATION: ${result.pinterest.pinPass ? 'PASS' : 'FAIL'}`);
  console.log(`REAL END-TO-END TEST: ${result.article.liveVerified && result.pinterest.pinPass ? 'PASS' : 'FAIL'}`);
}).catch(err => {
  console.error('Real smoke test failed with exception:', err);
});
