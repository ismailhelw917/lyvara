/**
 * Zapier Integration Router
 * tRPC procedures for handling Zapier webhooks and automation
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  handleBlogPostPublished,
  handlePartnershipOpportunity,
  handleBacklinkFound,
  BlogPostPublishedSchema,
  PartnershipOpportunitySchema,
  BacklinkFoundSchema,
} from "../zapierIntegration";

export const zapierRouter = router({
  /**
   * Webhook: Blog post published
   * Triggers automated backlink generation workflows
   */
  onBlogPostPublished: publicProcedure
    .input(BlogPostPublishedSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await handleBlogPostPublished(input);
        return {
          success: true,
          message: `Blog post published. Triggered ${result.triggeredWorkflows.length} workflows`,
          workflows: result.triggeredWorkflows,
        };
      } catch (error) {
        console.error("Error in onBlogPostPublished:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Webhook: Partnership opportunity found
   * Triggers partnership outreach workflows
   */
  onPartnershipOpportunity: publicProcedure
    .input(PartnershipOpportunitySchema)
    .mutation(async ({ input }) => {
      try {
        const result = await handlePartnershipOpportunity(input);
        return {
          success: true,
          message: `Partnership opportunity processed. Actions: ${result.actions.join(", ")}`,
          actions: result.actions,
        };
      } catch (error) {
        console.error("Error in onPartnershipOpportunity:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Webhook: Backlink found
   * Tracks and monitors backlinks
   */
  onBacklinkFound: publicProcedure
    .input(BacklinkFoundSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await handleBacklinkFound(input);
        return {
          success: true,
          message: "Backlink tracked successfully",
          tracked: result.tracked,
        };
      } catch (error) {
        console.error("Error in onBacklinkFound:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get Zapier webhook URLs for configuration
   * Returns URLs to configure in Zapier dashboard
   */
  getWebhookUrls: protectedProcedure.query(({ ctx }) => {
    // Only allow admin to view webhook URLs
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const baseUrl = process.env.VITE_APP_ID
      ? `https://${process.env.VITE_APP_ID}.manus.space`
      : "http://localhost:3000";

    return {
      blogPostPublished: `${baseUrl}/api/trpc/zapier.onBlogPostPublished`,
      partnershipOpportunity: `${baseUrl}/api/trpc/zapier.onPartnershipOpportunity`,
      backlinkFound: `${baseUrl}/api/trpc/zapier.onBacklinkFound`,
      instructions: {
        step1: "Copy the URLs above",
        step2: "Go to zapier.com and create new Zaps",
        step3: "Use 'Webhooks by Zapier' as trigger",
        step4: "Paste the URLs in the webhook configuration",
        step5: "Test the webhook",
        step6: "Turn on the Zap",
      },
    };
  }),

  /**
   * Test webhook connection
   * Verifies that Zapier can reach the webhook
   */
  testWebhook: publicProcedure
    .input(
      z.object({
        webhookType: z.enum(["blog_post", "partnership", "backlink"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Simulate webhook payload based on type
        let testPayload;

        if (input.webhookType === "blog_post") {
          testPayload = {
            id: "test-123",
            title: "Test Blog Post",
            slug: "test-blog-post",
            url: "https://lyvarajewels.com/blog/test-blog-post",
            excerpt: "This is a test blog post",
            content: "Test content",
            keywords: ["test", "jewelry"],
            category: "test",
            publishedAt: new Date().toISOString(),
            domain: "lyvarajewels.com" as const,
          };
          await handleBlogPostPublished(testPayload);
        } else if (input.webhookType === "partnership") {
          testPayload = {
            partnerName: "Test Partner",
            partnerType: "influencer" as const,
            contactEmail: "test@example.com",
            website: "https://example.com",
            relevanceScore: 85,
            proposedCollaboration: "Test collaboration",
          };
          await handlePartnershipOpportunity(testPayload);
        } else if (input.webhookType === "backlink") {
          testPayload = {
            sourceUrl: "https://example.com/article",
            targetUrl: "https://lyvarajewels.com/blog/test",
            anchorText: "luxury jewelry",
            domain: "example.com",
            domainAuthority: 45,
            foundAt: new Date().toISOString(),
          };
          await handleBacklinkFound(testPayload);
        }

        return {
          success: true,
          message: `Test webhook for ${input.webhookType} processed successfully`,
          testPayload,
        };
      } catch (error) {
        console.error("Error testing webhook:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get Zapier integration status
   * Shows which workflows are active and their performance
   */
  getIntegrationStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return {
      status: "active",
      webhooks: {
        blogPostPublished: {
          enabled: !!process.env.ZAPIER_GUEST_POST_WEBHOOK,
          workflows: [
            "guest_post_outreach",
            "social_syndication",
            "directory_submissions",
            "influencer_outreach",
            "press_release",
          ],
        },
        partnershipOpportunity: {
          enabled: !!process.env.ZAPIER_PARTNERSHIP_OUTREACH_WEBHOOK,
          workflows: ["partnership_email", "crm_update", "owner_notification"],
        },
        backlinkFound: {
          enabled: !!process.env.ZAPIER_BACKLINK_TRACKING_WEBHOOK,
          workflows: ["backlink_tracking", "competitor_analysis"],
        },
      },
      lastUpdated: new Date(),
      documentation: "https://zapier.com/help/",
    };
  }),
});
