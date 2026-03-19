import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@lyvara.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Reviews Router Tests ─────────────────────────────────────────────────────
describe("reviews router", () => {
  it("reviews.list accepts valid input and returns an array", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    // productId 999 won't exist but should return empty array, not throw
    const result = await caller.reviews.list({ productId: 999, sortBy: "recent", limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("reviews.list respects sortBy options", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    for (const sortBy of ["recent", "helpful", "highest", "lowest"] as const) {
      const result = await caller.reviews.list({ productId: 999, sortBy, limit: 5, offset: 0 });
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("reviews.aggregate returns correct shape for non-existent product", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.reviews.aggregate({ productId: 999 });
    expect(result).toHaveProperty("averageRating");
    expect(result).toHaveProperty("totalCount");
    expect(result).toHaveProperty("distribution");
    expect(result.totalCount).toBe(0);
    expect(result.averageRating).toBe(0);
  });

  it("reviews.aggregate distribution has keys 1-5", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.reviews.aggregate({ productId: 999 });
    expect(result.distribution).toHaveProperty("1");
    expect(result.distribution).toHaveProperty("2");
    expect(result.distribution).toHaveProperty("3");
    expect(result.distribution).toHaveProperty("4");
    expect(result.distribution).toHaveProperty("5");
  });

  it("reviews.create validates minimum body length", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.reviews.create({
        productId: 1,
        authorName: "Test",
        rating: 5,
        body: "short", // less than 10 chars
      })
    ).rejects.toThrow();
  });

  it("reviews.create validates rating range 1-5", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.reviews.create({
        productId: 1,
        authorName: "Test",
        rating: 6, // invalid
        body: "This is a valid body that is long enough.",
      })
    ).rejects.toThrow();

    await expect(
      caller.reviews.create({
        productId: 1,
        authorName: "Test",
        rating: 0, // invalid
        body: "This is a valid body that is long enough.",
      })
    ).rejects.toThrow();
  });

  it("reviews.create validates authorName minimum length", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.reviews.create({
        productId: 1,
        authorName: "A", // less than 2 chars
        rating: 5,
        body: "This is a valid body that is long enough.",
      })
    ).rejects.toThrow();
  });

  it("reviews.vote validates voteType enum", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.reviews.vote({
        reviewId: 1,
        sessionId: "test-session-123",
        voteType: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("reviews.vote requires non-empty sessionId", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.reviews.vote({
        reviewId: 1,
        sessionId: "", // empty
        voteType: "helpful",
      })
    ).rejects.toThrow();
  });
});
