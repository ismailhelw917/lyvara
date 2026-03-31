import { and, asc, desc, eq, gt, gte, inArray, like, lt, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyticsEvents,
  automationLogs,
  blogPosts,
  blogPostsFacebookShares,
  blogPostsInstagramShares,
  InsertAutomationLog,
  InsertBlogPost,
  InsertBlogPostFacebookShare,
  InsertBlogPostInstagramShare,
  InsertProduct,
  InsertReview,
  InsertNewsletterSubscriber,
  newsletterSubscribers,
  products,
  reviews,
  reviewVotes,
  siteSettings,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { buildAffiliateUrl } from "./affiliateUrlBuilder";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function upsertProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) return;
  
  // Ensure affiliate URL has correct tag
  const correctedAffiliateUrl = buildAffiliateUrl(product.asin, product.affiliateUrl);
  
  const updateSet: Record<string, unknown> = {
    title: product.title,
    brand: product.brand,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    additionalImages: product.additionalImages,
    affiliateUrl: correctedAffiliateUrl,
    amazonRating: product.amazonRating,
    reviewCount: product.reviewCount,
    tags: product.tags,
    priceDropPercent: product.priceDropPercent,
    lastFetchedAt: new Date(),
  };
  
  // Ensure product has corrected affiliate URL
  const correctedProduct = { ...product, affiliateUrl: correctedAffiliateUrl };
  await db.insert(products).values(correctedProduct).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getProducts(opts: {
  category?: string;
  metalType?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  active?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "rank" | "price_asc" | "price_desc" | "rating" | "newest" | "performance";
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(products.isActive, opts.active !== false),
    // CRITICAL: Only show products with valid images - no fallbacks allowed
    sql`${products.imageUrl} IS NOT NULL AND ${products.imageUrl} != ''`
  ];
  if (opts.category) conditions.push(eq(products.category, opts.category as any));
  if (opts.metalType) conditions.push(eq(products.metalType, opts.metalType as any));
  if (opts.minPrice) conditions.push(gte(products.price, String(opts.minPrice)));
  if (opts.maxPrice) conditions.push(lte(products.price, String(opts.maxPrice)));
  if (opts.featured !== undefined) conditions.push(eq(products.isFeatured, opts.featured));
  
  const whereClause = and(...conditions);

  let orderClause;
  switch (opts.orderBy) {
    case "price_asc": orderClause = asc(products.price); break;
    case "price_desc": orderClause = desc(products.price); break;
    case "rating": orderClause = desc(products.amazonRating); break;
    case "newest": orderClause = desc(products.createdAt); break;
    case "performance": orderClause = desc(products.performanceScore); break;
    default: orderClause = asc(products.displayRank);
  }

  return db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(opts.limit ?? 24)
    .offset(opts.offset ?? 0);
}

export async function getFeaturedProducts(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.performanceScore))
    .limit(limit);
}

export async function getHeroProducts(limit = 3) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isHero, true)))
    .orderBy(desc(products.performanceScore))
    .limit(limit);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function updateProductMetrics(
  id: number,
  data: { clickCount?: number; conversionCount?: number; estimatedRevenue?: string; performanceScore?: number; ctr?: number }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function updateProductDisplay(
  id: number,
  data: { isFeatured?: boolean; isHero?: boolean; displayRank?: number; imageSize?: any; isActive?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function getProductsForOptimization() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.performanceScore));
}

export async function countProducts(active = true) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(active ? eq(products.isActive, true) : undefined);
  return result[0]?.count ?? 0;
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────
export async function createBlogPost(post: InsertBlogPost) {
  const db = await getDb();
  if (!db) return;
  await db.insert(blogPosts).values(post);
}

export async function getBlogPosts(opts: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.status) conditions.push(eq(blogPosts.status, opts.status as any));
  if (opts.category) conditions.push(eq(blogPosts.category, opts.category as any));
  return db
    .select()
    .from(blogPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(blogPosts.publishedAt))
    .limit(opts.limit ?? 12)
    .offset(opts.offset ?? 0);
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0];
}

export async function incrementBlogViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(blogPosts).set({ viewCount: sql`${blogPosts.viewCount} + 1` }).where(eq(blogPosts.id, id));
}

