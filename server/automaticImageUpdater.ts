import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { fetchAmazonProductImages, generateFallbackImageUrl } from "./amazonImageScraper";
import { storagePut } from "./storage";

interface ImageUpdateResult {
  productId: number;
  asin: string;
  title: string;
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

/**
 * Fetch and store product image for a single product
 */
export async function updateProductImage(
  productId: number,
  asin: string,
  title: string,
  category: string,
  metalType: string
): Promise<ImageUpdateResult> {
  try {
    console.log(`[ImageUpdater] Fetching image for ${asin}: ${title}`);

    // Fetch images from Amazon
    const imageData = await fetchAmazonProductImages(asin);

    if (!imageData.mainImage) {
      // Use fallback image
      const fallbackUrl = generateFallbackImageUrl(category, metalType);
      console.log(`[ImageUpdater] No image found for ${asin}, using fallback`);

      // Update database
      const db = await getDb();
      if (db) {
        await db
          .update(products)
          .set({ imageUrl: fallbackUrl })
          .where(eq(products.id, productId));
      }

      return {
        productId,
        asin,
        title,
        imageUrl: fallbackUrl,
        success: true,
      };
    }

    // Upload image to S3
    console.log(`[ImageUpdater] Uploading image to S3 for ${asin}`);
    const imageBuffer = await fetchImageBuffer(imageData.mainImage);

    if (!imageBuffer) {
      throw new Error("Failed to download image from Amazon");
    }

    // Upload to S3 with unique key
    const fileKey = `products/${asin}/${Date.now()}-main-image.jpg`;
    const { url: s3Url } = await storagePut(fileKey, imageBuffer, "image/jpeg");

    console.log(`[ImageUpdater] Image uploaded to S3: ${s3Url}`);

    // Update database with S3 URL
    const db = await getDb();
    if (db) {
      await db
        .update(products)
        .set({
          imageUrl: s3Url,
          additionalImages: imageData.additionalImages,
        })
        .where(eq(products.id, productId));
    }

    return {
      productId,
      asin,
      title,
      imageUrl: s3Url,
      success: true,
    };
  } catch (error) {
    console.error(`[ImageUpdater] Error updating image for ${asin}:`, error);

    // Use fallback on error
    try {
      const fallbackUrl = generateFallbackImageUrl(category, metalType);
      const db = await getDb();
      if (db) {
        await db
          .update(products)
          .set({ imageUrl: fallbackUrl })
          .where(eq(products.id, productId));
      }

      return {
        productId,
        asin,
        title,
        imageUrl: fallbackUrl,
        success: false,
        error: String(error),
      };
    } catch (fallbackError) {
      return {
        productId,
        asin,
        title,
        imageUrl: null,
        success: false,
        error: `Failed to update and fallback: ${String(error)}`,
      };
    }
  }
}

/**
 * Download image buffer from URL
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[ImageUpdater] Failed to fetch image buffer:`, error);
    return null;
  }
}

/**
 * Update images for all products
 */
export async function updateAllProductImages(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: ImageUpdateResult[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log("[ImageUpdater] Starting batch image update for all products...");
  const startTime = Date.now();

  // Fetch all active products
  const allProducts = await db.select().from(products);

  const results: ImageUpdateResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process products with concurrency limit
  const concurrency = 2;
  for (let i = 0; i < allProducts.length; i += concurrency) {
    const batch = allProducts.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map((product: any) =>
        updateProductImage(
          product.id,
          product.asin,
          product.title,
          product.category,
          product.metalType
        )
      )
    );

    results.push(...batchResults);
    successful += batchResults.filter((r) => r.success).length;
    failed += batchResults.filter((r) => !r.success).length;

    // Rate limiting
    if (i + concurrency < allProducts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `[ImageUpdater] Batch update complete: ${successful}/${allProducts.length} successful in ${duration}ms`
  );

  return {
    total: allProducts.length,
    successful,
    failed,
    results,
  };
}

/**
 * Update images for products that are missing or have broken images
 */
export async function updateMissingProductImages(): Promise<{
  updated: number;
  skipped: number;
  results: ImageUpdateResult[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log("[ImageUpdater] Updating products with missing/broken images...");

  // Find products with missing or placeholder images
  const allProds = await db.select().from(products);
  const productsToUpdate = allProds.filter(
    (p: any) =>
      !p.imageUrl ||
      (typeof p.imageUrl === "string" &&
        (p.imageUrl.includes("unsplash.com") ||
          p.imageUrl.includes("placeholder") ||
          p.imageUrl.includes("fallback")))
  );

  console.log(`[ImageUpdater] Found ${productsToUpdate.length} products to update`);

  const results: ImageUpdateResult[] = [];

  for (const product of productsToUpdate) {
    const result = await updateProductImage(
      product.id,
      product.asin,
      product.title,
      product.category,
      product.metalType
    );
    results.push(result);

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const successful = results.filter((r) => r.success).length;

  return {
    updated: successful,
    skipped: productsToUpdate.length - successful,
    results,
  };
}
