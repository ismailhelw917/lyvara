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
  jobType: mysqlEnum("jobType", ["product_fetch", "blog_generation", "layout_optimization", "performance_scoring", "hero_image_generation", "cleanup", "verification"]).notNull(),
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

// ─── Product Reviews ──────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }),
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 500 }),
  body: text("body").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  unhelpfulCount: int("unhelpfulCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("approved").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Review Votes ─────────────────────────────────────────────────────────────
export const reviewVotes = mysqlTable("review_votes", {
  id: int("id").autoincrement().primaryKey(),
  reviewId: int("reviewId").notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  voteType: mysqlEnum("voteType", ["helpful", "unhelpful"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewVote = typeof reviewVotes.$inferSelect;
export type InsertReviewVote = typeof reviewVotes.$inferInsert;

// ─── Newsletter Subscribers ───────────────────────────────────────────────────
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["subscribed", "unsubscribed", "bounced"]).default("subscribed").notNull(),
  source: mysqlEnum("source", ["homepage", "footer", "popup", "blog", "product_page", "other"]).default("other"),
  preferredCategories: json("preferredCategories").$type<string[]>(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ─── Blog Posts Facebook Shares ───────────────────────────────────────────
export const blogPostsFacebookShares = mysqlTable("blog_posts_facebook_shares", {
  id: int("id").autoincrement().primaryKey(),
  blogPostId: int("blogPostId").notNull(),
  facebookPostId: varchar("facebookPostId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "published", "scheduled", "failed"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPostFacebookShare = typeof blogPostsFacebookShares.$inferSelect;
export type InsertBlogPostFacebookShare = typeof blogPostsFacebookShares.$inferInsert;

// ─── Blog Posts Instagram Shares ──────────────────────────────────────────
export const blogPostsInstagramShares = mysqlTable("blog_posts_instagram_shares", {
  id: int("id").autoincrement().primaryKey(),
  blogPostId: int("blogPostId").notNull(),
  instagramMediaId: varchar("instagramMediaId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "published", "scheduled", "failed"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPostInstagramShare = typeof blogPostsInstagramShares.$inferSelect;
export type InsertBlogPostInstagramShare = typeof blogPostsInstagramShares.$inferInsert;

// ─── Shop Blog Posts (SEO Satellite Content) ──────────────────────────────────
export const shopBlogPosts = mysqlTable("shop_blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  heroImageUrl: text("heroImageUrl"),
  heroImagePrompt: text("heroImagePrompt"),
  // SEO targeting
  targetKeyword: varchar("targetKeyword", { length: 255 }).notNull(),
  keywordSearchVolume: int("keywordSearchVolume"),
  keywordCompetition: varchar("keywordCompetition", { length: 20 }), // low, medium, high
  pillar: varchar("pillar", { length: 100 }).notNull(), // buyer_guides, gift_guides, care_tips, trends, education, problem_solution
  tags: json("tags").$type<string[]>(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  isAiGenerated: boolean("isAiGenerated").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  clicksToMain: int("clicksToMain").default(0).notNull(), // clicks to main domain
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopBlogPost = typeof shopBlogPosts.$inferSelect;
export type InsertShopBlogPost = typeof shopBlogPosts.$inferInsert;

// ─── Internal Links (Shop to Main Domain) ─────────────────────────────────────
export const internalLinks = mysqlTable("internal_links", {
  id: int("id").autoincrement().primaryKey(),
  shopPostId: int("shopPostId").notNull(),
  targetUrl: text("targetUrl").notNull(), // URL on main domain
  targetType: mysqlEnum("targetType", ["product", "category", "blog_post", "home"]).notNull(),
  anchorText: varchar("anchorText", { length: 255 }).notNull(),
  position: int("position"), // position in content (1st, 2nd, 3rd link)
  clickCount: int("clickCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InternalLink = typeof internalLinks.$inferSelect;
export type InsertInternalLink = typeof internalLinks.$inferInsert;
