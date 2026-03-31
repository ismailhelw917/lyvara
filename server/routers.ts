import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  countBlogPosts,
  countProducts,
  createAutomationLog,
  createBlogPost,
  createReview,
  getAnalyticsSummary,
  getAutomationLogs,
  getAllSettings,
  getBlogPostBySlug,
  getBlogPosts,
  getDailyAnalytics,
  getFacebookSharesByBlogPost,
  getInstagramSharesByBlogPost,
  getFeaturedProducts,
  getHeroProducts,
  getNewsletterSubscriberCount,
  getNewsletterSubscribers,
  getProductAnalytics,
  getProducts,
  getReviewAggregate,
  getReviewsByProduct,
  getTopProducts,
  incrementBlogViews,
  recordAnalyticsEvent,
  recordFacebookShare,
  recordInstagramShare,
  setSetting,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  updateAutomationLog,
  updateFacebookShareStatus,
  updateInstagramShareStatus,
  updateProductDisplay,
  updateProductMetrics,
  upsertProduct,
  voteOnReview,
} from "./db";
import { runProductFetch, runBlogGeneration, runLayoutOptimization, runPerformanceScoring } from "./automationEngine";
import { trackPageView, trackProductClick, trackContentEvent, trackReviewEvent, counterGetAll } from "./counterService";
import { postBlogToFacebook, postBlogToInstagram } from "./facebookService";
import { shopRouter } from "./routers/shop";
import { generateBlogHeroImage } from "./blogImageGenerator";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Products Router ──────────────────────────────────────────────────────────
const productsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        metalType: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(24),
        offset: z.number().min(0).default(0),
        orderBy: z.enum(["rank", "price_asc", "price_desc", "rating", "newest", "performance"]).default("rank"),
      })
    )
    .query(async ({ input }) => getProducts(input)),

  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(8) }))
    .query(async ({ input }) => getFeaturedProducts(input.limit)),

  hero: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(6).default(3) }))
    .query(async ({ input }) => getHeroProducts(input.limit)),

  count: publicProcedure.query(() => countProducts()),

  topPerformers: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => getTopProducts(input.limit)),
});

// ─── Blog Router ──────────────────────────────────────────────────────────────
const blogRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(12),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => getBlogPosts({ ...input, status: input.status || "published" })),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await getBlogPostBySlug(input.slug);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found" });
      await incrementBlogViews(post.id);
      await trackContentEvent(); // CounterAPI: content-events (blog read)
      return post;
    }),

  count: publicProcedure.query(() => countBlogPosts("published")),

  shareToFacebook: adminProcedure
    .input(
      z.object({
        blogPostId: z.number(),
        schedule: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const post = await getBlogPostBySlug("");
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found" });

      const siteUrl = process.env.SITE_URL || "https://lyvarajewels.com";

      try {
        const result = await postBlogToFacebook({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || undefined,
          category: post.category || undefined,
          imageUrl: post.heroImageUrl || undefined,
          siteUrl,
          schedule: input.schedule,
        });

        await recordFacebookShare({
          blogPostId: input.blogPostId,
          facebookPostId: result.id,
          status: input.schedule ? "scheduled" : "published",
          scheduledFor: input.schedule ? new Date(Date.now() + 86400000) : undefined,
        });

        return {
          success: true,
          facebookPostId: result.id,
          scheduled: result.scheduled,
        };
      } catch (error: any) {
        const errorMsg = error.message || "Failed to post to Facebook";
        await recordFacebookShare({
          blogPostId: input.blogPostId,
          facebookPostId: "error",
          status: "failed",
          errorMessage: errorMsg,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMsg });
      }
    }),

  getFacebookShares: adminProcedure
    .input(z.object({ blogPostId: z.number() }))
    .query(async ({ input }) => getFacebookSharesByBlogPost(input.blogPostId)),

  shareToInstagram: adminProcedure
    .input(
      z.object({
        blogPostId: z.number(),
        schedule: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const post = await getBlogPostBySlug("");
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found" });

      if (!post.heroImageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Blog post requires a hero image for Instagram" });
      }

      const siteUrl = process.env.SITE_URL || "https://lyvarajewels.com";

      try {
        const result = await postBlogToInstagram({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || undefined,
          category: post.category || undefined,
          imageUrl: post.heroImageUrl,
          siteUrl,
          schedule: input.schedule,
        });

        await recordInstagramShare({
          blogPostId: input.blogPostId,
          instagramMediaId: result.id,
          status: input.schedule ? "scheduled" : "published",
          scheduledFor: input.schedule ? new Date(Date.now() + 86400000) : undefined,
        });

        return {
          success: true,
          instagramMediaId: result.id,
          scheduled: result.scheduled,
        };
      } catch (error: any) {
        const errorMsg = error.message || "Failed to post to Instagram";
        await recordInstagramShare({
          blogPostId: input.blogPostId,
          instagramMediaId: "error",
          status: "failed",
          errorMessage: errorMsg,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMsg });
      }
    }),

  getInstagramShares: adminProcedure
    .input(z.object({ blogPostId: z.number() }))
    .query(async ({ input }) => getInstagramSharesByBlogPost(input.blogPostId)),
});

