import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { fetchRealAmazonImage } from "./workingImageFetcher";
import { eq } from "drizzle-orm";

/**
 * Update product images with real Amazon images
 * Fetches images for products with missing or placeholder images
 */
export async function updateProductImagesWithAmazon(): Promise<{
  updated: number;
  failed: number;
  skipped: number;
}> {
  const db = await getDb();
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  try {
    if (!db) {
      console.error("[SimpleImageUpdater] Database connection failed");
      return { updated, failed, skipped };
    }
    
    // Get all products
    const allProducts = await db.select().from(products);
    console.log(`[SimpleImageUpdater] Processing ${allProducts.length} products`);

    for (const product of allProducts) {
      try {
        // Check if image needs updating
        if (
          !product.imageUrl ||
          product.imageUrl.includes("unsplash") ||
          product.imageUrl.includes("placeholder") ||
          product.imageUrl.includes("fallback")
        ) {
          console.log(`[SimpleImageUpdater] Fetching image for ${product.asin}...`);
          
          const imageUrl = await fetchRealAmazonImage(product.asin);
          
          if (imageUrl && db) {
            // Update database
            await db
              .update(products)
              .set({ imageUrl })
              .where(eq(products.id, product.id));
            
            console.log(`[SimpleImageUpdater] Updated ${product.asin} with image: ${imageUrl}`);
            updated++;
          } else {
            console.warn(`[SimpleImageUpdater] Failed to fetch image for ${product.asin}`);
            failed++;
          }
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`[SimpleImageUpdater] Error processing ${product.asin}:`, err);
        failed++;
      }
    }

    console.log(
      `[SimpleImageUpdater] Complete: ${updated} updated, ${failed} failed, ${skipped} skipped`
    );
    return { updated, failed, skipped };
  } catch (error) {
    console.error("[SimpleImageUpdater] Fatal error:", error);
    return { updated, failed, skipped };
  }
}