export async function countBlogPosts(status?: string) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(status ? eq(blogPosts.status, status as any) : undefined);
  return result[0]?.count ?? 0;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function recordAnalyticsEvent(event: {
  productId?: number;
  blogPostId?: number;
  eventType: "product_click" | "affiliate_click" | "page_view" | "blog_view" | "search" | "filter";
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsEvents).values({
    ...event,
    metadata: event.metadata ? event.metadata : undefined,
  });
  // Update product click count if applicable
  if (event.productId && (event.eventType === "product_click" || event.eventType === "affiliate_click")) {
    await db
      .update(products)
      .set({ clickCount: sql`${products.clickCount} + 1` })
      .where(eq(products.id, event.productId));
  }
}

export async function getAnalyticsSummary(days = 30) {
  const db = await getDb();
  if (!db) return { totalClicks: 0, affiliateClicks: 0, pageViews: 0, blogViews: 0 };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventType);

  const summary = { totalClicks: 0, affiliateClicks: 0, pageViews: 0, blogViews: 0 };
  result.forEach((row) => {
    if (row.eventType === "product_click") summary.totalClicks = row.count;
    if (row.eventType === "affiliate_click") summary.affiliateClicks = row.count;
    if (row.eventType === "page_view") summary.pageViews = row.count;
    if (row.eventType === "blog_view") summary.blogViews = row.count;
  });
  return summary;
}

export async function getTopProducts(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.performanceScore))
    .limit(limit);
}

export async function getProductAnalytics(productId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      eventType: analyticsEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.productId, productId), gte(analyticsEvents.createdAt, since)))
    .groupBy(analyticsEvents.eventType);
}

export async function getDailyAnalytics(days = 14) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      date: sql<string>`DATE(${analyticsEvents.createdAt})`,
      eventType: analyticsEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(sql`DATE(${analyticsEvents.createdAt})`, analyticsEvents.eventType)
    .orderBy(sql`DATE(${analyticsEvents.createdAt})`);
}

// ─── Automation Logs ──────────────────────────────────────────────────────────
export async function createAutomationLog(log: InsertAutomationLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(automationLogs).values(log);
  return result;
}

export async function updateAutomationLog(
  id: number,
  data: { status: any; message?: string; details?: any; productsUpdated?: number; postsGenerated?: number; duration?: number }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(automationLogs).set(data).where(eq(automationLogs.id, id));
}

export async function getAutomationLogs(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(automationLogs).orderBy(desc(automationLogs.createdAt)).limit(limit);
}

// ─── Site Settings ────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings);
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function getReviewsByProduct(
  productId: number,
  opts: { sortBy?: "recent" | "helpful" | "highest" | "lowest"; limit?: number; offset?: number } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const { sortBy = "recent", limit = 20, offset = 0 } = opts;

  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .limit(limit)
    .offset(offset);

  // Sort in JS since Drizzle dynamic ordering is verbose
  if (sortBy === "helpful") rows.sort((a, b) => b.helpfulCount - a.helpfulCount);
  else if (sortBy === "highest") rows.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "lowest") rows.sort((a, b) => a.rating - b.rating);
  else rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return rows;
}

export async function getReviewAggregate(productId: number) {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    sum += r.rating;
    total++;
  }
  return {
    averageRating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    totalCount: total,
    distribution,
  };
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(data);
  return result;
}

export async function getExistingVote(reviewId: number, sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(reviewVotes)
    .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.sessionId, sessionId)))
    .limit(1);
  return result[0] ?? null;
}

export async function voteOnReview(reviewId: number, sessionId: string, voteType: "helpful" | "unhelpful") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getExistingVote(reviewId, sessionId);
  if (existing) {
    // Remove the old vote counts
    if (existing.voteType === "helpful") {
      await db.update(reviews).set({ helpfulCount: sql`helpfulCount - 1` }).where(eq(reviews.id, reviewId));
    } else {
      await db.update(reviews).set({ unhelpfulCount: sql`unhelpfulCount - 1` }).where(eq(reviews.id, reviewId));
    }
    if (existing.voteType === voteType) {
      // Toggle off — delete the vote
      await db.delete(reviewVotes).where(eq(reviewVotes.id, existing.id));
      return { action: "removed" };
    }
    // Switch vote type
    await db.update(reviewVotes).set({ voteType }).where(eq(reviewVotes.id, existing.id));
  } else {
    await db.insert(reviewVotes).values({ reviewId, sessionId, voteType });
  }

  // Apply new vote count
  if (voteType === "helpful") {
    await db.update(reviews).set({ helpfulCount: sql`helpfulCount + 1` }).where(eq(reviews.id, reviewId));
  } else {
    await db.update(reviews).set({ unhelpfulCount: sql`unhelpfulCount + 1` }).where(eq(reviews.id, reviewId));
  }
  return { action: existing ? "switched" : "added" };
}

