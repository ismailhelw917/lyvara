import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

interface PriceDropAlert {
  productId: number;
  productName: string;
  previousPrice: number;
  currentPrice: number;
  discountPercent: number;
  affiliateLink: string;
}

/**
 * Check for price drops and create alerts
 * Looks for products that dropped more than 15% from their last known price
 */
export async function checkPriceDrops(): Promise<PriceDropAlert[]> {
  const db = await getDb();
  const alerts: PriceDropAlert[] = [];

  try {
    if (!db) throw new Error("Database connection failed");
    // Get all active products
    const allProducts = await db.select().from(products).where(eq(products.isActive, true)) as any[];

    for (const product of allProducts) {
      const currentPrice = parseFloat(product.price);
      
      // Check if product has a previous price stored (using metadata or a separate field)
      // For now, we'll use a simple heuristic: if original price exists and is higher
      if (product.originalPrice) {
        const originalPrice = parseFloat(product.originalPrice);
        
        if (originalPrice > currentPrice) {
          const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
          
          // Alert if discount is more than 15%
          if (discountPercent >= 15) {
            alerts.push({
              productId: product.id,
              productName: product.title,
              previousPrice: originalPrice,
              currentPrice,
              discountPercent: Math.round(discountPercent),
              affiliateLink: product.affiliateUrl || "",
            });
          }
        }
      }
    }

    // Send notification if there are significant price drops
    if (alerts.length > 0) {
      const alertSummary = alerts
        .map(
          (a) =>
            `${a.productName}: $${a.previousPrice.toFixed(2)} → $${a.currentPrice.toFixed(2)} (${a.discountPercent}% off)`
        )
        .join("\n");

      await notifyOwner({
        title: `🔥 ${alerts.length} Price Drops Detected!`,
        content: `New price drops found:\n\n${alertSummary}\n\nThese products are great opportunities for affiliate promotion!`,
      });
    }

    return alerts;
  } catch (error) {
    console.error("[Price Drop Alerts] Error checking prices:", error);
    return [];
  }
}

/**
 * Get products with highest discount percentage
 */
export async function getTopDiscountedProducts(limit: number = 10): Promise<PriceDropAlert[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const allProducts = await db.select().from(products).where(eq(products.isActive, true)) as any[];

  const discountedProducts: PriceDropAlert[] = [];

  for (const product of allProducts) {
    if (product.originalPrice) {
      const currentPrice = parseFloat(product.price);
      const originalPrice = parseFloat(product.originalPrice);

      if (originalPrice > currentPrice) {
        const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;

        discountedProducts.push({
          productId: product.id,
          productName: product.title,
          previousPrice: originalPrice,
          currentPrice,
          discountPercent: Math.round(discountPercent),
          affiliateLink: product.affiliateUrl || "",
        });
      }
    }
  }

  // Sort by discount percentage descending
  return discountedProducts.sort((a, b) => b.discountPercent - a.discountPercent).slice(0, limit);
}

/**
 * Schedule price drop checks to run daily
 */
export function initializePriceDropAlerts() {
  const schedule = require("node-cron") as typeof import("node-cron");

  // Run every day at 3 AM
  schedule.schedule("0 3 * * *", async () => {
    console.log("[Price Drop Alerts] Checking for price drops...");
    try {
      await checkPriceDrops();
      console.log("[Price Drop Alerts] Price check completed");
    } catch (error) {
      console.error("[Price Drop Alerts] Error:", error);
    }
  });

  console.log("[Price Drop Alerts] Scheduled for daily checks at 3 AM");
}
