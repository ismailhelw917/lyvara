/**
 * Automation Engine
 *
 * Manages all scheduled jobs for the jewelry affiliate website:
 * - Daily product refresh from Amazon
 * - Daily AI blog post generation with hero images
 * - Weekly layout optimization (promote top performers, replace underperformers)
 * - Continuous performance scoring
 * - Owner notifications for threshold alerts
 */

import {
  createAutomationLog,
  getFeaturedProducts,
  getProducts,
  getProductsForOptimization,
  getSetting,
  setSetting,
  updateAutomationLog,
  updateProductDisplay,
  updateProductMetrics,
  upsertProduct,
  createBlogPost,
  getDb,
} from "./db";
import { fetchAllCategories } from "./amazonService";
import { calculatePerformanceScore, classifyProducts, generateBlogPost, generateHeroImage } from "./contentService";
import { notifyOwner } from "./_core/notification";
import { trackAutomationRun, trackContentEvent } from "./counterService";
import { eq, sql } from "drizzle-orm";
import { products } from "../drizzle/schema";
import { pinBlogPost, pinProduct } from "./pinterestService";
import { runLinkAudit } from "./linkAuditService";
import { replaceBrokenLinks } from "./linkReplacementService";
import { validateAndDeduplicateProducts, cleanupDuplicates, getDataQualityReport } from "./productValidationService";
import { fetchAndCacheProductImages } from "./imageService";
import { fetchAndUpdateJewelryProducts } from "./productFetcher";

// ─── Product Fetch Job ────────────────────────────────────────────────────────
export async function runProductFetch(): Promise<{ success: boolean; productsUpdated: number; message: string }> {
  const startTime = Date.now();
  const db = await getDb();

  // Create log entry
  const logResult = await createAutomationLog({
    jobType: "product_fetch",
    status: "running",
    message: "Starting Amazon product fetch...",
  });

  const logId = (logResult as any)?.insertId;

  try {
    console.log("[AutomationEngine] Starting product fetch job");

    // Fetch all product categories
    const newProducts = await fetchAllCategories();
    
    // Validate and deduplicate products
    const { valid, invalid, duplicates } = await validateAndDeduplicateProducts(newProducts);
    
    console.log(`[AutomationEngine] Product validation: ${valid.length} valid, ${invalid.length} invalid, ${duplicates.length} duplicates`);
    
    let updatedCount = 0;
    for (const product of valid) {
      try {
        await upsertProduct(product);
        updatedCount++;
      } catch (err) {
        console.warn(`[AutomationEngine] Failed to upsert product ${product.asin}:`, err);
      }
    }
    
    // Clean up any existing duplicates
    const cleanupResult = await cleanupDuplicates();
    if (cleanupResult.duplicatesRemoved > 0) {
      console.log(`[AutomationEngine] Cleaned up ${cleanupResult.duplicatesRemoved} duplicate products`);
    }

    // Get data quality report
    const qualityReport = await getDataQualityReport();
    
    const duration = Date.now() - startTime;
    const message = `Successfully fetched and updated ${updatedCount} products (${invalid.length} invalid, ${duplicates.length} duplicates filtered). Data quality: ${qualityReport.dataQualityScore}%`;

    if (logId) {
      await updateAutomationLog(logId, {
        status: "success",
        message,
        productsUpdated: updatedCount,
        duration,
      });
    }

    await setSetting("last_product_fetch", new Date().toISOString());

    // Notify owner if significant update
    if (updatedCount > 0) {
      await notifyOwner({
        title: "Product Catalog Updated",
        content: `${updatedCount} jewelry products have been refreshed from Amazon. Your catalog is up to date.`,
      }).catch(() => {}); // Non-blocking
    }

    console.log(`[AutomationEngine] Product fetch complete: ${updatedCount} products`);
    
    // Fetch and cache product images
    console.log("[AutomationEngine] Starting image fetch and cache job...");
    const imageResult = await fetchAndCacheProductImages();
    console.log(`[AutomationEngine] Image cache complete: ${imageResult.imagesUpdated} images updated`);
    
    await trackAutomationRun(); // CounterAPI: automation-runs
    return { success: true, productsUpdated: updatedCount, message };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const message = `Product fetch failed: ${error.message}`;

    if (logId) {
      await updateAutomationLog(logId, { status: "failed", message, duration });
    }

    // Notify owner of failure
    await notifyOwner({
      title: "Product Fetch Failed",
      content: `The automated product fetch encountered an error: ${error.message}. Please check your Amazon API credentials.`,
    }).catch(() => {});

    throw error;
  }
}

