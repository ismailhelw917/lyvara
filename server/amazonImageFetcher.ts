import * as cheerio from "cheerio";

/**
 * Fetches real product images from Amazon product pages using ASIN
 * Extracts the main product image URL from the HTML
 */
export async function fetchAmazonProductImage(asin: string): Promise<string | null> {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    
    // Use a realistic User-Agent to avoid being blocked
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch Amazon page for ASIN ${asin}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try multiple selectors to find the main product image
    let imageUrl = null;

    // Method 1: Look for the main product image in the landingImage script
    const scripts = $('script[type="text/javascript"]').toArray();
    for (const script of scripts) {
      const content = $(script).html();
      if (content && content.includes('"landingImage"')) {
        try {
          // Extract the image URL from the JSON data
          const match = content.match(/"landingImage"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            imageUrl = match[1];
            break;
          }
        } catch (e) {
          // Continue to next method
        }
      }
    }

    // Method 2: Look for image in the main image container
    if (!imageUrl) {
      const mainImage = $("#landingImage, img[data-a-dynamic-image]");
      if (mainImage.length > 0) {
        imageUrl = mainImage.attr("src");
      }
    }

    // Method 3: Look for images in the image gallery
    if (!imageUrl) {
      const galleryImages = $("img.s-image, img[alt*='product']");
      if (galleryImages.length > 0) {
        imageUrl = galleryImages.first().attr("src");
      }
    }

    // Method 4: Look for any large image in the page
    if (!imageUrl) {
      const allImages = $("img");
      for (let i = 0; i < allImages.length; i++) {
        const src = $(allImages[i]).attr("src");
        if (src && (src.includes("images-amazon.com") || src.includes("m.media-amazon.com"))) {
          imageUrl = src;
          break;
        }
      }
    }

    // Clean up the image URL if needed
    if (imageUrl) {
      // Remove query parameters and ensure it's a full URL
      if (!imageUrl.startsWith("http")) {
        imageUrl = "https:" + imageUrl;
      }
      // Ensure we have a high-quality image by adjusting the URL if needed
      imageUrl = imageUrl.replace(/\._[A-Z0-9]+_\./, "._AC_");
      return imageUrl;
    }

    console.warn(`Could not find image URL for ASIN ${asin}`);
    return null;
  } catch (error) {
    console.error(`Error fetching image for ASIN ${asin}:`, error);
    return null;
  }
}

/**
 * Batch fetch images for multiple ASINs
 */
export async function fetchMultipleAmazonImages(
  asins: string[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  // Add delay between requests to avoid rate limiting
  for (const asin of asins) {
    results.set(asin, await fetchAmazonProductImage(asin));
    // Wait 1-2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
  }
  
  return results;
}

/**
 * Get all image URLs for a product (legacy function for compatibility)
 */
export async function fetchAmazonProductImages(asin: string): Promise<string[]> {
  const image = await fetchAmazonProductImage(asin);
  return image ? [image] : [];
}
