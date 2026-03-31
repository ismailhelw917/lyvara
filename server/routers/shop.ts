/**
 * Shop Router
 *
 * tRPC procedures for managing shop blog posts and internal links
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  upsertShopBlogPost,
  getShopBlogPosts,
  getShopBlogPostBySlug,
  getShopBlogPostsByPillar,
  getShopBlogPostsByKeyword,
  incrementShopBlogPostViews,
  getShopBlogPostCount,
  createInternalLinks,
  getInternalLinksForPost,
  incrementInternalLinkClicks,
  incrementShopBlogPostClicksToMain,
  getTopInternalLinks,
} from "../shopDb";
import { generateShopBlogPost, getTopKeywords, getLowCompetitionKeywords, getKeywordsByPillar } from "../shopContentGenerator";

export const shopRouter = router({
  // ─── Blog Posts ───────────────────────────────────────────────────────────

  /**
   * Get paginated shop blog posts
   */
  listPosts: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        pillar: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const posts = await getShopBlogPosts({
        limit: input.limit,
        offset: input.offset,
        status: "published",
        pillar: input.pillar,
      });

      const total = await getShopBlogPostCount();

      return {
        posts,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get a single shop blog post by slug
   */
  getPostBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const post = await getShopBlogPostBySlug(input.slug);

    if (post) {
      // Increment view count
      await incrementShopBlogPostViews(post.id);

      // Get internal links
      const links = await getInternalLinksForPost(post.id);

      return { post, links };
    }

    return null;
  }),

  /**
   * Get shop blog posts by pillar
   */
  getByPillar: publicProcedure.input(z.object({ pillar: z.string(), limit: z.number().default(10) })).query(async ({ input }) => {
    return getShopBlogPostsByPillar(input.pillar, input.limit);
  }),

  /**
   * Generate and publish a new shop blog post (admin only)
   */
  generatePost: protectedProcedure
    .input(
      z.object({
        keyword: z.string(),
        pillar: z.string(),
        volume: z.number(),
        competition: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can generate posts");
      }

      try {
        // Generate content
        const generated = await generateShopBlogPost(input);

        // Create slug from keyword
        const slug = input.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        // Upsert blog post
        const post = await upsertShopBlogPost({
          title: generated.title,
          slug,
          content: generated.content,
          excerpt: generated.excerpt,
          heroImagePrompt: generated.heroImagePrompt,
          targetKeyword: input.keyword,
          keywordSearchVolume: input.volume,
          keywordCompetition: input.competition,
          pillar: input.pillar,
          status: "published",
          isAiGenerated: true,
          publishedAt: new Date(),
          tags: [input.pillar, input.keyword.toLowerCase()],
        });

        if (!post) {
          throw new Error("Failed to create blog post");
        }

        // Create internal links
        const linksData = generated.internalLinks.map((link, index) => ({
          targetUrl: link.url,
          targetType: link.type,
          anchorText: link.text,
          position: index + 1,
        }));

        await createInternalLinks(post.id, linksData);

        return { success: true, post };
      } catch (error) {
        console.error("Error generating post:", error);
        throw error;
      }
    }),

  /**
   * Publish a draft post
   */
  publishPost: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can publish posts");
    }

    // Note: In a real app, you'd update the post status here
    return { success: true };
  }),

  // ─── Internal Links ───────────────────────────────────────────────────────

  /**
   * Get internal links for a post
   */
  getLinks: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    return getInternalLinksForPost(input.postId);
  }),

  /**
   * Track click on internal link
   */
  trackLinkClick: publicProcedure
    .input(z.object({ linkId: z.number(), postId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementInternalLinkClicks(input.linkId);
      await incrementShopBlogPostClicksToMain(input.postId);
      return { success: true };
    }),

  /**
   * Get top performing internal links
   */
  getTopLinks: publicProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
    return getTopInternalLinks(input.limit);
  }),

  // ─── Keywords & Strategy ──────────────────────────────────────────────────

  /**
   * Get top keywords by search volume
   */
  getTopKeywords: publicProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input }) => {
    return getTopKeywords(input.limit);
  }),

  /**
   * Get low-competition keywords (best for ranking)
   */
  getLowCompetitionKeywords: publicProcedure.query(async () => {
    return getLowCompetitionKeywords();
  }),

  /**
   * Get keywords by pillar
   */
  getKeywordsByPillar: publicProcedure.input(z.object({ pillar: z.string() })).query(async ({ input }) => {
    return getKeywordsByPillar(input.pillar as any);
  }),

  // ─── Analytics ────────────────────────────────────────────────────────────

  /**
   * Get shop analytics summary
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view analytics");
    }

    const totalPosts = await getShopBlogPostCount();
    const topLinks = await getTopInternalLinks(5);

    return {
      totalPosts,
      topLinks,
      generatedAt: new Date(),
    };
  }),
});