// ─── Blog Generation Job ──────────────────────────────────────────────────────
type BlogCategory = "style_guide" | "trend_report" | "gift_ideas" | "care_tips" | "brand_spotlight" | "seasonal" | "promotional";

export async function runBlogGeneration(forcedCategory?: BlogCategory): Promise<{ success: boolean; postsGenerated: number; message: string }> {
  const startTime = Date.now();

  const logResult = await createAutomationLog({
    jobType: "blog_generation",
    status: "running",
    message: "Starting AI blog post generation...",
  });
  const logId = (logResult as any)?.insertId;

  try {
    console.log("[AutomationEngine] Starting blog generation job");

    // Get featured products to reference in blog
    const featuredProducts = await getFeaturedProducts(5);

    // Rotate through blog categories (or use forced category from admin)
    const categories: BlogCategory[] = ["style_guide", "trend_report", "gift_ideas", "care_tips", "brand_spotlight", "seasonal", "promotional"];
    let category: BlogCategory;
    let categoryIndex: number;
    if (forcedCategory) {
      category = forcedCategory;
      categoryIndex = categories.indexOf(forcedCategory);
    } else {
      const lastCategoryIndex = parseInt((await getSetting("last_blog_category_index")) || "0");
      categoryIndex = (lastCategoryIndex + 1) % categories.length;
      category = categories[categoryIndex];
    }

    // Generate blog post content
    const generatedPost = await generateBlogPost(category, featuredProducts as any);

    // Generate hero image
    let heroImageUrl: string | null = null;
    try {
      heroImageUrl = await generateHeroImage(generatedPost.heroImagePrompt);
    } catch (imgErr) {
      console.warn("[AutomationEngine] Hero image generation failed, continuing without image");
    }

    // Save to database
    await createBlogPost({
      title: generatedPost.title,
      slug: generatedPost.slug,
      content: generatedPost.content,
      excerpt: generatedPost.excerpt,
      heroImageUrl: heroImageUrl ?? undefined, // null-safe
      heroImagePrompt: generatedPost.heroImagePrompt,
      category: generatedPost.category,
      tags: generatedPost.tags,
      featuredProductIds: generatedPost.featuredProductIds,
      status: "published",
      isAiGenerated: true,
      publishedAt: new Date(),
    });

    await setSetting("last_blog_category_index", String(categoryIndex));

    const duration = Date.now() - startTime;
    const message = `Generated and published blog post: "${generatedPost.title}"`;

    if (logId) {
      await updateAutomationLog(logId, {
        status: "success",
        message,
        postsGenerated: 1,
        duration,
      });
    }

    // Notify owner
    await notifyOwner({
      title: "New Blog Post Published",
      content: `A new AI-generated blog post has been published: "${generatedPost.title}"`,
    }).catch(() => {});

    console.log(`[AutomationEngine] Blog generation complete: "${generatedPost.title}"`);
    await trackContentEvent(); // CounterAPI: content-events (blog post generated)

    // Auto-post to Pinterest
    const db2 = await getDb();
    const savedPosts = db2
      ? await db2.select().from(require("../drizzle/schema").blogPosts).where(eq(require("../drizzle/schema").blogPosts.slug, generatedPost.slug)).limit(1)
      : [];
    const savedPost = (savedPosts as any[])[0];
    if (savedPost) {
      pinBlogPost({
        id: savedPost.id,
        title: savedPost.title,
        excerpt: savedPost.excerpt,
        heroImageUrl: savedPost.heroImageUrl,
        slug: savedPost.slug,
        category: savedPost.category,
      }).catch((err: any) => console.warn("[Pinterest] Blog pin failed:", err.message));
    }

    return { success: true, postsGenerated: 1, message };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const message = `Blog generation failed: ${error.message}`;

    if (logId) {
      await updateAutomationLog(logId, { status: "failed", message, duration });
    }

    await notifyOwner({
      title: "Blog Generation Failed",
      content: `The automated blog post generation encountered an error: ${error.message}`,
    }).catch(() => {});

    throw error;
  }
}

