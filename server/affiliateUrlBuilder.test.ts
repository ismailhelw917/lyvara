import { describe, it, expect } from "vitest";
import {
  buildAffiliateUrl,
  hasCorrectAffiliateTag,
  extractAsinFromUrl,
  getCorrectAffiliateTag,
  fixAffiliateUrlsBatch,
} from "./affiliateUrlBuilder";

describe("Affiliate URL Builder", () => {
  const CORRECT_TAG = "91791709-20";

  describe("buildAffiliateUrl", () => {
    it("should build a new affiliate URL from ASIN", () => {
      const url = buildAffiliateUrl("B0BLK7NRLM");
      expect(url).toBe(`https://www.amazon.com/dp/B0BLK7NRLM?tag=${CORRECT_TAG}`);
    });

    it("should replace incorrect tag with correct tag", () => {
      const incorrectUrl = "https://www.amazon.com/dp/B0BLK7NRLM?tag=lyvarajewels-20";
      const url = buildAffiliateUrl("B0BLK7NRLM", incorrectUrl);
      expect(url).toContain(`tag=${CORRECT_TAG}`);
      expect(url).not.toContain("lyvarajewels-20");
    });

    it("should fix URL with existing query parameters", () => {
      const urlWithParams = "https://www.amazon.com/dp/B0BLK7NRLM?ref=xyz&tag=wrong-tag";
      const url = buildAffiliateUrl("B0BLK7NRLM", urlWithParams);
      expect(url).toContain(`tag=${CORRECT_TAG}`);
      expect(url).toContain("ref=xyz");
      expect(url).not.toContain("wrong-tag");
    });

    it("should handle URL without existing tag", () => {
      const urlWithoutTag = "https://www.amazon.com/dp/B0BLK7NRLM?ref=xyz";
      const url = buildAffiliateUrl("B0BLK7NRLM", urlWithoutTag);
      expect(url).toContain(`tag=${CORRECT_TAG}`);
      expect(url).toContain("ref=xyz");
    });

    it("should throw error if ASIN is missing", () => {
      expect(() => buildAffiliateUrl("")).toThrow("ASIN is required");
    });

    it("should handle malformed URLs gracefully", () => {
      const url = buildAffiliateUrl("B0BLK7NRLM", "not-a-valid-url");
      expect(url).toBe(`https://www.amazon.com/dp/B0BLK7NRLM?tag=${CORRECT_TAG}`);
    });

    it("should preserve ASIN in URL", () => {
      const asin = "B08BRAC001";
      const url = buildAffiliateUrl(asin);
      expect(url).toContain(asin);
    });
  });

  describe("hasCorrectAffiliateTag", () => {
    it("should return true for URL with correct tag", () => {
      const url = `https://www.amazon.com/dp/B0BLK7NRLM?tag=${CORRECT_TAG}`;
      expect(hasCorrectAffiliateTag(url)).toBe(true);
    });

    it("should return false for URL with incorrect tag", () => {
      const url = "https://www.amazon.com/dp/B0BLK7NRLM?tag=lyvarajewels-20";
      expect(hasCorrectAffiliateTag(url)).toBe(false);
    });

    it("should return false for URL without tag", () => {
      const url = "https://www.amazon.com/dp/B0BLK7NRLM";
      expect(hasCorrectAffiliateTag(url)).toBe(false);
    });

    it("should return false for malformed URL", () => {
      expect(hasCorrectAffiliateTag("not-a-url")).toBe(false);
    });

    it("should handle URL with multiple query parameters", () => {
      const url = `https://www.amazon.com/dp/B0BLK7NRLM?ref=xyz&tag=${CORRECT_TAG}&other=value`;
      expect(hasCorrectAffiliateTag(url)).toBe(true);
    });
  });

  describe("extractAsinFromUrl", () => {
    it("should extract ASIN from standard Amazon URL", () => {
      const url = "https://www.amazon.com/dp/B0BLK7NRLM";
      const asin = extractAsinFromUrl(url);
      expect(asin).toBe("B0BLK7NRLM");
    });

    it("should extract ASIN from URL with query parameters", () => {
      const url = "https://www.amazon.com/dp/B08BRAC001?tag=91791709-20&ref=xyz";
      const asin = extractAsinFromUrl(url);
      expect(asin).toBe("B08BRAC001");
    });

    it("should return null for URL without ASIN", () => {
      const url = "https://www.amazon.com/";
      const asin = extractAsinFromUrl(url);
      expect(asin).toBeNull();
    });

    it("should return null for malformed URL", () => {
      const asin = extractAsinFromUrl("not-a-url");
      expect(asin).toBeNull();
    });

    it("should extract ASIN with various formats", () => {
      const asins = ["B0BLK7NRLM", "B08BRAC001", "B0CXYZ123A"];
      asins.forEach((asin) => {
        const url = `https://www.amazon.com/dp/${asin}`;
        expect(extractAsinFromUrl(url)).toBe(asin);
      });
    });
  });

  describe("getCorrectAffiliateTag", () => {
    it("should return the correct affiliate tag", () => {
      const tag = getCorrectAffiliateTag();
      expect(tag).toBe(CORRECT_TAG);
    });

    it("should always return the same tag", () => {
      const tag1 = getCorrectAffiliateTag();
      const tag2 = getCorrectAffiliateTag();
      expect(tag1).toBe(tag2);
    });
  });

  describe("fixAffiliateUrlsBatch", () => {
    it("should fix multiple URLs in batch", () => {
      const urls = [
        "https://www.amazon.com/dp/B0BLK7NRLM?tag=lyvarajewels-20",
        "https://www.amazon.com/dp/B08BRAC001?tag=wrong-tag",
        "https://www.amazon.com/dp/B08RING001",
      ];
      const fixed = fixAffiliateUrlsBatch(urls);
      expect(fixed).toHaveLength(3);
      fixed.forEach((url) => {
        expect(hasCorrectAffiliateTag(url)).toBe(true);
      });
    });

    it("should preserve valid URLs", () => {
      const validUrl = `https://www.amazon.com/dp/B0BLK7NRLM?tag=${CORRECT_TAG}`;
      const fixed = fixAffiliateUrlsBatch([validUrl]);
      expect(fixed[0]).toContain(CORRECT_TAG);
    });

    it("should handle empty array", () => {
      const fixed = fixAffiliateUrlsBatch([]);
      expect(fixed).toEqual([]);
    });

    it("should handle URLs with multiple parameters", () => {
      const urls = [
        "https://www.amazon.com/dp/B0BLK7NRLM?ref=xyz&tag=old-tag&other=value",
        "https://www.amazon.com/dp/B08BRAC001?tag=wrong&ref=abc",
      ];
      const fixed = fixAffiliateUrlsBatch(urls);
      fixed.forEach((url) => {
        expect(hasCorrectAffiliateTag(url)).toBe(true);
        // Verify other parameters are preserved
        if (url.includes("B0BLK7NRLM")) {
          expect(url).toContain("ref=xyz");
          expect(url).toContain("other=value");
        }
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete workflow: build -> validate -> extract", () => {
      const asin = "B0BLK7NRLM";
      const url = buildAffiliateUrl(asin);
      expect(hasCorrectAffiliateTag(url)).toBe(true);
      expect(extractAsinFromUrl(url)).toBe(asin);
    });

    it("should fix and validate corrupted URL", () => {
      const corruptedUrl = "https://www.amazon.com/dp/B08BRAC001?tag=lyvarajewels-20&ref=old";
      const asin = extractAsinFromUrl(corruptedUrl);
      expect(asin).toBe("B08BRAC001");
      const fixed = buildAffiliateUrl(asin, corruptedUrl);
      expect(hasCorrectAffiliateTag(fixed)).toBe(true);
    });

    it("should ensure all product links have correct tag", () => {
      const productAsins = ["B0BLK7NRLM", "B08BRAC001", "B08RING001", "B08EARR001"];
      const urls = productAsins.map((asin) => buildAffiliateUrl(asin));
      urls.forEach((url) => {
        expect(hasCorrectAffiliateTag(url)).toBe(true);
      });
    });
  });
});
