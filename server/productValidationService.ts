import axios from "axios";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { inArray } from "drizzle-orm";
import type { InsertProduct } from "../drizzle/schema";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single product for data quality
 */
export function validateProduct(product: InsertProduct): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!product.asin || product.asin.trim() === "") {
    errors.push("Missing ASIN");
  }
  if (!product.title || product.title.trim().length < 10) {
    errors.push("Title missing or too short (min 10 chars)");
  }
  if (!product.category) {
    errors.push("Missing category");
  }
  if (!product.metalType) {
    errors.push("Missing metal type");
  }
  if (!product.affiliateUrl || !product.affiliateUrl.includes("amazon.com")) {
    errors.push("Invalid or missing affiliate URL");
  }

  if (!product.price || Number(product.price) <= 0) {
    errors.push("Price missing or invalid (must be > 0)");
  }
  if (product.originalPrice && product.originalPrice < (product.price || 0)) {
    errors.push("Original price cannot be less than current price");
  }

  if (!product.imageUrl || product.imageUrl.trim() === "") {
    warnings.push("Missing image URL");
  } else if (!isValidImageUrl(product.imageUrl)) {
    warnings.push("Image URL format looks invalid");
  }

  if (!product.description || product.description.trim().length < 20) {
    warnings.push("Description missing or too short");
  }

  if (product.amazonRating && (product.amazonRating < 0 || product.amazonRating > 5)) {
    errors.push("Rating must be between 0 and 5");
  }

  if (product.reviewCount && product.reviewCount < 0) {
    errors.push("Review count cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if image URL format is valid
 */
function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Check if product is a duplicate of existing products
 */
export async function checkForDuplicate(
  product: InsertProduct,
  existingProducts: InsertProduct[]
): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> {
  // Exact ASIN match
  const exactMatch = existingProducts.find((p) => p.asin === product.asin);
  if (exactMatch) {
    return {
      isDuplicate: true,
      reason: "Exact ASIN match",
      existingId: String(exactMatch.id),
    };
  }

  // Title similarity (80%+ match)
  const titleMatch = existingProducts.find((p) => {
    const similarity = calculateStringSimilarity(
      product.title?.toLowerCase() || "",
      p.title?.toLowerCase() || ""
    );
    return similarity > 0.8;
  });
  if (titleMatch) {
    return {
      isDuplicate: true,
      reason: "Title similarity match",
      existingId: String(titleMatch.id),
    };
  }

  // Price range match
  const priceMatch = existingProducts.find((p) => {
    const priceDiff = Math.abs(Number(product.price || 0) - Number(p.price || 0));
    const titleSimilarity = calculateStringSimilarity(
      product.title?.toLowerCase() || "",
      p.title?.toLowerCase() || ""
    );
    return titleSimilarity > 0.6 && priceDiff < 5;
  });
  if (priceMatch) {
    return {
      isDuplicate: true,
      reason: "Similar title and price range",
      existingId: String(priceMatch.id),
    };
  }

  return { isDuplicate: false };
}

/**
 * Validate and deduplicate a batch of products
 */
export async function validateAndDeduplicateProducts(
  newProducts: InsertProduct[]
): Promise<{
  valid: InsertProduct[];
  invalid: { product: InsertProduct; errors: string[] }[];
  duplicates: { product: InsertProduct; existingId: string; reason: string }[];
}> {
  const db = await getDb();
  if (!db) {
    return { valid: newProducts, invalid: [], duplicates: [] };
  }

  const existingProducts = await db.select().from(products);

  const valid: InsertProduct[] = [];
  const invalid: { product: InsertProduct; errors: string[] }[] = [];
  const duplicates: { product: InsertProduct; existingId: string; reason: string }[] = [];

  for (const product of newProducts) {
    const validation = validateProduct(product);
    if (!validation.isValid) {
      invalid.push({
        product,
        errors: validation.errors,
      });
      continue;
    }

    const dupResult = await checkForDuplicate(product, existingProducts);
    if (dupResult.isDuplicate) {
      duplicates.push({
        product,
        existingId: dupResult.existingId || "",
        reason: dupResult.reason || "Unknown",
      });
      continue;
    }

    valid.push(product);
  }

  return { valid, invalid, duplicates };
}

/**
 * Clean up duplicate products from database
 */
export async function cleanupDuplicates(): Promise<{
  duplicatesFound: number;
  duplicatesRemoved: number;
}> {
  const db = await getDb();
  if (!db) {
    return { duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  const allProducts = await db.select().from(products);
  const seenAsins = new Set<string>();
  const duplicateIds: string[] = [];

  for (const product of allProducts) {
    if (seenAsins.has(product.asin)) {
      duplicateIds.push(String(product.id));
    } else {
      seenAsins.add(product.asin);
    }
  }

  if (duplicateIds.length > 0) {
    const numIds = duplicateIds.map(id => parseInt(id, 10));
    await db
      .delete(products)
      .where(inArray(products.id, numIds));
  }

  return {
    duplicatesFound: duplicateIds.length,
    duplicatesRemoved: duplicateIds.length,
  };
}

/**
 * Get data quality report
 */
export async function getDataQualityReport(): Promise<{
  totalProducts: number;
  productsWithValidImages: number;
  productsWithValidDescriptions: number;
  productsWithRatings: number;
  duplicateCount: number;
  dataQualityScore: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalProducts: 0,
      productsWithValidImages: 0,
      productsWithValidDescriptions: 0,
      productsWithRatings: 0,
      duplicateCount: 0,
      dataQualityScore: 0,
    };
  }

  const allProducts = await db.select().from(products);
  const seenAsins = new Set<string>();
  let duplicateCount = 0;

  for (const product of allProducts) {
    if (seenAsins.has(product.asin)) {
      duplicateCount++;
    } else {
      seenAsins.add(product.asin);
    }
  }

  const productsWithValidImages = allProducts.filter(
    (p) => p.imageUrl && isValidImageUrl(p.imageUrl)
  ).length;

  const productsWithValidDescriptions = allProducts.filter(
    (p) => p.description && p.description.length >= 20
  ).length;

  const productsWithRatings = allProducts.filter(
    (p) => p.amazonRating && (p.amazonRating as number) > 0
  ).length;

  const total = allProducts.length;
  const dataQualityScore = total > 0 ? Math.round(
    ((productsWithValidImages +
      productsWithValidDescriptions +
      productsWithRatings) /
      (total * 3)) *
      100
  ) : 0;

  return {
    totalProducts: total,
    productsWithValidImages,
    productsWithValidDescriptions,
    productsWithRatings,
    duplicateCount,
    dataQualityScore,
  };
}