// ─── Performance Scoring Job ──────────────────────────────────────────────────
export async function runPerformanceScoring(): Promise<{ success: boolean; productsScored: number; message: string }> {
  const startTime = Date.now();

  const logResult = await createAutomationLog({
    jobType: "performance_scoring",
    status: "running",
    message: "Starting performance scoring...",
  });
  const logId = (logResult as any)?.insertId;

  try {
    const allProducts = await getProductsForOptimization();
    let scoredCount = 0;

    for (const product of allProducts) {
      const score = calculatePerformanceScore({
        clickCount: product.clickCount,
        conversionCount: product.conversionCount,
        estimatedRevenue: product.estimatedRevenue,
        amazonRating: product.amazonRating,
        reviewCount: product.reviewCount,
        priceDropPercent: product.priceDropPercent,
        createdAt: product.createdAt,
      });

      const ctr = product.clickCount > 0 ? (product.conversionCount / product.clickCount) * 100 : 0;

      await updateProductMetrics(product.id, {
        performanceScore: score,
        ctr: Math.round(ctr * 100) / 100,
      });
      scoredCount++;
    }

    const duration = Date.now() - startTime;
    const message = `Scored ${scoredCount} products in ${duration}ms`;

    if (logId) {
      await updateAutomationLog(logId, { status: "success", message, productsUpdated: scoredCount, duration });
    }

    await setSetting("last_performance_scoring", new Date().toISOString());

    return { success: true, productsScored: scoredCount, message };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (logId) {
      await updateAutomationLog(logId, { status: "failed", message: error.message, duration });
    }
    throw error;
  }
}

// ─── Layout Optimization Job ──────────────────────────────────────────────────
export async function runLayoutOptimization(): Promise<{ success: boolean; message: string; changes: number }> {
  const startTime = Date.now();

  const logResult = await createAutomationLog({
    jobType: "layout_optimization",
    status: "running",
    message: "Starting layout optimization...",
  });
  const logId = (logResult as any)?.insertId;

  try {
    console.log("[AutomationEngine] Starting layout optimization");

    // First, re-score all products
    await runPerformanceScoring();

    // Get all active products with fresh scores
    const allProducts = await getProductsForOptimization();
    if (allProducts.length === 0) {
      const message = "No products to optimize";
      if (logId) await updateAutomationLog(logId, { status: "success", message, duration: Date.now() - startTime });
      return { success: true, message, changes: 0 };
    }

    // Classify products
    const { topPerformers, midPerformers, underPerformers } = classifyProducts(
      allProducts.map((p) => ({ id: p.id, performanceScore: p.performanceScore }))
    );

    let changes = 0;

    // Promote top performers: featured + larger images + better rank
    for (let i = 0; i < topPerformers.length; i++) {
      const id = topPerformers[i];
      const isHero = i < 3; // Top 3 get hero status
      await updateProductDisplay(id, {
        isFeatured: true,
        isHero,
        imageSize: isHero ? "hero" : "large",
        displayRank: i + 1,
        isActive: true,
      });
      changes++;
    }

    // Mid performers: standard display
    for (let i = 0; i < midPerformers.length; i++) {
      const id = midPerformers[i];
      await updateProductDisplay(id, {
        isFeatured: false,
        isHero: false,
        imageSize: "medium",
        displayRank: topPerformers.length + i + 1,
        isActive: true,
      });
      changes++;
    }

    // Underperformers: deactivate and replace
    for (const id of underPerformers) {
      await updateProductDisplay(id, {
        isFeatured: false,
        isHero: false,
        imageSize: "small",
        displayRank: 999,
        isActive: false, // Hide from storefront
      });
      changes++;
    }

    const duration = Date.now() - startTime;
    const message = `Layout optimized: ${topPerformers.length} promoted, ${underPerformers.length} deactivated, ${changes} total changes`;

    if (logId) {
      await updateAutomationLog(logId, {
        status: "success",
        message,
        productsUpdated: changes,
        duration,
        details: { topPerformers: topPerformers.length, underPerformers: underPerformers.length },
      });
    }

    await setSetting("last_layout_optimization", new Date().toISOString());

    // Notify owner of optimization results
    await notifyOwner({
      title: "Layout Optimization Complete",
      content: `Your jewelry store has been optimized. ${topPerformers.length} top-performing products are now featured prominently. ${underPerformers.length} underperforming products have been replaced.`,
    }).catch(() => {});

    // Check for performance threshold alerts
    const topProduct = allProducts[0];
    if (topProduct && topProduct.performanceScore > 80) {
      await notifyOwner({
        title: "High-Performance Product Alert",
        content: `"${topProduct.title}" is your top performer with a score of ${topProduct.performanceScore.toFixed(1)}. Consider featuring it more prominently.`,
      }).catch(() => {});
    }

    console.log(`[AutomationEngine] Layout optimization complete: ${changes} changes`);
    await trackAutomationRun(); // CounterAPI: automation-runs
    return { success: true, message, changes };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (logId) {
      await updateAutomationLog(logId, { status: "failed", message: error.message, duration });
    }

    await notifyOwner({
      title: "Layout Optimization Failed",
      content: `The automated layout optimization encountered an error: ${error.message}`,
    }).catch(() => {});

    throw error;
  }
}

