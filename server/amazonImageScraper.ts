import axios from "axios";
import * as cheerio from "cheerio";

interface AmazonProductImages {
  asin: string;
  mainImage?: string;
  additionalImages: string[];
  error?: string;
}

/**
 * Fetch product images from Amazon using ASIN
 * Returns main image and additional images
 */
export async function fetchAmazonProductImages(
  asin: string
): Promise<AmazonProductImages> {
  try {
    if (!asin || asin.length !== 10) {
      return {
        asin,
        additionalImages: [],
        error: "Invalid ASIN format",
      };
    }

    const url = `https://www.amazon.com/dp/${asin}`;

    // Fetch the product page
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const images: string[] = [];

    // Method 1: Extract from initial-atf-images-load-scripts
    try {
      const scripts = $("script").toArray();
      for (const script of scripts) {
        const content = $(script).html();
        if (
          content &&
          content.includes("landingImage") &&
          content.includes("imageUrl")
        ) {
          // Look for image URLs in the script
          const imageMatches = content.match(
            /"imageUrl":"([^"]+)"/g
          );
          if (imageMatches) {
            for (const match of imageMatches) {
              const url = match.replace(/"imageUrl":"/, "").replace(/"$/, "");
              if (url && url.includes("images-amazon.com")) {
                images.push(url);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[ImageScraper] Script parsing failed for ${asin}`);
    }

    // Method 2: Extract from img tags
    try {
      $("img[data-a-dynamic-image]").each((_: number, elem: any) => {
        const dataAttr = $(elem).attr("data-a-dynamic-image");
        if (dataAttr) {
          try {
            const imageData = JSON.parse(dataAttr);
            const urls = Object.keys(imageData);
            urls.forEach((url: string) => {
              if (url && url.includes("images-amazon.com")) {
                images.push(url);
              }
            });
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });
    } catch (e) {
      console.warn(`[ImageScraper] Image tag parsing failed for ${asin}`);
    }

    // Method 3: Extract from picture sources
    try {
      $("picture source[srcset]").each((_: number, elem: any) => {
        const srcset = $(elem).attr("srcset");
        if (srcset && srcset.includes("images-amazon.com")) {
          const urls = srcset.split(",").map((s: string) => s.trim().split(" ")[0]);
          urls.forEach((url: string) => {
            if (url && url.includes("images-amazon.com")) {
              images.push(url);
            }
          });
        }
      });
    } catch (e) {
      console.warn(`[ImageScraper] Picture source parsing failed for ${asin}`);
    }

    // Deduplicate and clean URLs
    const uniqueImages = Array.from(new Set(images))
      .map((url) => {
        // Normalize Amazon image URLs to use high-quality versions
        return url.replace(/_[A-Z]{2}_[A-Z]{2}_\.jpg/, "._SL1500_.jpg");
      })
      .filter((url) => url && url.length > 0);

    if (uniqueImages.length === 0) {
      return {
        asin,
        additionalImages: [],
        error: "No images found on product page",
      };
    }

    return {
      asin,
      mainImage: uniqueImages[0],
      additionalImages: uniqueImages.slice(1),
    };
  } catch (error) {
    console.error(`[ImageScraper] Error fetching images for ${asin}:`, error);
    return {
      asin,
      additionalImages: [],
      error: `Failed to fetch images: ${String(error)}`,
    };
  }
}

/**
 * Fetch images for multiple products in parallel
 */
export async function fetchMultipleProductImages(
  asins: string[],
  concurrency: number = 2
): Promise<AmazonProductImages[]> {
  const results: AmazonProductImages[] = [];
  const queue = [...asins];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(
      batch.map((asin) => fetchAmazonProductImages(asin))
    );
    results.push(...batchResults);

    // Rate limiting to avoid Amazon blocking
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Generate a fallback image URL for products without images
 */
export function generateFallbackImageUrl(
  category: string,
  metalType: string
): string {
  // Use Unsplash images as fallback
  const fallbacks: Record<string, string> = {
    "necklaces-gold":
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
    "necklaces-silver":
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop",
    "bracelets-gold":
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop",
    "bracelets-silver":
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
    "rings-gold":
      "https://images.unsplash.com/photo-1515562141207-6811bcb33ce7?w=500&h=500&fit=crop",
    "rings-silver":
      "https://images.unsplash.com/photo-1515562141207-6811bcb33ce7?w=500&h=500&fit=crop",
    "earrings-gold":
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
    "earrings-silver":
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop",
  };

  const key = `${category}-${metalType}`;
  return fallbacks[key] || fallbacks["necklaces-gold"];
}