// ─── Analytics Router ─────────────────────────────────────────────────────────
const analyticsRouter = router({
  trackEvent: publicProcedure
    .input(
      z.object({
        productId: z.number().optional(),
        blogPostId: z.number().optional(),
        eventType: z.enum(["product_click", "affiliate_click", "page_view", "blog_view", "search", "filter"]),
        page: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await recordAnalyticsEvent({
        ...input,
        userAgent: ctx.req.headers["user-agent"] || undefined,
        referrer: ctx.req.headers.referer || undefined,
      });
      // CounterAPI: fire the right counter for each event type
      if (input.eventType === "page_view") await trackPageView();
      else if (input.eventType === "product_click") await trackProductClick();
      else if (input.eventType === "affiliate_click") await trackProductClick();
      else if (input.eventType === "blog_view") await trackContentEvent();
      else if (input.eventType === "search" || input.eventType === "filter") await trackContentEvent();
      return { success: true };
    }),

  summary: adminProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ input }) => getAnalyticsSummary(input.days)),

  daily: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(14) }))
    .query(async ({ input }) => getDailyAnalytics(input.days)),

  topProducts: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => getTopProducts(input.limit)),

  productDetail: adminProcedure
    .input(z.object({ productId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => getProductAnalytics(input.productId, input.days)),
});