// ─── Scheduler Setup ──────────────────────────────────────────────────────────
let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[AutomationEngine] Starting automation scheduler");

  // Run initial product fetch on startup (after 10 seconds to let DB settle)
  setTimeout(async () => {
    try {
      console.log("[AutomationEngine] Running initial product fetch...");
      await runProductFetch();
      await runPerformanceScoring();
    } catch (err) {
      console.error("[AutomationEngine] Initial product fetch failed:", err);
    }
  }, 10_000);

  // Daily product refresh: every 24 hours
  setInterval(async () => {
    try {
      await runProductFetch();
      await runPerformanceScoring();
    } catch (err) {
      console.error("[AutomationEngine] Daily product fetch failed:", err);
    }
  }, 24 * 60 * 60 * 1000);

  // Daily blog post: every 24 hours (offset by 2 hours from product fetch)
  setTimeout(() => {
    const runBlog = async () => {
      try {
        await runBlogGeneration();
      } catch (err) {
        console.error("[AutomationEngine] Daily blog generation failed:", err);
      }
    };
    runBlog();
    setInterval(runBlog, 24 * 60 * 60 * 1000);
  }, 2 * 60 * 60 * 1000); // Start 2 hours after server start

  // Weekly layout optimization: every 7 days
  setInterval(async () => {
    try {
      await runLayoutOptimization();
    } catch (err) {
      console.error("[AutomationEngine] Weekly layout optimization failed:", err);
    }
  }, 7 * 24 * 60 * 60 * 1000);

  // Performance scoring: every 6 hours
  setInterval(async () => {
    try {
      await runPerformanceScoring();
    } catch (err) {
      console.error("[AutomationEngine] Performance scoring failed:", err);
    }
  }, 6 * 60 * 60 * 1000);

  // Daily link audit: every 24 hours
  setTimeout(() => {
    const runAudit = async () => {
      try {
        console.log("[AutomationEngine] Running daily link audit...");
        await runLinkAudit();
      } catch (err) {
        console.error("[AutomationEngine] Link audit failed:", err);
      }
    };
    runAudit();
    setInterval(runAudit, 24 * 60 * 60 * 1000);
  }, 3 * 60 * 60 * 1000); // Start 3 hours after server start

  // Twice-daily link replacement: every 12 hours
  setTimeout(() => {
    const runReplacement = async () => {
      try {
        console.log("[AutomationEngine] Running link replacement job...");
        const results = await replaceBrokenLinks();
        const replaced = results.filter((r) => r.replaced).length;
        console.log(`[AutomationEngine] Link replacement complete: ${replaced}/${results.length} links replaced`);
      } catch (err) {
        console.error("[AutomationEngine] Link replacement failed:", err);
      }
    };
    runReplacement();
    setInterval(runReplacement, 12 * 60 * 60 * 1000); // Run every 12 hours
  }, 1 * 60 * 60 * 1000); // Start 1 hour after server start

  console.log("[AutomationEngine] Scheduler started successfully");
}
