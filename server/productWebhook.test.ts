import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendProductWebhook, sendProductsWebhook } from "./productWebhook";
import type { ProcessedProduct } from "./rainforestAPI";

describe("Product Webhook Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch
    global.fetch = vi.fn();
  });

  describe("sendProductWebhook", () => {
    it("should send product data to Zapier webhook", async () => {
      const mockProduct: ProcessedProduct = {
        asin: "B0BLK7NRLM",
        title: "Gold Necklace",
        brand: "Premium",
        category: "necklaces",
        metalType: "gold",
        price: 299.99,
        originalPrice: 399.99,
        imageUrl: "https://example.com/image.jpg",
        affiliateUrl: "https://amazon.com/dp/B0BLK7NRLM?tag=91791709-20",
        amazonRating: 4.8,
        reviewCount: 100,
        isFeatured: true,
      };

      process.env.ZAPIER_PRODUCT_WEBHOOK = "https://hooks.zapier.com/hooks/catch/test";

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await sendProductWebhook(mockProduct);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://hooks.zapier.com/hooks/catch/test",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      // Check payload
      const callArgs = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.asin).toBe("B0BLK7NRLM");
      expect(payload.title).toBe("Gold Necklace");
      expect(payload.price).toBe(299.99);
    });

    it("should handle missing webhook URL gracefully", async () => {
      delete process.env.ZAPIER_PRODUCT_WEBHOOK;

      const mockProduct: ProcessedProduct = {
        asin: "B0BLK7NRLM",
        title: "Gold Necklace",
        brand: "Premium",
        category: "necklaces",
        metalType: "gold",
        price: 299.99,
        originalPrice: 399.99,
        imageUrl: "https://example.com/image.jpg",
        affiliateUrl: "https://amazon.com/dp/B0BLK7NRLM?tag=91791709-20",
        amazonRating: 4.8,
        reviewCount: 100,
        isFeatured: true,
      };

      const result = await sendProductWebhook(mockProduct);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Webhook URL not configured");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle webhook errors", async () => {
      const mockProduct: ProcessedProduct = {
        asin: "B0BLK7NRLM",
        title: "Gold Necklace",
        brand: "Premium",
        category: "necklaces",
        metalType: "gold",
        price: 299.99,
        originalPrice: 399.99,
        imageUrl: "https://example.com/image.jpg",
        affiliateUrl: "https://amazon.com/dp/B0BLK7NRLM?tag=91791709-20",
        amazonRating: 4.8,
        reviewCount: 100,
        isFeatured: true,
      };

      process.env.ZAPIER_PRODUCT_WEBHOOK = "https://hooks.zapier.com/hooks/catch/test";

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await sendProductWebhook(mockProduct);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Webhook failed");
    });
  });

  describe("sendProductsWebhook", () => {
    it("should send multiple products to webhook", async () => {
      const mockProducts: ProcessedProduct[] = [
        {
          asin: "B0001",
          title: "Gold Necklace",
          brand: "Premium",
          category: "necklaces",
          metalType: "gold",
          price: 299.99,
          originalPrice: 399.99,
          imageUrl: "https://example.com/image1.jpg",
          affiliateUrl: "https://amazon.com/dp/B0001?tag=91791709-20",
          amazonRating: 4.8,
          reviewCount: 100,
          isFeatured: true,
        },
        {
          asin: "B0002",
          title: "Silver Bracelet",
          brand: "Premium",
          category: "bracelets",
          metalType: "silver",
          price: 149.99,
          originalPrice: 199.99,
          imageUrl: "https://example.com/image2.jpg",
          affiliateUrl: "https://amazon.com/dp/B0002?tag=91791709-20",
          amazonRating: 4.5,
          reviewCount: 50,
          isFeatured: false,
        },
      ];

      process.env.ZAPIER_PRODUCT_WEBHOOK = "https://hooks.zapier.com/hooks/catch/test";

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await sendProductsWebhook(mockProducts);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should track failed products", async () => {
      const mockProducts: ProcessedProduct[] = [
        {
          asin: "B0001",
          title: "Gold Necklace",
          brand: "Premium",
          category: "necklaces",
          metalType: "gold",
          price: 299.99,
          originalPrice: 399.99,
          imageUrl: "https://example.com/image1.jpg",
          affiliateUrl: "https://amazon.com/dp/B0001?tag=91791709-20",
          amazonRating: 4.8,
          reviewCount: 100,
          isFeatured: true,
        },
        {
          asin: "B0002",
          title: "Silver Bracelet",
          brand: "Premium",
          category: "bracelets",
          metalType: "silver",
          price: 149.99,
          originalPrice: 199.99,
          imageUrl: "https://example.com/image2.jpg",
          affiliateUrl: "https://amazon.com/dp/B0002?tag=91791709-20",
          amazonRating: 4.5,
          reviewCount: 50,
          isFeatured: false,
        },
      ];

      process.env.ZAPIER_PRODUCT_WEBHOOK = "https://hooks.zapier.com/hooks/catch/test";

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await sendProductsWebhook(mockProducts);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.success).toBe(false);
    });
  });
});
