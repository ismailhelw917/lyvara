import { searchJewelryProducts } from "./rainforestService";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendProductWebhook } from "./productWebhook";

const JEWELRY_QUERIES = [
  "luxury gold necklace women",
  "diamond ring engagement",
  "rose gold bracelet",
  "pearl earrings",
  "platinum jewelry",
  "silver bracelet",
  "gold ring women",
  "gemstone necklace",
  "luxury jewelry set",
  "white gold earrings",
];

export async function fetchAndPopulateProducts(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    console.log("Starting Rainforest product fetch...");
    
    const allProducts = [];
    
    // Fetch products from multiple jewelry queries
    for (const query of JEWELRY_QUERIES) {
      console.log(`Fetching products for: ${query}`);
      const results = await searchJewelryProducts(query, 3);
      allProducts.push(...results);
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    // Remove duplicates by ASIN
    const uniqueProducts = Array.from(
      new Map(allProducts.map((p) => [p.asin, p])).values()
    );

    console.log(`Unique products after deduplication: ${uniqueProducts.length}`);

    // Insert or update products in database
    let insertCount = 0;
    for (const product of uniqueProducts.slice(0, 50)) {
      // Limit to 50 products
      try {
        // Check if product already exists
        const db = await getDb();
        if (!db) {
          console.error("Database connection failed");
          continue;
        }
        
        // Query existing products
        const existingRows = await db
          .select()
          .from(products)
          .where(eq(products.asin, product.asin))
          .limit(1);
        const existing = existingRows[0];

        if (!existing) {
          const metalType = inferMetalType(product.title);
          const category = inferCategory(product.title);
          const isFeatured = Math.random() > 0.7;
          const price = product.price;
          const originalPrice = product.price * 1.2;
          const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=91791709-20`;
          
          await db.insert(products).values([{
            asin: product.asin,
            title: product.title,
            imageUrl: product.image,
            price: price.toString(),
            originalPrice: originalPrice.toString(),
            amazonRating: product.rating,
            reviewCount: product.review_count,
            brand: product.brand || "Generic",
            affiliateUrl,
            metalType,
            category,
            isFeatured,
            isHero: Math.random() > 0.9,
            isActive: true,
          }]);
          
          await sendProductWebhook({
            asin: product.asin,
            title: product.title,
            brand: product.brand || "Generic",
            price,
            originalPrice,
            imageUrl: product.image || "",
            affiliateUrl,
            amazonRating: product.rating || 0,
            reviewCount: product.review_count || 0,
            isFeatured,
            category,
            metalType,
          });
          
          insertCount++;
        }
      } catch (error) {
        console.error(`Error inserting product ${product.asin}:`, error);
      }
    }

    console.log(`Successfully inserted ${insertCount} new products`);

    return {
      success: true,
      count: insertCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in fetchAndPopulateProducts:", errorMessage);
    return {
      success: false,
      count: 0,
      error: errorMessage,
    };
  }
}

function inferMetalType(
  title: string
): "gold" | "silver" | "rose_gold" | "white_gold" | "platinum" {
  const lower = title.toLowerCase();
  if (lower.includes("rose gold")) return "rose_gold";
  if (lower.includes("white gold")) return "white_gold";
  if (lower.includes("platinum")) return "platinum";
  if (lower.includes("silver")) return "silver";
  return "gold"; // Default
}

function inferCategory(
  title: string
): "necklaces" | "bracelets" | "rings" | "earrings" | "other" {
  const lower = title.toLowerCase();
  if (lower.includes("necklace") || lower.includes("pendant")) return "necklaces";
  if (lower.includes("bracelet")) return "bracelets";
  if (lower.includes("ring")) return "rings";
  if (lower.includes("earring")) return "earrings";
  return "other"; // Default
}
