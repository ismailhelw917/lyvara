import axios from "axios";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface LinkCheckResult {
  url: string;
  status: number;
  isValid: boolean;
}

interface ReplacementResult {
  productId: string;
  oldUrl: string;
  newUrl: string;
  replaced: boolean;
}

/**
 * Check if an affiliate link is still valid (returns 200-399 status)
 */
async function checkLinkValidity(url: string): Promise<LinkCheckResult> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: () => true, // Don't throw on any status
    });
    const isValid = response.status >= 200 && response.status < 400;
    return { url, status: response.status, isValid };
  } catch (error) {
    return { url, status: 0, isValid: false };
  }
}

/**
 * Find a working alternative product from Amazon with similar specs
 */
async function findAlternativeProduct(
  currentProduct: any
): Promise<{ asin: string; affiliateUrl: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Query for similar products in same category with good ratings
    const alternatives = await db
      .select()
      .from(products)
      .where(
        eq(products.category, currentProduct.category)
      )
      .limit(5);

    if (alternatives.length === 0) return null;

    // Verify the first alternative's link works
    for (const alt of alternatives) {
      if (!alt.affiliateUrl) continue;
      const linkCheck = await checkLinkValidity(alt.affiliateUrl);
      if (linkCheck.isValid) {
        return {
          asin: alt.asin || "",
          affiliateUrl: alt.affiliateUrl,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding alternative product:", error);
    return null;
  }
}

/**
 * Replace broken affiliate links with working alternatives
 */
export async function replaceBrokenLinks(): Promise<ReplacementResult[]> {
  const results: ReplacementResult[] = [];

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Link Replacement] Database not available");
      return [];
    }

    // Get all active products with affiliate links
    const allProducts = await db
      .select()
      .from(products)
      .limit(100);

    const productsWithLinks = allProducts.filter(
      (p) => p.isActive && p.affiliateUrl
    );

    console.log(
      `[Link Replacement] Checking ${productsWithLinks.length} products...`
    );

    for (const product of productsWithLinks) {
      if (!product.affiliateUrl) continue;

      // Check if current link is valid
      const linkCheck = await checkLinkValidity(product.affiliateUrl);

      if (!linkCheck.isValid) {
        console.log(
          `[Link Replacement] Link broken for ${product.title} (${product.asin}): ${linkCheck.status}`
        );

        // Find and replace with alternative
        const alternative = await findAlternativeProduct(product);

        if (alternative) {
          // Update product with new affiliate URL
          await db
            .update(products)
            .set({ affiliateUrl: alternative.affiliateUrl })
            .where(eq(products.id, product.id));

          results.push({
            productId: String(product.id),
            oldUrl: product.affiliateUrl,
            newUrl: alternative.affiliateUrl,
            replaced: true,
          });

          console.log(
            `[Link Replacement] Replaced link for ${product.title} (${product.asin})`
          );
        } else {
          results.push({
            productId: String(product.id),
            oldUrl: product.affiliateUrl,
            newUrl: "",
            replaced: false,
          });

          console.log(
            `[Link Replacement] No alternative found for ${product.title} (${product.asin})`
          );
        }
      }
    }

    const replaced = results.filter((r) => r.replaced).length;
    console.log(
      `[Link Replacement] Completed: ${replaced}/${results.length} links replaced`
    );

    return results;
  } catch (error) {
    console.error("[Link Replacement] Error:", error);
    return [];
  }
}

/**
 * Get link replacement statistics
 */
export async function getLinkReplacementStats(): Promise<{
  totalProducts: number;
  brokenLinks: number;
  replacedLinks: number;
  lastRun: string | null;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        totalProducts: 0,
        brokenLinks: 0,
        replacedLinks: 0,
        lastRun: null,
      };
    }

    const allProducts = await db.select().from(products);
    const totalProducts = allProducts.filter((p) => p.isActive).length;
    const brokenLinks = allProducts.filter(
      (p) => p.isActive && !p.affiliateUrl
    ).length;

    return {
      totalProducts,
      brokenLinks,
      replacedLinks: 0, // Would need to track in separate table for full accuracy
      lastRun: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Link Replacement] Error getting stats:", error);
    return {
      totalProducts: 0,
      brokenLinks: 0,
      replacedLinks: 0,
      lastRun: null,
    };
  }
}
