/**
 * Script to fetch and update product images from Amazon
 * Run with: node updateProductImages.mjs
 */

import { fetchAmazonProductImage } from "./amazonImageFetcher.ts";
import { getDb } from "./db.ts";
import { products } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function updateProductImages() {
  console.log("Starting product image update...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    // Get all products
    const allProducts = await db.select().from(products);
    console.log(`Found ${allProducts.length} products to update`);

    let successCount = 0;
    let failCount = 0;

    // Process each product
    for (const product of allProducts) {
      if (!product.asin) {
        console.log(`Skipping product ${product.id} - no ASIN`);
        continue;
      }

      console.log(`Fetching image for ${product.asin} (${product.title})...`);
      
      try {
        const imageUrl = await fetchAmazonProductImage(product.asin);
        
        if (imageUrl) {
          // Update the product with the new image URL
          await db
            .update(products)
            .set({ imageUrl })
            .where(eq(products.id, product.id));
          
          console.log(`✓ Updated ${product.asin}: ${imageUrl}`);
          successCount++;
        } else {
          console.log(`✗ Failed to fetch image for ${product.asin}`);
          failCount++;
        }
      } catch (error) {
        console.error(`Error processing ${product.asin}:`, error);
        failCount++;
      }

      // Add delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\nUpdate complete: ${successCount} succeeded, ${failCount} failed`);
    process.exit(0);
  } catch (error) {
    console.error("Error in updateProductImages:", error);
    process.exit(1);
  }
}

updateProductImages();
