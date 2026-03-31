/**
 * Shop Database Helpers
 *
 * Database operations for shop blog posts and internal links
 */

import { eq, desc, and, asc, or } from "drizzle-orm";
import { shopBlogPosts, internalLinks, InsertShopBlogPost, InsertInternalLink, ShopBlogPost, InternalLink } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Shop Blog Posts ───────────────────────────────────────────────────────────

/**
 * Insert or update a shop blog post
 */
export async function upsertShopBlogPost(post: InsertShopBlogPost): Promise<ShopBlogPost | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if post exists
  const existing = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.slug, post.slug)).limit(1);

  if (existing.length > 0) {
    // Update existing
    await db.update(shopBlogPosts).set(post).where(eq(shopBlogPosts.slug, post.slug));
    const updated = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.slug, post.slug)).limit(1);
    return updated[0] || null;
  } else {
    // Insert new
    await db.insert(shopBlogPosts).values(post);
    const inserted = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.slug, post.slug)).limit(1);
    return inserted[0] || null;
  }
}

/**
 * Get shop blog posts with pagination
 */
export async function getShopBlogPosts(opts: { limit?: number; offset?: number; status?: string; pillar?: string } = {}) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 20, offset = 0, status = "published", pillar } = opts;

  // Build query with filters
  if (status && pillar) {
    return db
      .select()
      .from(shopBlogPosts)
      .where(and(eq(shopBlogPosts.status, status as any), eq(shopBlogPosts.pillar, pillar)))
      .orderBy(desc(shopBlogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
  } else if (status) {
    return db
      .select()
      .from(shopBlogPosts)
      .where(eq(shopBlogPosts.status, status as any))
      .orderBy(desc(shopBlogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
  } else if (pillar) {
    return db
      .select()
      .from(shopBlogPosts)
      .where(eq(shopBlogPosts.pillar, pillar))
      .orderBy(desc(shopBlogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
  } else {
    return db
      .select()
      .from(shopBlogPosts)
      .orderBy(desc(shopBlogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
  }
}

/**
 * Get a single shop blog post by slug
 */
export async function getShopBlogPostBySlug(slug: string): Promise<ShopBlogPost | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.slug, slug)).limit(1);
  return result[0] || null;
}

/**
 * Get shop blog posts by pillar
 */
export async function getShopBlogPostsByPillar(pillar: string, limit: number = 10): Promise<ShopBlogPost[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(shopBlogPosts)
    .where(and(eq(shopBlogPosts.pillar, pillar), eq(shopBlogPosts.status, "published")))
    .orderBy(desc(shopBlogPosts.publishedAt))
    .limit(limit);
}

/**
 * Get shop blog posts by keyword
 */
export async function getShopBlogPostsByKeyword(keyword: string): Promise<ShopBlogPost[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(shopBlogPosts)
    .where(and(eq(shopBlogPosts.targetKeyword, keyword), eq(shopBlogPosts.status, "published")))
    .limit(1);
}

/**
 * Increment view count for a shop blog post
 */
export async function incrementShopBlogPostViews(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const post = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.id, postId)).limit(1);
  if (post.length > 0) {
    await db.update(shopBlogPosts).set({ viewCount: (post[0].viewCount || 0) + 1 }).where(eq(shopBlogPosts.id, postId));
  }
}

/**
 * Get total count of published shop blog posts
 */
export async function getShopBlogPostCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(shopBlogPosts)
    .where(eq(shopBlogPosts.status, "published"));
  return result.length;
}

// ─── Internal Links ───────────────────────────────────────────────────────────

/**
 * Create internal links for a shop blog post
 */
export async function createInternalLinks(
  shopPostId: number,
  links: Array<{ targetUrl: string; targetType: string; anchorText: string; position: number }>
): Promise<InternalLink[]> {
  const db = await getDb();
  if (!db) return [];

  const insertData: InsertInternalLink[] = links.map((link, index) => ({
    shopPostId,
    targetUrl: link.targetUrl,
    targetType: link.targetType as any,
    anchorText: link.anchorText,
    position: link.position || index + 1,
    clickCount: 0,
  }));

  await db.insert(internalLinks).values(insertData);

  const created = await db.select().from(internalLinks).where(eq(internalLinks.shopPostId, shopPostId));
  return created;
}

/**
 * Get internal links for a shop blog post
 */
export async function getInternalLinksForPost(shopPostId: number): Promise<InternalLink[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(internalLinks).where(eq(internalLinks.shopPostId, shopPostId)).orderBy(asc(internalLinks.position));
}

/**
 * Increment click count for an internal link
 */
export async function incrementInternalLinkClicks(linkId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const link = await db.select().from(internalLinks).where(eq(internalLinks.id, linkId)).limit(1);
  if (link.length > 0) {
    await db.update(internalLinks).set({ clickCount: (link[0].clickCount || 0) + 1 }).where(eq(internalLinks.id, linkId));
  }
}

/**
 * Increment clicks to main domain for a shop blog post
 */
export async function incrementShopBlogPostClicksToMain(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const post = await db.select().from(shopBlogPosts).where(eq(shopBlogPosts.id, postId)).limit(1);
  if (post.length > 0) {
    await db.update(shopBlogPosts).set({ clicksToMain: (post[0].clicksToMain || 0) + 1 }).where(eq(shopBlogPosts.id, postId));
  }
}

/**
 * Get internal links by target type
 */
export async function getInternalLinksByType(targetType: string): Promise<InternalLink[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(internalLinks).where(eq(internalLinks.targetType, targetType as any));
}

/**
 * Get top performing internal links by click count
 */
export async function getTopInternalLinks(limit: number = 10): Promise<InternalLink[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(internalLinks).orderBy(desc(internalLinks.clickCount)).limit(limit);
}

/**
 * Delete internal links for a shop blog post
 */
export async function deleteInternalLinksForPost(shopPostId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(internalLinks).where(eq(internalLinks.shopPostId, shopPostId));
}
