/**
 * Centralized Affiliate URL Builder
 *
 * This service ensures ALL affiliate links automatically include the correct
 * Amazon Associates tracking tag (91791709-20). Any product link generated
 * through this service will be guaranteed to have the correct tag.
 *
 * Usage:
 *   const url = buildAffiliateUrl('B0BLK7NRLM');  // Returns: https://www.amazon.com/dp/B0BLK7NRLM?tag=91791709-20
 *   const url = buildAffiliateUrl('B0BLK7NRLM', 'https://www.amazon.com/dp/B0BLK7NRLM?ref=xyz'); // Replaces existing tag
 */

const CORRECT_AFFILIATE_TAG = "91791709-20";

/**
 * Build an affiliate URL with the correct tracking tag
 *
 * @param asin - Amazon product ASIN (e.g., "B0BLK7NRLM")
 * @param existingUrl - Optional existing URL to validate/fix
 * @returns Properly formatted affiliate URL with correct tag
 */
export function buildAffiliateUrl(asin: string, existingUrl?: string): string {
  if (!asin || typeof asin !== "string") {
    throw new Error("ASIN is required and must be a string");
  }

  // If no existing URL provided, build from scratch
  if (!existingUrl) {
    return `https://www.amazon.com/dp/${asin}?tag=${CORRECT_AFFILIATE_TAG}`;
  }

  // Parse the existing URL
  try {
    const url = new URL(existingUrl);

    // Remove any existing incorrect tags
    url.searchParams.delete("tag");

    // Add the correct tag
    url.searchParams.set("tag", CORRECT_AFFILIATE_TAG);

    return url.toString();
  } catch (error) {
    // If URL parsing fails, build a new one from the ASIN
    console.warn(`[AffiliateUrlBuilder] Failed to parse URL: ${existingUrl}. Building new URL from ASIN.`);
    return `https://www.amazon.com/dp/${asin}?tag=${CORRECT_AFFILIATE_TAG}`;
  }
}

/**
 * Validate that a URL has the correct affiliate tag
 *
 * @param url - URL to validate
 * @returns true if URL has correct tag, false otherwise
 */
export function hasCorrectAffiliateTag(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const tag = urlObj.searchParams.get("tag");
    return tag === CORRECT_AFFILIATE_TAG;
  } catch {
    return false;
  }
}

/**
 * Extract ASIN from an Amazon URL
 *
 * @param url - Amazon product URL
 * @returns ASIN if found, null otherwise
 */
export function extractAsinFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match /dp/ASIN pattern
    const match = pathname.match(/\/dp\/([A-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get the correct affiliate tag
 *
 * @returns The correct Amazon Associates tracking tag
 */
export function getCorrectAffiliateTag(): string {
  return CORRECT_AFFILIATE_TAG;
}

/**
 * Batch process multiple URLs to ensure they all have correct tags
 *
 * @param urls - Array of URLs to validate/fix
 * @returns Array of corrected URLs
 */
export function fixAffiliateUrlsBatch(urls: string[]): string[] {
  return urls.map((url) => {
    const asin = extractAsinFromUrl(url);
    if (!asin) {
      console.warn(`[AffiliateUrlBuilder] Could not extract ASIN from: ${url}`);
      return url;
    }
    return buildAffiliateUrl(asin, url);
  });
}
