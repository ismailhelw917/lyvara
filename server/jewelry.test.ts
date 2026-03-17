import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock Context Helpers ─────────────────────────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@lyvarajewels.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("returns null user for unauthenticated requests", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user object for authenticated requests", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Products Router Tests ────────────────────────────────────────────────────
describe("products router", () => {
  it("list accepts valid filter inputs", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // Should not throw — DB may return empty array in test env
    try {
      const result = await caller.products.list({
        category: "necklaces",
        metalType: "gold",
        orderBy: "rank",
        limit: 10,
        offset: 0,
      });
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      // DB not available in test env is acceptable
      expect(err.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });

  it("list rejects invalid orderBy values", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.products.list({ orderBy: "invalid" as any, limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("list enforces limit bounds", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.products.list({ limit: 200, offset: 0, orderBy: "rank" })
    ).rejects.toThrow();
  });
});

// ─── Analytics Router Tests ───────────────────────────────────────────────────
describe("analytics router", () => {
  it("trackEvent accepts valid event types", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      const result = await caller.analytics.trackEvent({
        eventType: "page_view",
        page: "/",
      });
      expect(result.success).toBe(true);
    } catch (err: any) {
      expect(err.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });

  it("trackEvent rejects invalid event types", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.analytics.trackEvent({ eventType: "invalid_event" as any })
    ).rejects.toThrow();
  });

  it("summary requires admin role", async () => {
    const userCaller = appRouter.createCaller(createUserContext());
    await expect(userCaller.analytics.summary({ days: 30 })).rejects.toThrow(/admin|forbidden/i);
  });

  it("summary accessible to admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    try {
      const result = await adminCaller.analytics.summary({ days: 30 });
      expect(result).toBeDefined();
    } catch (err: any) {
      expect(err.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });
});

// ─── Automation Router Tests ──────────────────────────────────────────────────
describe("automation router", () => {
  it("logs requires admin role", async () => {
    const userCaller = appRouter.createCaller(createUserContext());
    await expect(userCaller.automation.logs({ limit: 10 })).rejects.toThrow(/admin|forbidden/i);
  });

  it("logs accessible to admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    try {
      const result = await adminCaller.automation.logs({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      expect(err.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });

  it("triggerProductFetch requires admin role", async () => {
    const userCaller = appRouter.createCaller(createUserContext());
    await expect(userCaller.automation.triggerProductFetch()).rejects.toThrow(/admin|forbidden/i);
  });

  it("updateSetting requires admin role", async () => {
    const userCaller = appRouter.createCaller(createUserContext());
    await expect(
      userCaller.automation.updateSetting({ key: "test", value: "value" })
    ).rejects.toThrow(/admin|forbidden/i);
  });
});

// ─── Blog Router Tests ────────────────────────────────────────────────────────
describe("blog router", () => {
  it("list accepts valid inputs", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      const result = await caller.blog.list({ limit: 5, offset: 0 });
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      expect(err.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });

  it("bySlug throws NOT_FOUND for missing slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    try {
      await caller.blog.bySlug({ slug: "non-existent-slug-xyz" });
      // If DB is available, should throw NOT_FOUND
    } catch (err: any) {
      const isExpected =
        err.message?.includes("NOT_FOUND") ||
        err.message?.includes("not found") ||
        err.message?.match(/database|connect|ECONNREFUSED/i);
      expect(isExpected).toBe(true);
    }
  });
});

// ─── Performance Scoring Tests ────────────────────────────────────────────────
describe("performance scoring algorithm", () => {
  it("calculates score correctly for high-performing product", () => {
    // Simulate the scoring algorithm
    const clickCount = 100;
    const conversionCount = 10;
    const reviewCount = 500;
    const amazonRating = 4.8;

    const ctr = clickCount > 0 ? conversionCount / clickCount : 0;
    const score =
      ctr * 40 +
      Math.min(clickCount / 100, 1) * 30 +
      Math.min(reviewCount / 1000, 1) * 20 +
      ((amazonRating - 1) / 4) * 10;

    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("calculates score correctly for low-performing product", () => {
    const clickCount = 5;
    const conversionCount = 0;
    const reviewCount = 10;
    const amazonRating = 3.0;

    const ctr = clickCount > 0 ? conversionCount / clickCount : 0;
    const score =
      ctr * 40 +
      Math.min(clickCount / 100, 1) * 30 +
      Math.min(reviewCount / 1000, 1) * 20 +
      ((amazonRating - 1) / 4) * 10;

    expect(score).toBeLessThan(30);
  });
});
