import {
  bigint,
  boolean,
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  asin: varchar("asin", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  brand: varchar("brand", { length: 255 }),
  description: text("description"),
  category: mysqlEnum("category", ["necklaces", "bracelets", "rings", "earrings", "pendants", "sets", "other"]).notNull().default("other"),
  metalType: mysqlEnum("metalType", ["gold", "silver", "rose_gold", "white_gold", "platinum", "mixed"]).notNull().default("gold"),
  price: decimal("price", { precision: 10, scale: 2 }),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  imageUrl: text("imageUrl"),
  additionalImages: json("additionalImages").$type<string[]>(),
  affiliateUrl: text("affiliateUrl").notNull(),
  amazonRating: float("amazonRating"),
  reviewCount: int("reviewCount").default(0),
  // Performance metrics
  clickCount: int("clickCount").default(0).notNull(),
  conversionCount: int("conversionCount").default(0).notNull(),
  estimatedRevenue: decimal("estimatedRevenue", { precision: 10, scale: 2 }).default("0"),
  performanceScore: float("performanceScore").default(0).notNull(),
  ctr: float("ctr").default(0).notNull(), // click-through rate
  // Display settings (auto-managed by optimization engine)
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isHero: boolean("isHero").default(false).notNull(),
  displayRank: int("displayRank").default(100).notNull(),
  imageSize: mysqlEnum("imageSize", ["small", "medium", "large", "hero"]).default("medium").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Metadata
  tags: json("tags").$type<string[]>(),
  priceDropPercent: float("priceDropPercent").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastFetchedAt: timestamp("lastFetchedAt").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Blog Posts ───────────────────────────────────────────────────────────────
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  heroImageUrl: text("heroImageUrl"),
  heroImagePrompt: text("heroImagePrompt"),
  category: mysqlEnum("category", ["style_guide", "trend_report", "gift_ideas", "care_tips", "brand_spotlight", "seasonal", "promotional"]).default("style_guide"),
  tags: json("tags").$type<string[]>(),
  featuredProductIds: json("featuredProductIds").$type<number[]>(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  isAiGenerated: boolean("isAiGenerated").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Analytics Events ─────────────────────────────────────────────────────────
export const analyticsEvents = mysqlTable("analytics_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  productId: int("productId"),
  blogPostId: int("blogPostId"),
  eventType: mysqlEnum("eventType", ["product_click", "affiliate_click", "page_view", "blog_view", "search", "filter"]).notNull(),
  sessionId: varchar("sessionId", { length: 128 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  page: varchar("page", { length: 500 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// ─── Automation Logs ──────────────────────────────────────────────────────────
export const automationLogs = mysqlTable("automation_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobType: mysqlEnum("jobType", ["product_fetch", "blog_generation", "layout_optimization", "performance_scoring", "hero_image_generation", "cleanup"]).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed", "partial"]).notNull(),
  message: text("message"),
  details: json("details"),
  productsUpdated: int("productsUpdated").default(0),
  postsGenerated: int("postsGenerated").default(0),
  duration: int("duration"), // milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

// ─── Site Settings ────────────────────────────────────────────────────────────
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
