/**
 * CounterAPI Service — server-side helper for tracking all data-gathering events.
 * Uses the counterapi v2 SDK with workspace "lyvara-jewels".
 *
 * Counter naming strategy (5 public counters on free plan):
 *   1. page-views        — all page view events (home, shop, blog, product detail)
 *   2. product-clicks    — product card clicks + affiliate link clicks
 *   3. content-events    — blog reads, blog posts generated, search/filter usage
 *   4. automation-runs   — product fetches, optimization runs, scoring runs
 *   5. review-events     — review submissions, helpful/unhelpful votes
 *
 * All counters use .up() to increment. Values are read via .get() or .stats().
 * Errors are swallowed silently so a CounterAPI outage never breaks the app.
 */

import { Counter } from "counterapi";

const WORKSPACE = "lyvara-jewels";

let _client: Counter | null = null;

function getClient(): Counter {
  if (!_client) {
    _client = new Counter({
      workspace: WORKSPACE,
      timeout: 5000,
    });
  }
  return _client;
}

/**
 * Increment a named counter. Silently ignores errors.
 */
export async function counterHit(counterName: CounterName): Promise<void> {
  try {
    await getClient().up(counterName);
  } catch (err) {
    // Never let CounterAPI errors propagate to the caller
    console.warn(`[CounterAPI] Failed to increment "${counterName}":`, err);
  }
}

/**
 * Get the current value of a named counter.
 * Returns 0 on error.
 */
export async function counterGet(counterName: CounterName): Promise<number> {
  try {
    const result = await getClient().get(counterName);
    return result.value ?? 0;
  } catch (err) {
    console.warn(`[CounterAPI] Failed to get "${counterName}":`, err);
    return 0;
  }
}

/**
 * Get current values for all 5 counters in one call.
 * Returns a map of counter name → current value.
 */
export async function counterGetAll(): Promise<Record<CounterName, number>> {
  const names: CounterName[] = [
    "page-views",
    "product-clicks",
    "content-events",
    "automation-runs",
    "review-events",
  ];

  const results = await Promise.allSettled(names.map((n) => counterGet(n)));

  return names.reduce(
    (acc, name, i) => {
      const r = results[i];
      acc[name] = r.status === "fulfilled" ? r.value : 0;
      return acc;
    },
    {} as Record<CounterName, number>
  );
}

/**
 * Get detailed stats for a counter (today, this week, hourly breakdown).
 * Returns null on error.
 */
export async function counterStats(counterName: CounterName) {
  try {
    const result = await getClient().stats(counterName) as unknown as { data?: unknown };
    return result.data ?? null;
  } catch (err) {
    console.warn(`[CounterAPI] Failed to get stats for "${counterName}":`, err);
    return null;
  }
}

// ─── Counter name type for type safety ───────────────────────────────────────

export type CounterName =
  | "page-views"       // home, shop, blog list, product detail page views
  | "product-clicks"   // product card clicks + affiliate link clicks
  | "content-events"   // blog reads, blog posts generated, search/filter usage
  | "automation-runs"  // product fetches, optimization runs, scoring runs
  | "review-events";   // review submissions + helpful/unhelpful votes

// ─── Semantic helpers (map events to the correct counter) ────────────────────

/** Track a page view (home, shop, blog, product detail) */
export const trackPageView = () => counterHit("page-views");

/** Track a product card click or affiliate link click */
export const trackProductClick = () => counterHit("product-clicks");

/** Track a blog read, blog post generated, or search/filter event */
export const trackContentEvent = () => counterHit("content-events");

/** Track an automation job run (product fetch, optimization, scoring) */
export const trackAutomationRun = () => counterHit("automation-runs");

/** Track a review submission or helpful/unhelpful vote */
export const trackReviewEvent = () => counterHit("review-events");
