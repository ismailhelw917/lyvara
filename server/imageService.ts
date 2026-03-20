/**
 * Image Service
 *
 * Fetches and manages product images from Amazon and other sources.
 * Stores images in S3 and updates the database with image URLs.
 */

import { storagePut, storageGet } from "./storage";
import { upsertProduct, getProducts } from "./db";

interface AmazonProductImage {
  asin: string;
  imageUrl: string;
  additionalImages?: string[];
}

/**
 * Fetch product images from Amazon using Keepa API or direct Amazon URLs
 * For now, we'll use a curated set of high-quality jewelry images
 */
const AMAZON_PRODUCT_IMAGES: Record<string, AmazonProductImage> = {
  B0BLK7NRLM: {
    asin: "B0BLK7NRLM",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    ],
  },
  B098KWTXDJ: {
    asin: "B098KWTXDJ",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
  B07W97WCGW: {
    asin: "B07W97WCGW",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
  B01M0VLHQI: {
    asin: "B01M0VLHQI",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=90",
    ],
  },
  B0033518FK: {
    asin: "B0033518FK",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=90",
    ],
  },
  B0C8JQMZ7X: {
    asin: "B0C8JQMZ7X",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
  B0D4LXQZ9K: {
    asin: "B0D4LXQZ9K",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
  B0CXYZ123A: {
    asin: "B0CXYZ123A",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
  B0CXYZ123B: {
    asin: "B0CXYZ123B",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90",
    additionalImages: [
      "https://images.unsplash.com/photo-1515562141207-6811bcb33efb?w=800&q=90",
    ],
  },
};

/**
 * Fetch and cache images for all products
 * This runs as part of the daily automation job
 */
export async function fetchAndCacheProductImages(): Promise<{
  success: boolean;
  imagesUpdated: number;
  message: string;
}> {
  const startTime = Date.now();

  try {
    console.log("[ImageService] Starting image fetch and cache job");

    let imagesUpdated = 0;

    // Get all products
    const allProducts = await getProducts({});

    for (const product of allProducts) {
      try {
        const imageData = AMAZON_PRODUCT_IMAGES[product.asin];

        if (!imageData) {
          console.warn(`[ImageService] No image data found for ASIN ${product.asin}`);
          continue;
        }

        // Fetch the image from URL
        const imageResponse = await fetch(imageData.imageUrl);
        if (!imageResponse.ok) {
          console.warn(`[ImageService] Failed to fetch image for ${product.asin}: ${imageResponse.statusText}`);
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

        // Upload to S3
        const s3Key = `products/${product.asin}/main-image.jpg`;
        const { url: imageUrl } = await storagePut(s3Key, Buffer.from(imageBuffer), mimeType);

        // Update database with S3 URL
        await upsertProduct({
          ...product,
          imageUrl,
        });

        imagesUpdated++;
        console.log(`[ImageService] ✓ Updated image for ${product.asin}`);
      } catch (err) {
        console.warn(`[ImageService] Failed to process image for ${product.asin}:`, err);
      }
    }

    const duration = Date.now() - startTime;
    const message = `Successfully updated ${imagesUpdated} product images in ${duration}ms`;

    console.log(`[ImageService] ${message}`);

    return {
      success: true,
      imagesUpdated,
      message,
    };
  } catch (err) {
    console.error("[ImageService] Image fetch job failed:", err);
    return {
      success: false,
      imagesUpdated: 0,
      message: `Image fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Get cached image URL for a product
 */
export async function getProductImageUrl(asin: string): Promise<string | null> {
  try {
    const s3Key = `products/${asin}/main-image.jpg`;
    const result = await storageGet(s3Key);
    return result?.url || null;
  } catch (err) {
    console.warn(`[ImageService] Failed to get cached image for ${asin}:`, err);
    return null;
  }
}
