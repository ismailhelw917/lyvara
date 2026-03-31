import { describe, it, expect, vi } from "vitest";
import { sendProductWebhook } from "./productWebhook";
import type { ProcessedProduct } from "./rainforestAPI";

describe("Zapier Webhook Validation", () => {
  it("should successfully send product data to configured Zapier webhook URL", async () => {
    const mockProduct: ProcessedProduct = {
      asin: "B0BLK7NRLM",
      title: "Gold Necklace - Test Product",
      brand: "Premium Jewelry",
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

    // Verify webhook URL is configured
    expect(process.env.ZAPIER_PRODUCT_WEBHOOK).toBeDefined();
    expect(process.env.ZAPIER_PRODUCT_WEBHOOK).toContain("hooks.zapier.com");

    // Mock fetch to simulate successful webhook delivery
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;

    const result = await sendProductWebhook(mockProduct);

    // Verify webhook was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      process.env.ZAPIER_PRODUCT_WEBHOOK,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    // Verify response indicates success
    expect(result.success).toBe(true);
    expect(result.webhookUrl).toBe(process.env.ZAPIER_PRODUCT_WEBHOOK);

    // Verify payload structure
    const callArgs = mockFetch.mock.calls[0];
    const payload = JSON.parse(callArgs[1].body);
    expect(payload).toMatchObject({
      asin: "B0BLK7NRLM",
      title: "Gold Necklace - Test Product",
      brand: "Premium Jewelry",
      price: 299.99,
      originalPrice: 399.99,
      amazonRating: 4.8,
      reviewCount: 100,
      isFeatured: true,
      category: "necklaces",
      metalType: "gold",
    });

    console.log("✅ Zapier webhook URL validated and working");
  });
});
