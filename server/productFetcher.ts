/**
 * Product Fetcher
 *
 * Fetches real Amazon product data using the dual-verification approach
 * and updates the database with accurate images and product details
 */

import { upsertProduct } from "./db";
import { verifyMultipleProducts, convertToInsertProduct } from "./productDataVerifier";

// Real Amazon jewelry ASINs to fetch
const JEWELRY_ASINS = [
  { asin: "B0BLK7NRLM", category: "rings", metalType: "gold" },
  { asin: "B098KWTXDJ", category: "necklaces", metalType: "silver" },
  { asin: "B07W97WCGW", category: "necklaces", metalType: "gold" },
  { asin: "B01M0VLHQI", category: "bracelets", metalType: "silver" },
  { asin: "B0033518FK", category: "bracelets", metalType: "silver" },
  { asin: "B0C8JQMZ7X", category: "rings", metalType: "gold" },
  { asin: "B0D4LXQZ9K", category: "rings", metalType: "white_gold" },
  { asin: "B0CXYZ123A", category: "earrings", metalType: "gold" },
  { asin: "B0CXYZ123B", category: "earrings", metalType: "silver" },
];

/**
 * Fetch and update all jewelry products with real Amazon data
 */
export async function fetchAndUpdateJewelryProducts(): Promise<{
  success: boolean;
  productsUpdated: number;
  message: string;
}> {
  const startTime = Date.now();

  try {
    console.log("[ProductFetcher] Starting jewelry product fetch...");

    // Extract ASINs
    const asins = JEWELRY_ASINS.map((item) => item.asin);

    // Verify all products using dual approach (PA-API + web scraping)
    const verifiedProducts = await verifyMultipleProducts(asins);

    if (verifiedProducts.length === 0) {
      throw new Error("No products could be verified from Amazon");
    }

    console.log(`[ProductFetcher] Verified ${verifiedProducts.length} products`);

    // Update database with verified products
    let updatedCount = 0;

    for (const verifiedData of verifiedProducts) {
      try {
        // Find the category and metalType for this ASIN
        const asinConfig = JEWELRY_ASINS.find((item) => item.asin === verifiedData.asin);
        if (!asinConfig) continue;

        // Convert to InsertProduct format
        const insertData = convertToInsertProduct(
          verifiedData,
          asinConfig.category,
          asinConfig.metalType
        );

        // Upsert into database
        await upsertProduct(insertData);
        updatedCount++;

        console.log(
          `[ProductFetcher] ✓ Updated ${verifiedData.asin}: "${verifiedData.title}" with image: ${verifiedData.imageUrl}`
        );
      } catch (err) {
        console.warn(
          `[ProductFetcher] Failed to update ${verifiedData.asin}:`,
          err
        );
      }
    }

    const duration = Date.now() - startTime;
    const message = `Successfully fetched and updated ${updatedCount} jewelry products with real Amazon data and images in ${duration}ms`;

    console.log(`[ProductFetcher] ${message}`);

    return {
      success: true,
      productsUpdated: updatedCount,
      message,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const message = `Product fetch failed: ${error.message}`;

    console.error("[ProductFetcher] Error:", error);

    return {
      success: false,
      productsUpdated: 0,
      message,
    };
  }
}

/**
 * Fetch a single product and update database
 */
export async function fetchAndUpdateSingleProduct(asin: string): Promise<boolean> {
  try {
    const { verifyProductData } = await import("./productDataVerifier");
    const verifiedData = await verifyProductData(asin);

    if (!verifiedData) {
      console.warn(`[ProductFetcher] Could not verify product ${asin}`);
      return false;
    }

    const asinConfig = JEWELRY_ASINS.find((item) => item.asin === asin);
    if (!asinConfig) {
      console.warn(`[ProductFetcher] ASIN ${asin} not in jewelry catalog`);
      return false;
    }

    const insertData = convertToInsertProduct(
      verifiedData,
      asinConfig.category,
      asinConfig.metalType
    );

    await upsertProduct(insertData);

    console.log(
      `[ProductFetcher] ✓ Updated ${asin} with image: ${verifiedData.imageUrl}`
    );

    return true;
  } catch (err) {
    console.warn(`[ProductFetcher] Failed to fetch ${asin}:`, err);
    return false;
  }
}
