/**
 * Zapier Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  handleBlogPostPublished,
  handlePartnershipOpportunity,
  handleBacklinkFound,
  generateBlogPostWebhookPayload,
  generatePartnershipOpportunityPayload,
} from "./zapierIntegration";

describe("Zapier Integration", () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
  });

  describe("Blog Post Published Handler", () => {
    it("should trigger guest post outreach workflow", async () => {
      process.env.ZAPIER_GUEST_POST_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        id: "post-123",
        title: "Gold Jewelry Care Guide",
        slug: "gold-jewelry-care-guide",
        url: "https://lyvarajewels.com/blog/gold-jewelry-care-guide",
        excerpt: "Learn how to care for gold jewelry",
        content: "Full content...",
        keywords: ["gold jewelry", "care"],
        category: "care_tips",
        publishedAt: new Date().toISOString(),
        domain: "lyvarajewels.com" as const,
      };

      const result = await handleBlogPostPublished(payload);

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain("guest_post_outreach");
    });

    it("should trigger social syndication workflow", async () => {
      process.env.ZAPIER_SOCIAL_SYNDICATION_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        id: "post-123",
        title: "Gold Jewelry Trends 2024",
        slug: "gold-jewelry-trends-2024",
        url: "https://lyvarajewels.com/blog/gold-jewelry-trends-2024",
        excerpt: "Latest trends in gold jewelry",
        content: "Full content...",
        keywords: ["trends", "jewelry"],
        category: "trend_report",
        heroImageUrl: "https://example.com/image.jpg",
        publishedAt: new Date().toISOString(),
        domain: "lyvarajewels.com" as const,
      };

      const result = await handleBlogPostPublished(payload);

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain("social_syndication");
    });

    it("should trigger influencer outreach for styling posts", async () => {
      process.env.ZAPIER_INFLUENCER_OUTREACH_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        id: "post-123",
        title: "Jewelry Styling Tips",
        slug: "jewelry-styling-tips",
        url: "https://lyvarajewels.com/blog/jewelry-styling-tips",
        excerpt: "Learn styling tips",
        content: "Full content...",
        keywords: ["styling", "tips"],
        category: "style_guide",
        publishedAt: new Date().toISOString(),
        domain: "lyvarajewels.com" as const,
      };

      const result = await handleBlogPostPublished(payload);

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain("influencer_outreach");
    });

    it("should trigger press release for major content", async () => {
      process.env.ZAPIER_PRESS_RELEASE_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        id: "post-123",
        title: "Comprehensive Gold Jewelry Investment Guide",
        slug: "gold-jewelry-investment-guide",
        url: "https://lyvarajewels.com/blog/gold-jewelry-investment-guide",
        excerpt: "Complete investment guide",
        content: "Full content...",
        keywords: ["investment", "gold", "jewelry", "value", "returns", "portfolio"],
        category: "trend_report",
        publishedAt: new Date().toISOString(),
        domain: "lyvarajewels.com" as const,
      };

      const result = await handleBlogPostPublished(payload);

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain("press_release");
    });
  });

  describe("Partnership Opportunity Handler", () => {
    it("should send partnership outreach email", async () => {
      process.env.ZAPIER_PARTNERSHIP_OUTREACH_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        partnerName: "Fashion Influencer Sarah",
        partnerType: "influencer" as const,
        contactEmail: "sarah@example.com",
        website: "https://sarahjewelry.com",
        socialHandle: "@sarahjewelry",
        followers: 50000,
        relevanceScore: 85,
        proposedCollaboration: "Feature our jewelry guide",
        estimatedValue: 5000,
      };

      const result = await handlePartnershipOpportunity(payload);

      expect(result.success).toBe(true);
      expect(result.actions).toContain("partnership_email_sent");
    });

    it("should update CRM with partnership", async () => {
      process.env.ZAPIER_CRM_UPDATE_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        partnerName: "Jewelry Brand XYZ",
        partnerType: "brand" as const,
        contactEmail: "contact@jewelrybrand.com",
        relevanceScore: 75,
        proposedCollaboration: "Affiliate partnership",
        estimatedValue: 10000,
      };

      const result = await handlePartnershipOpportunity(payload);

      expect(result.success).toBe(true);
      expect(result.actions).toContain("crm_updated");
    });

    it("should notify owner for high-relevance partners", async () => {
      process.env.ZAPIER_OWNER_NOTIFICATION_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        partnerName: "Major Fashion Magazine",
        partnerType: "blog" as const,
        contactEmail: "editor@fashionmag.com",
        website: "https://fashionmagazine.com",
        relevanceScore: 95,
        proposedCollaboration: "Feature article",
        estimatedValue: 50000,
      };

      const result = await handlePartnershipOpportunity(payload);

      expect(result.success).toBe(true);
      expect(result.actions).toContain("owner_notified");
    });
  });

  describe("Backlink Found Handler", () => {
    it("should track backlink", async () => {
      process.env.ZAPIER_BACKLINK_TRACKING_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        sourceUrl: "https://fashionblog.com/article",
        targetUrl: "https://lyvarajewels.com/blog/gold-jewelry-trends",
        anchorText: "luxury gold jewelry",
        domain: "fashionblog.com",
        domainAuthority: 52,
        referralTraffic: 150,
        foundAt: new Date().toISOString(),
      };

      const result = await handleBacklinkFound(payload);

      expect(result.success).toBe(true);
      expect(result.tracked).toBe(true);
    });

    it("should handle backlinks from high-authority domains", async () => {
      process.env.ZAPIER_BACKLINK_TRACKING_WEBHOOK = "https://hooks.zapier.com/test";

      const payload = {
        sourceUrl: "https://vogue.com/article",
        targetUrl: "https://lyvarajewels.com/blog/jewelry-trends",
        anchorText: "jewelry trends",
        domain: "vogue.com",
        domainAuthority: 92,
        referralTraffic: 5000,
        foundAt: new Date().toISOString(),
      };

      const result = await handleBacklinkFound(payload);

      expect(result.success).toBe(true);
      expect(result.tracked).toBe(true);
    });
  });

  describe("Payload Generators", () => {
    it("should generate blog post webhook payload", () => {
      const post = {
        id: "post-123",
        title: "Test Post",
        slug: "test-post",
        url: "https://lyvarajewels.com/blog/test-post",
        excerpt: "Test excerpt",
        content: "Test content",
        keywords: ["test"],
        category: "test",
        publishedAt: new Date("2026-03-31"),
        domain: "lyvarajewels.com" as const,
      };

      const payload = generateBlogPostWebhookPayload(post);

      expect(payload.id).toBe("post-123");
      expect(payload.title).toBe("Test Post");
      expect(payload.domain).toBe("lyvarajewels.com");
      expect(payload.publishedAt).toContain("2026-03-31");
    });

    it("should generate partnership opportunity payload", () => {
      const partner = {
        name: "Test Partner",
        type: "influencer" as const,
        email: "test@example.com",
        website: "https://example.com",
        followers: 10000,
        relevanceScore: 80,
        proposedCollaboration: "Test collaboration",
        estimatedValue: 5000,
      };

      const payload = generatePartnershipOpportunityPayload(partner);

      expect(payload.partnerName).toBe("Test Partner");
      expect(payload.partnerType).toBe("influencer");
      expect(payload.relevanceScore).toBe(80);
    });
  });

  describe("Error Handling", () => {
    it("should handle webhook errors gracefully", async () => {
      process.env.ZAPIER_GUEST_POST_WEBHOOK = "https://invalid.url";
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const payload = {
        id: "post-123",
        title: "Test Post",
        slug: "test-post",
        url: "https://lyvarajewels.com/blog/test-post",
        excerpt: "Test",
        content: "Test",
        keywords: ["test"],
        category: "test",
        publishedAt: new Date().toISOString(),
        domain: "lyvarajewels.com" as const,
      };

      try {
        await handleBlogPostPublished(payload);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
