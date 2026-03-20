import axios from "axios";
import { storagePut } from "./storage";

/**
 * Fetch real Amazon product images using direct image URLs
 * Amazon images can be accessed directly without scraping
 */
export async function fetchRealAmazonImage(asin: string): Promise<string | null> {
  try {
    // Amazon image URL pattern - direct access without scraping
    // Format: https://images-amazon.com/images/P/{ASIN}.jpg
    const imageUrls = [
      `https://m.media-amazon.com/images/P/${asin}.jpg`,
      `https://images-amazon.com/images/P/${asin}.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`,
    ];

    for (const imageUrl of imageUrls) {
      try {
        const response = await axios.get(imageUrl, {
          timeout: 10000,
          responseType: "arraybuffer",
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });

        if (response.status === 200 && response.data.length > 1000) {
          // Image found and has reasonable size
          console.log(`[ImageFetcher] Found image for ${asin}: ${imageUrl}`);
          
          // Upload to S3
          try {
            const fileKey = `products/${asin}/amazon-image.jpg`;
            const { url } = await storagePut(fileKey, response.data, "image/jpeg");
            console.log(`[ImageFetcher] Uploaded to S3: ${url}`);
            return url;
          } catch (uploadErr) {
            console.warn(`[ImageFetcher] S3 upload failed, returning direct URL:`, uploadErr);
            return imageUrl;
          }
        }
      } catch (err) {
        // Try next URL
        continue;
      }
    }

    console.warn(`[ImageFetcher] No image found for ASIN: ${asin}`);
    return null;
  } catch (error) {
    console.error(`[ImageFetcher] Error fetching image for ${asin}:`, error);
    return null;
  }
}

/**
 * Fetch images for multiple ASINs in parallel
 */
export async function fetchImagesForASINs(asins: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const promises = asins.map(async (asin) => {
    const imageUrl = await fetchRealAmazonImage(asin);
    if (imageUrl) {
      results.set(asin, imageUrl);
    }
  });

  await Promise.all(promises);
  return results;
}
