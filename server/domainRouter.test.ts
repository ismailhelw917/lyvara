/**
 * Domain Router Tests
 * Verify domain detection and routing works correctly
 */

import { describe, it, expect } from "vitest";
import { detectDomain, getBaseUrl, getInternalLink, isShopDomain, isMainDomain } from "./domainRouter";

describe("Domain Router", () => {
  describe("detectDomain", () => {
    it("should detect .shop domain", () => {
      expect(detectDomain("lyvarajewels.shop")).toBe("shop");
      expect(detectDomain("www.lyvarajewels.shop")).toBe("shop");
      expect(detectDomain("lyvarajewels.shop:3000")).toBe("shop");
    });

    it("should detect .com domain", () => {
      expect(detectDomain("lyvarajewels.com")).toBe("main");
      expect(detectDomain("www.lyvarajewels.com")).toBe("main");
      expect(detectDomain("lyvarajewels.com:3000")).toBe("main");
    });

    it("should detect manus.space as main domain", () => {
      expect(detectDomain("luxjewelry-fb7vxnze.manus.space")).toBe("main");
    });

    it("should default to main for unknown domains", () => {
      expect(detectDomain("example.com")).toBe("main");
      expect(detectDomain(undefined)).toBe("main");
      expect(detectDomain("")).toBe("main");
    });

    it("should be case insensitive", () => {
      expect(detectDomain("LYVARAJEWELS.SHOP")).toBe("shop");
      expect(detectDomain("LyvaraJewels.COM")).toBe("main");
    });
  });

  describe("getBaseUrl", () => {
    it("should return .shop base URL for shop domain", () => {
      expect(getBaseUrl("lyvarajewels.shop")).toBe("https://lyvarajewels.shop");
      expect(getBaseUrl("www.lyvarajewels.shop")).toBe("https://lyvarajewels.shop");
    });

    it("should return .com base URL for main domain", () => {
      expect(getBaseUrl("lyvarajewels.com")).toBe("https://lyvarajewels.com");
      expect(getBaseUrl("www.lyvarajewels.com")).toBe("https://lyvarajewels.com");
    });

    it("should handle manus.space domain", () => {
      const result = getBaseUrl("luxjewelry-fb7vxnze.manus.space");
      expect(result).toContain("manus.space");
    });

    it("should default to .com", () => {
      expect(getBaseUrl(undefined)).toBe("https://lyvarajewels.com");
      expect(getBaseUrl("")).toBe("https://lyvarajewels.com");
    });

    it("should support custom protocol", () => {
      expect(getBaseUrl("lyvarajewels.shop", "http")).toBe("http://lyvarajewels.shop");
    });
  });

  describe("getInternalLink", () => {
    it("should generate link to main domain by default", () => {
      expect(getInternalLink("/blog/post-1")).toBe("https://lyvarajewels.com/blog/post-1");
    });

    it("should generate link to shop domain when specified", () => {
      expect(getInternalLink("/blog/post-1", "shop")).toBe("https://lyvarajewels.shop/blog/post-1");
    });

    it("should handle paths with query strings", () => {
      expect(getInternalLink("/products?id=123")).toBe("https://lyvarajewels.com/products?id=123");
    });

    it("should handle root path", () => {
      expect(getInternalLink("/")).toBe("https://lyvarajewels.com/");
    });
  });

  describe("isShopDomain", () => {
    it("should return true for shop domain", () => {
      expect(isShopDomain("lyvarajewels.shop")).toBe(true);
      expect(isShopDomain("www.lyvarajewels.shop")).toBe(true);
    });

    it("should return false for main domain", () => {
      expect(isShopDomain("lyvarajewels.com")).toBe(false);
      expect(isShopDomain("www.lyvarajewels.com")).toBe(false);
      expect(isShopDomain(undefined)).toBe(false);
    });
  });

  describe("isMainDomain", () => {
    it("should return true for main domain", () => {
      expect(isMainDomain("lyvarajewels.com")).toBe(true);
      expect(isMainDomain("www.lyvarajewels.com")).toBe(true);
      expect(isMainDomain(undefined)).toBe(true);
    });

    it("should return false for shop domain", () => {
      expect(isMainDomain("lyvarajewels.shop")).toBe(false);
      expect(isMainDomain("www.lyvarajewels.shop")).toBe(false);
    });
  });
});
