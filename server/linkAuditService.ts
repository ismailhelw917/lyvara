/**
 * Link Audit Service
 * 
 * Automatically crawls and validates all product affiliate links.
 * Removes products with broken links to keep catalog clean.
 */

import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface LinkAuditResult {
  success: boolean;
  checkedCount: number;
  brokenCount: number;
  removedCount: number;
  errors: string[];
  duration: number;
}

/**
 * Check if a URL is accessible (returns 200-399 status)
 */
async function checkLink(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Accept 2xx and 3xx status codes
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    // Timeout, network error, or other issues = broken link
    return false;
  }
}

/**
 * Audit all product affiliate links and remove products with broken links
 */
export async function runLinkAudit(): Promise<LinkAuditResult> {
  const startTime = Date.now();
  const result: LinkAuditResult = {
    success: false,
    checkedCount: 0,
    brokenCount: 0,
    removedCount: 0,
    errors: [],
    duration: 0,
  };

  try {
    const db = await getDb();
    if (!db) {
      result.errors.push("Database connection failed");
      return result;
    }

    console.log("[LinkAudit] Starting link audit...");

    // Get all active products
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));

    if (!allProducts || allProducts.length === 0) {
      console.log("[LinkAudit] No active products to audit");
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[LinkAudit] Auditing ${allProducts.length} products...`);

    // Check each product's affiliate URL
    for (const product of allProducts) {
      result.checkedCount++;

      if (!product.affiliateUrl) {
        result.errors.push(`Product ${product.asin} has no affiliate URL`);
        continue;
      }

      try {
        const isValid = await checkLink(product.affiliateUrl);

        if (!isValid) {
          result.brokenCount++;
          console.warn(
            `[LinkAudit] Broken link detected for ${product.asin}: ${product.affiliateUrl}`
          );

          // Remove product with broken link
          await db.update(products).set({ isActive: false }).where(eq(products.id, product.id));

          result.removedCount++;
          console.log(`[LinkAudit] Removed product ${product.asin} due to broken link`);
        }
      } catch (linkError) {
        result.errors.push(
          `Failed to check link for ${product.asin}: ${String(linkError)}`
        );
        console.error(`[LinkAudit] Error checking link for ${product.asin}:`, linkError);
      }
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(
      `[LinkAudit] Audit complete: ${result.checkedCount} checked, ${result.brokenCount} broken, ${result.removedCount} removed in ${result.duration}ms`
    );

    return result;
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors.push(`Audit failed: ${String(error)}`);

    console.error("[LinkAudit] Audit failed:", error);
    return result;
  }
}

/**
 * Schedule link audit to run daily at 3 AM UTC
 */
export function scheduleLinkAudit() {
  try {
    const schedule = require("node-schedule");

    // 3 AM UTC daily
    schedule.scheduleJob("0 3 * * *", async () => {
      console.log("[Scheduler] Running daily link audit...");
      await runLinkAudit();
    });

    console.log("[Scheduler] Link audit scheduled (3 AM UTC daily)");
  } catch (error) {
    console.warn(
      "[Scheduler] node-schedule not available for link audit. Install with: npm install node-schedule"
    );
  }
}
