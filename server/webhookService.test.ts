import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendBlogWebhook,
  isValidWebhookUrl,
  extractExcerpt,
  BlogWebhookPayloadSchema,
} from "./webhookService";

describe("Webhook Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isValidWebhookUrl", () => {
    it("should validate HTTPS URLs", () => {
      expect(isValidWebhookUrl("https://hooks.zapier.com/hooks/catch/123/456")).toBe(true);
    });

    it("should validate HTTP URLs", () => {
      expect(isValidWebhookUrl("http://example.com/webhook")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidWebhookUrl("not-a-url")).toBe(false);
      expect(isValidWebhookUrl("")).toBe(false);
      expect(isValidWebhookUrl("ftp://example.com")).toBe(false);
    });
  });

  describe("extractExcerpt", () => {
    it("should extract excerpt from HTML content", () => {
      const html = "<p>This is a <strong>test</strong> excerpt.</p>";
      const result = extractExcerpt(html, 100);
      expect(result).toContain("This is a test excerpt");
    });

    it("should truncate long content", () => {
      const long = "a".repeat(200);
      const result = extractExcerpt(long, 100);
      expect(result.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(result.endsWith("...")).toBe(true);
    });

    it("should not add ellipsis for short content", () => {
      const short = "Short text";
      const result = extractExcerpt(short, 100);
      expect(result).toBe("Short text");
      expect(result).not.toContain("...");
    });

    it("should remove HTML tags", () => {
      const html = "<h1>Title</h1><p>Content</p>";
      const result = extractExcerpt(html, 100);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });
  });

  describe("BlogWebhookPayloadSchema", () => {
    it("should validate correct payload", () => {
      const payload = {
        id: "123",
        title: "Test Blog Post",
        slug: "test-blog-post",
        content: "Content here",
        excerpt: "Short excerpt",
        imageUrl: "https://example.com/image.jpg",
        category: "style_guide",
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
      };

      expect(() => BlogWebhookPayloadSchema.parse(payload)).not.toThrow();
    });

    it("should reject payload with missing required fields", () => {
      const payload = {
        id: "123",
        title: "Test Blog Post",
        // Missing slug, content, excerpt, category, publishedAt, url
      };

      expect(() => BlogWebhookPayloadSchema.parse(payload)).toThrow();
    });

    it("should allow optional imageUrl", () => {
      const payload = {
        id: "123",
        title: "Test Blog Post",
        slug: "test-blog-post",
        content: "Content here",
        excerpt: "Short excerpt",
        category: "style_guide",
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
        // imageUrl is optional
      };

      expect(() => BlogWebhookPayloadSchema.parse(payload)).not.toThrow();
    });
  });

  describe("sendBlogWebhook", () => {
    it("should send webhook successfully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      const payload = {
        id: "123",
        title: "Test Post",
        slug: "test-post",
        content: "Content",
        excerpt: "Excerpt",
        category: "style_guide" as const,
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
      };

      const result = await sendBlogWebhook(payload, "https://hooks.zapier.com/test");

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("https://hooks.zapier.com/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Test Post"),
      });
    });

    it("should handle webhook URL not configured", async () => {
      const payload = {
        id: "123",
        title: "Test Post",
        slug: "test-post",
        content: "Content",
        excerpt: "Excerpt",
        category: "style_guide" as const,
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
      };

      const result = await sendBlogWebhook(payload, "");

      expect(result.success).toBe(false);
      expect(result.error).toContain("No webhook URL");
    });

    it("should handle fetch errors", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const payload = {
        id: "123",
        title: "Test Post",
        slug: "test-post",
        content: "Content",
        excerpt: "Excerpt",
        category: "style_guide" as const,
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
      };

      const result = await sendBlogWebhook(payload, "https://hooks.zapier.com/test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should handle HTTP error responses", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad request"),
      });
      global.fetch = mockFetch;

      const payload = {
        id: "123",
        title: "Test Post",
        slug: "test-post",
        content: "Content",
        excerpt: "Excerpt",
        category: "style_guide" as const,
        publishedAt: 1234567890,
        url: "https://example.com/blog/test",
      };

      const result = await sendBlogWebhook(payload, "https://hooks.zapier.com/test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("400");
    });
  });
});
