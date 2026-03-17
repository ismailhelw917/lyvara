import { and, asc, desc, eq, gt, gte, inArray, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyticsEvents,
  automationLogs,
  blogPosts,
  InsertAutomationLog,
  InsertBlogPost,
  InsertProduct,
  products,
  siteSettings,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
  const updateSet: Record<string, unknown> = {
    title: product.title,
    brand: product.brand,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    additionalImages: product.additionalImages,
    affiliateUrl: product.affiliateUrl,
    amazonRating: product.amazonRating,
    reviewCount: product.reviewCount,
    tags: product.tags,
    priceDropPercent: product.priceDropPercent,
    lastFetchedAt: new Date(),
  };
  await db.insert(products).values(product).onDuplicateKeyUpdate({ set: updateSet });
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
  const conditions = [];
  if (opts.active !== false) conditions.push(eq(products.isActive, true));
  if (opts.category) conditions.push(eq(products.category, opts.category as any));
  if (opts.metalType) conditions.push(eq(products.metalType, opts.metalType as any));
  if (opts.minPrice) conditions.push(gte(products.price, String(opts.minPrice)));
  if (opts.maxPrice) conditions.push(lte(products.price, String(opts.maxPrice)));
  if (opts.featured !== undefined) conditions.push(eq(products.isFeatured, opts.featured));

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
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
