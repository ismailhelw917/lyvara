/**
 * Product Data Verifier
 *
 * Dual-approach verification system:
 * 1. Fetches product data from Amazon PA-API (primary source)
 * 2. Verifies with web scraping (secondary source)
 * 3. Combines both to get the most accurate data and images
 */

import { InsertProduct } from "../drizzle/schema";

interface ProductData {
  asin: string;
  title: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  affiliateUrl: string;
}

/**
 * Fetch product data from PA-API
 */
async function fetchFromPaApi(asin: string): Promise<ProductData | null> {
  try {
    const accessKey = process.env.AMAZON_ACCESS_KEY;
    const secretKey = process.env.AMAZON_SECRET_KEY;
    const partnerTag = process.env.AMAZON_PARTNER_TAG;

    if (!accessKey || !secretKey || !partnerTag) {
      console.warn("[ProductVerifier] PA-API credentials not configured");
      return null;
    }

    // Call PA-API GetItems operation to fetch specific product by ASIN
    const response = await fetch("https://webservices.amazon.com/paapi5/getitems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      },
      body: JSON.stringify({
        ItemIds: [asin],
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Resources: [
          "Images.Primary.Large",
          "Images.Variants",
          "ItemInfo.Title",
          "ItemInfo.ByLineInfo",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "CustomerReviews.StarRating",
          "CustomerReviews.Count",
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[ProductVerifier] PA-API error for ${asin}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const item = data.Items?.[0];

    if (!item) {
      console.warn(`[ProductVerifier] No item found in PA-API response for ${asin}`);
      return null;
    }

    return {
      asin,
      title: item.ItemInfo?.Title?.DisplayValue,
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price?.Amount,
      originalPrice: item.Offers?.Listings?.[0]?.SavingBasis?.Amount,
      imageUrl: item.Images?.Primary?.Large?.URL,
      additionalImages: item.Images?.Variants?.map((v: any) => v.Large?.URL).filter(Boolean),
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${partnerTag}`,
    };
  } catch (err) {
    console.warn(`[ProductVerifier] PA-API fetch failed for ${asin}:`, err);
    return null;
  }
}

/**
 * Fetch product data from Amazon product page (web scraping)
 */
async function fetchFromWebScraping(asin: string): Promise<ProductData | null> {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`[ProductVerifier] Web scraping failed for ${asin}: ${response.statusText}`);
      return null;
    }

    const html = await response.text();

    // Extract data from HTML using regex patterns
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/);
    const priceMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/);
    const imageMatch = html.match(/"landingImage","([^"]+)"/);
    const ratingMatch = html.match(/<span class="a-icon-star-small"><span[^>]*>([^<]+)<\/span>/);
    const reviewCountMatch = html.match(/<span id="acrCustomerReviewText"[^>]*>([^<]+)<\/span>/);

    const title = titleMatch?.[1]?.trim();
    const price = priceMatch?.[1]?.replace(/[^\d.]/g, "");
    const imageUrl = imageMatch?.[1];
    const rating = ratingMatch?.[1]?.split(" ")?.[0];
    const reviewCountStr = reviewCountMatch?.[1];
    const reviewCount = reviewCountStr ? parseInt(reviewCountStr.match(/\d+/)?.[0] || "0") : undefined;

    if (!title || !imageUrl) {
      console.warn(`[ProductVerifier] Insufficient data extracted for ${asin}`);
      return null;
    }

    const partnerTag = process.env.AMAZON_PARTNER_TAG || "91791709-20";

    return {
      asin,
      title,
      price: price ? parseFloat(price) : undefined,
      imageUrl,
      rating: rating ? parseFloat(rating) : undefined,
      reviewCount,
      affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${partnerTag}`,
    };
  } catch (err) {
    console.warn(`[ProductVerifier] Web scraping failed for ${asin}:`, err);
    return null;
  }
}

/**
 * Verify and combine data from both sources
 */
export async function verifyProductData(asin: string): Promise<ProductData | null> {
  console.log(`[ProductVerifier] Starting verification for ${asin}`);

  // Fetch from both sources in parallel
  const [paApiData, webScrapingData] = await Promise.all([
    fetchFromPaApi(asin),
    fetchFromWebScraping(asin),
  ]);

  // If PA-API data exists, use it as primary (more reliable)
  if (paApiData && paApiData.imageUrl) {
    console.log(`[ProductVerifier] ✓ Using PA-API data for ${asin}`);
    return paApiData;
  }

  // Fall back to web scraping data
  if (webScrapingData && webScrapingData.imageUrl) {
    console.log(`[ProductVerifier] ✓ Using web scraping data for ${asin}`);
    return webScrapingData;
  }

  // If both fail, return null
  console.warn(`[ProductVerifier] ✗ Failed to verify data for ${asin}`);
  return null;
}

/**
 * Verify multiple products in parallel
 */
export async function verifyMultipleProducts(asins: string[]): Promise<ProductData[]> {
  console.log(`[ProductVerifier] Verifying ${asins.length} products...`);

  const results = await Promise.all(asins.map((asin) => verifyProductData(asin)));

  const validResults = results.filter((r) => r !== null) as ProductData[];
  console.log(`[ProductVerifier] Successfully verified ${validResults.length}/${asins.length} products`);

  return validResults;
}

/**
 * Convert ProductData to InsertProduct for database
 */
export function convertToInsertProduct(data: ProductData, category: string, metalType: string): InsertProduct {
  return {
    asin: data.asin,
    title: data.title,
    brand: data.brand,
    description: data.title,
    price: data.price ? String(data.price) : "0",
    originalPrice: data.originalPrice ? String(data.originalPrice) : undefined,
    imageUrl: data.imageUrl,
    additionalImages: data.additionalImages || undefined,
    affiliateUrl: data.affiliateUrl,
    amazonRating: data.rating || undefined,
    reviewCount: data.reviewCount || 0,
    category: category as any,
    metalType: metalType as any,
    tags: [category, metalType],
    isFeatured: false,
    isHero: false,
    isActive: true,
    lastFetchedAt: new Date(),
  };
}
