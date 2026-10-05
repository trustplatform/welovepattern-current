import { generatePinterestCreativeConcepts, resolveRealPinterestBoard } from "../generation/pinterestCreativeDirector";
import { generateHiggsfieldImage } from "../generation/higgsfieldClient";
import { DiscoveredTopic } from "../types";
import { GeneratedArticle } from "../generation/openAiArticleGenerator";

async function main() {
  const topic: DiscoveredTopic = {
    id: "topic_halloween_test",
    keyword: "Halloween crochet ideas",
    contentType: "trending_crochet",
    category: "crochet",
    source: "gsc_seed",
    trendScore: 90,
    trendDirection: "rising",
    opportunityScore: 92,
    targetContentFormat: "ideas_roundup",
    targetCategoryUrl: "/categories/crochet",
    targetAudienceLevel: "all_levels",
    searchIntentNotes: "Seasonal Halloween crochet ideas roundup",
    discoveredAt: new Date().toISOString(),
    status: "discovered",
  };

  const article: GeneratedArticle = {
    title: "Halloween Crochet Ideas: 12 Spooky Projects to Make Before October",
    slug: "halloween-crochet-ideas-12-spooky-projects",
    category: "crochet",
    metaTitle: "Halloween Crochet Ideas: 12 Spooky Projects",
    metaDescription: "Explore 12 spooky Halloween crochet ideas and patterns.",
    primaryKeyword: "Halloween crochet ideas",
    secondaryKeywords: ["crochet pumpkin pattern", "amigurumi ghost"],
    readingTimeMinutes: 6,
    wordCount: 1200,
    sections: [],
    faq: [],
    summaryBulletPoints: [],
    htmlContent: "",
    internalLinks: [],
  };

  const packet = {
    craftType: "crochet" as const,
    coreUserProblem: "Finding cute and quick Halloween crochet projects",
    practicalSolutions: ["amigurumi ghosts", "crochet pumpkins", "witch hat garlands"],
    verifiedMaterials: {
      hookSizes: ["4.0mm (G-6)", "5.0mm (H-8)"],
      yarnWeights: ["Medium / Worsted #4"],
      stitchTermsStandard: "US" as const,
      safetyBufferPercent: 10,
    },
    suggestedInternalTools: ["/tools/yarn-calculator"],
    suggestedInternalCategories: ["/categories/crochet", "/categories/amigurumi"],
  };

  const boardRes = await resolveRealPinterestBoard(topic, "crochet", undefined, { allowTestFallback: true });
  const board = boardRes.board || { id: "board_decor", name: "Crochet Home Decor" };

  console.log("Generating creative concepts from Pinterest Creative Director...");
  const concepts = generatePinterestCreativeConcepts(topic, article, packet as any, board, 2);

  console.log("PIN 1 CONCEPT ANGLE:", concepts[0].conceptAngle);
  console.log("PIN 1 PROMPT:\n", concepts[0].compactHiggsfieldPrompt);

  console.log("\nPIN 2 CONCEPT ANGLE:", concepts[1].conceptAngle);
  console.log("PIN 2 PROMPT:\n", concepts[1].compactHiggsfieldPrompt);

  console.log("\n--- Executing Pin 1 Higgsfield Generation ---");
  const pin1Result = await generateHiggsfieldImage({
    prompt: concepts[0].compactHiggsfieldPrompt,
    aspectRatio: "2:3",
    resolution: "1k",
    slug: "halloween-crochet-ideas-pin1-v2",
    targetFolder: "pinterest",
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
  });
  console.log("PIN 1 RESULT:", JSON.stringify(pin1Result, null, 2));

  console.log("\n--- Executing Pin 2 Higgsfield Generation ---");
  const pin2Result = await generateHiggsfieldImage({
    prompt: concepts[1].compactHiggsfieldPrompt,
    aspectRatio: "2:3",
    resolution: "1k",
    slug: "halloween-crochet-ideas-pin2-v2",
    targetFolder: "pinterest",
    timeoutMs: 180000,
    estimatedCostUsd: 0.03,
  });
  console.log("PIN 2 RESULT:", JSON.stringify(pin2Result, null, 2));
}

main().catch(err => {
  console.error("Error running test:", err);
  process.exit(1);
});