// ─── Automation Router ────────────────────────────────────────────────────────
const automationRouter = router({
  logs: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => getAutomationLogs(input.limit)),

  triggerProductFetch: adminProcedure.mutation(async () => {
    try {
      return await runProductFetch();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  triggerBlogGeneration: adminProcedure
    .input(z.object({
      contentType: z.enum(["style_guide", "trend_report", "gift_ideas", "care_tips", "brand_spotlight", "seasonal", "promotional"]).optional(),
    }).optional())
    .mutation(async ({ input }) => {
      try {
        return await runBlogGeneration(input?.contentType);
      } catch (error: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  triggerLayoutOptimization: adminProcedure.mutation(async () => {
    try {
      return await runLayoutOptimization();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  triggerPerformanceScoring: adminProcedure.mutation(async () => {
    try {
      return await runPerformanceScoring();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  triggerRainforestFetch: adminProcedure.mutation(async () => {
    try {
      const { fetchJewelryProducts } = await import("./rainforestAPI");
      const dbModule = await import("./db");
      const { upsertProduct } = dbModule;
      
      console.log("🚀 Starting Rainforest API product fetch...");
      const products = await fetchJewelryProducts(20);
      
      console.log(`✅ Fetched ${products.length} products`);
      
      // Insert each product into database
      for (const product of products) {
        await upsertProduct({
          asin: product.asin,
          title: product.title,
          brand: product.brand,
          category: product.category,
          metalType: product.metalType,
          price: String(product.price),
          originalPrice: String(product.originalPrice),
          imageUrl: product.imageUrl,
          affiliateUrl: product.affiliateUrl,
          amazonRating: product.amazonRating,
          reviewCount: product.reviewCount,
          isFeatured: product.isFeatured,
          isActive: true,
        });
      }
      
      return {
        success: true,
        message: `Successfully fetched and stored ${products.length} real jewelry products from Amazon`,
        productCount: products.length,
      };
    } catch (error: any) {
      console.error("❌ Rainforest fetch error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  checkPriceDrops: adminProcedure.mutation(async () => {
    try {
      const { checkPriceDrops } = await import("./priceDropAlerts");
      const alerts = await checkPriceDrops();
      return { success: true, alerts };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  getTopDiscountedProducts: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const { getTopDiscountedProducts } = await import("./priceDropAlerts");
      return await getTopDiscountedProducts(input.limit);
    }),

  counters: adminProcedure.query(async () => counterGetAll()),

  settings: adminProcedure.query(() => getAllSettings()),

  updateSetting: adminProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ input }) => {
      await setSetting(input.key, input.value);
      return { success: true };
    }),
});

// ─── Newsletter Router ──────────────────────────────────────────────────────────────
const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().max(255).optional(),
        source: z.enum(["homepage", "footer", "popup", "blog", "product_page", "other"]).default("other"),
        preferredCategories: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await subscribeToNewsletter({
        email: input.email,
        name: input.name || null,
        source: input.source,
        preferredCategories: input.preferredCategories || null,
      });
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: "New Newsletter Subscriber",
        content: `New email signup: ${input.email}${input.name ? ` (${input.name})` : ""}`,
      });
      return { success: true, message: "Thank you for subscribing!" };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await unsubscribeFromNewsletter(input.email);
      return { success: true, message: "Successfully unsubscribed from newsletter" };
    }),

  count: adminProcedure
    .input(z.object({ status: z.enum(["subscribed", "unsubscribed", "bounced"]).optional() }))
    .query(async ({ input }) => {
      const total = await getNewsletterSubscriberCount();
      const subscribed = await getNewsletterSubscriberCount("subscribed");
      const unsubscribed = await getNewsletterSubscriberCount("unsubscribed");
      const bounced = await getNewsletterSubscriberCount("bounced");
      return { total, subscribed, unsubscribed, bounced };
    }),

  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["subscribed", "unsubscribed", "bounced"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => getNewsletterSubscribers(input)),
});

// ─── Reviews Router ─────────────────────────────────────────────────────────────────
const reviewsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        sortBy: z.enum(["recent", "helpful", "highest", "lowest"]).optional().default("recent"),
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      return getReviewsByProduct(input.productId, {
        sortBy: input.sortBy,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  aggregate: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return getReviewAggregate(input.productId);
    }),

  create: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        authorName: z.string().min(2).max(100),
        authorEmail: z.string().email().optional(),
        rating: z.number().int().min(1).max(5),
        title: z.string().max(200).optional(),
        body: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      await createReview({
        productId: input.productId,
        authorName: input.authorName,
        authorEmail: input.authorEmail ?? null,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        isVerified: false,
        status: "approved",
      });
      await trackReviewEvent(); // CounterAPI: review-events (new review)
      return { success: true };
    }),

  vote: publicProcedure
    .input(
      z.object({
        reviewId: z.number(),
        sessionId: z.string().min(1).max(128),
        voteType: z.enum(["helpful", "unhelpful"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await voteOnReview(input.reviewId, input.sessionId, input.voteType);
      await trackReviewEvent(); // CounterAPI: review-events (vote)
      return result;
    }),
});

// ─── App Router ──────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: productsRouter,
  blog: blogRouter,
  analytics: analyticsRouter,
  automation: automationRouter,
  reviews: reviewsRouter,
  newsletter: newsletterRouter,
  shop: shopRouter,
});
export type AppRouter = typeof appRouter;