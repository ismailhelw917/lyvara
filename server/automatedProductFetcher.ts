import { searchProducts as fetchRainforestProducts } from "./rainforestAPI";
import { upsertProduct } from "./db";
import { sendProductWebhook } from "./productWebhook";
import type { ProcessedProduct } from "./rainforestAPI";

interface FetchJobResult {
  success: boolean;
  productsAdded: number;
  productsUpdated: number;
  errors: string[];
  duration: number;
}

/**
 * Fetch 25 jewelry products from Rainforest API
 * Runs 3 times daily: 8am, 12pm, 8pm UTC
 */
export async function runAutomatedProductFetch(): Promise<FetchJobResult> {
  const startTime = Date.now();
  const result: FetchJobResult = {
    success: false,
    productsAdded: 0,
    productsUpdated: 0,
    errors: [],
    duration: 0,
  };

  try {
    console.log("[AutomatedProductFetcher] Starting product fetch job...");

    // Fetch 25 jewelry products from Rainforest API
    const products = await fetchRainforestProducts("gold jewelry");

    if (!products || products.length === 0) {
      result.errors.push("No products returned from Rainforest API");
      console.warn("[AutomatedProductFetcher] No products returned from API");
      return result;
    }

    console.log(`[AutomatedProductFetcher] Fetched ${products.length} products`);

    // Process each product
    for (const rainforestProduct of products) {
      try {
        // Product is already processed from API
        const product = rainforestProduct as any as ProcessedProduct;

        // Validate product has required fields
        if (!product.asin || !product.title || !product.imageUrl) {
          result.errors.push(
            `Product missing required fields: ${product.title || "unknown"}`
          );
          continue;
        }

        // Upsert product to database
        await upsertProduct({
          ...product,
          price: String(product.price),
          originalPrice: product.originalPrice ? String(product.originalPrice) : undefined,
        });

        // Send webhook to Zapier
        try {
          await sendProductWebhook({
            ...product,
            price: Number(product.price),
            originalPrice: product.originalPrice ? Number(product.originalPrice) : 0,
          });
        } catch (webhookError) {
          console.warn(
            `[AutomatedProductFetcher] Webhook failed for ${product.asin}:`,
            webhookError
          );
          // Don't fail the entire job if webhook fails - continue processing
        }

        result.productsAdded++;
      } catch (productError) {
        result.errors.push(
          `Failed to process product ${rainforestProduct.asin}: ${String(productError)}`
        );
        console.error(
          `[AutomatedProductFetcher] Error processing product ${rainforestProduct.asin}:`,
          productError
        );
      }
    }

    // Update result based on products added
    if (result.productsAdded === 0 && result.errors.length === 0) {
      result.errors.push("No products were successfully added");
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    // Notify owner of successful fetch
    if (result.productsAdded > 0) {
      const notifyOwner = async (opts: { title: string; content: string }) => {
        console.log(`[Notification] ${opts.title}: ${opts.content}`);
      };
      await notifyOwner({
        title: "✅ Automated Product Fetch Complete",
        content: `Added ${result.productsAdded} new jewelry products from Rainforest API. ${
          result.errors.length > 0 ? `${result.errors.length} errors occurred.` : ""
        }`,
      });
    }

    console.log(
      `[AutomatedProductFetcher] Job completed in ${result.duration}ms: ${result.productsAdded} added, ${result.errors.length} errors`
    );
    return result;
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors.push(`Job failed: ${String(error)}`);

    console.error("[AutomatedProductFetcher] Job failed:", error);

    // Notify owner of failure
    try {
      const notifyOwner = async (opts: { title: string; content: string }) => {
        console.log(`[Notification] ${opts.title}: ${opts.content}`);
      };
      await notifyOwner({
        title: "❌ Automated Product Fetch Failed",
        content: `Error: ${String(error)}`,
      });
    } catch (notifyError) {
      console.error("[AutomatedProductFetcher] Failed to notify owner:", notifyError);
    }

    return result;
  }
}

/**
 * Schedule automated product fetching
 * Runs at 8am, 12pm, 8pm UTC daily
 */
export function scheduleProductFetching() {
  // Import schedule module
  // Use node-schedule if available
  try {
    const schedule = require("node-schedule");

  // 8am UTC
  schedule.scheduleJob("0 8 * * *", async () => {
    console.log("[Scheduler] Running 8am product fetch...");
    await runAutomatedProductFetch();
  });

  // 12pm UTC (noon)
  schedule.scheduleJob("0 12 * * *", async () => {
    console.log("[Scheduler] Running 12pm product fetch...");
    await runAutomatedProductFetch();
  });

  // 8pm UTC
  schedule.scheduleJob("0 20 * * *", async () => {
    console.log("[Scheduler] Running 8pm product fetch...");
    await runAutomatedProductFetch();
  });

    console.log(
      "[Scheduler] Automated product fetching scheduled (8am, 12pm, 8pm UTC)"
    );
  } catch (error) {
    console.warn(
      "[Scheduler] node-schedule not available. Install with: npm install node-schedule"
    );
  }
}