export async function getReviewCountByProduct(productId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));
  return rows.length;
}


// ─── Newsletter Subscribers ───────────────────────────────────────────────────
export async function subscribeToNewsletter(subscriber: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(newsletterSubscribers).values(subscriber).onDuplicateKeyUpdate({
      set: {
        name: subscriber.name,
        status: "subscribed",
        source: subscriber.source,
        preferredCategories: subscriber.preferredCategories,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Newsletter] Failed to subscribe:", error);
    throw error;
  }
}

export async function unsubscribeFromNewsletter(email: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
}

export async function getNewsletterSubscriberCount(status?: string) {
  const db = await getDb();
  if (!db) return 0;
  let query: any = db.select({ id: newsletterSubscribers.id }).from(newsletterSubscribers);
  if (status) {
    query = query.where(eq(newsletterSubscribers.status, status as any));
  }
  const rows = await query;
  return rows.length;
}

export async function getNewsletterSubscribers(opts?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(newsletterSubscribers);
  if (opts?.status) {
    query = query.where(eq(newsletterSubscribers.status, opts.status as any));
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }
  if (opts?.offset) {
    query = query.offset(opts.offset);
  }
  return await query.orderBy(desc(newsletterSubscribers.createdAt));
}

export async function getNewsletterSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ─── Blog Posts Facebook Shares ───────────────────────────────────────────
export async function recordFacebookShare(share: InsertBlogPostFacebookShare): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(blogPostsFacebookShares).values(share);
}

export async function updateFacebookShareStatus(
  id: number,
  status: "pending" | "published" | "scheduled" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updates: any = { status, updatedAt: new Date() };
  if (status === "published") {
    updates.publishedAt = new Date();
  }
  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }
  await db.update(blogPostsFacebookShares).set(updates).where(eq(blogPostsFacebookShares.id, id));
}

export async function getFacebookSharesByBlogPost(blogPostId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(blogPostsFacebookShares)
    .where(eq(blogPostsFacebookShares.blogPostId, blogPostId));
}

export async function getPendingFacebookShares(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(blogPostsFacebookShares)
    .where(eq(blogPostsFacebookShares.status, "pending"));
}

export async function getScheduledFacebookShares(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db
    .select()
    .from(blogPostsFacebookShares)
    .where(
      and(
        eq(blogPostsFacebookShares.status, "scheduled"),
        lte(blogPostsFacebookShares.scheduledFor, now)
      )
    );
}


// ─── Blog Posts Instagram Shares ──────────────────────────────────────────
export async function recordInstagramShare(share: InsertBlogPostInstagramShare): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(blogPostsInstagramShares).values(share);
}

export async function updateInstagramShareStatus(
  id: number,
  status: "pending" | "published" | "scheduled" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updates: any = { status, updatedAt: new Date() };
  if (status === "published") {
    updates.publishedAt = new Date();
  }
  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }
  await db.update(blogPostsInstagramShares).set(updates).where(eq(blogPostsInstagramShares.id, id));
}

export async function getInstagramSharesByBlogPost(blogPostId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(blogPostsInstagramShares)
    .where(eq(blogPostsInstagramShares.blogPostId, blogPostId));
}

export async function getPendingInstagramShares(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(blogPostsInstagramShares)
    .where(eq(blogPostsInstagramShares.status, "pending"));
}

export async function getScheduledInstagramShares(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db
    .select()
    .from(blogPostsInstagramShares)
    .where(
      and(
        eq(blogPostsInstagramShares.status, "scheduled"),
        lte(blogPostsInstagramShares.scheduledFor, now)
      )
    );
}
