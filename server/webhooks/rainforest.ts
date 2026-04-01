import { Router } from "express";
import { z } from "zod";
import { upsertProduct } from "../db";

const router = Router();

// Rainforest API webhook for product data
router.post("/rainforest/products", async (req, res) => {
  try {
    const { category_results, request_parameters } = req.body;

    if (!category_results || !Array.isArray(category_results)) {
      return res.status(400).json({ error: "Invalid payload: missing category_results" });
    }

    const affiliateTag = request_parameters?.associate_id || "91791709-20";
    let rawTab = req.query.tab as string || "classic";
    const MAX_PRODUCTS_PER_CATEGORY = 50; // Cap products per category

    // Map Zapier category names to database enum values
    const mapTabValue = (input: string): string => {
      const normalized = input.toLowerCase().trim();
      
      // Mapping from Zapier names to database enum values
      const tabMapping: Record<string, string> = {
        "women's anklets": "anklets",
        "anklets": "anklets",
        "women's body jewelry": "body-jewelry",
        "body jewelry": "body-jewelry",
        "body-jewelry": "body-jewelry",
        "women's bracelets": "bracelets",
        "bracelets": "bracelets",
        "women's brooches & pins": "brooches-pins",
        "brooches & pins": "brooches-pins",
        "brooches-pins": "brooches-pins",
        "women's earrings": "earrings",
        "earrings": "earrings",
        "women's jewelry sets": "jewelry-sets",
        "jewelry sets": "jewelry-sets",
        "jewelry-sets": "jewelry-sets",
        "women's necklaces": "necklaces",
        "necklaces": "necklaces",
        "women's rings": "rings",
        "rings": "rings",
        "classic": "classic",
        "bargains": "bargains",
      };
      
      return tabMapping[normalized] || "classic";
    };

    const tab = mapTabValue(rawTab);

    let loadedCount = 0;
    let skippedCount = 0;
    let cappedCount = 0;
    const seenASINs = new Set<string>();

    // Helper function to validate image URL
    const isValidImageUrl = (url: string): boolean => {
      if (!url) return false;
      try {
        const urlObj = new URL(url);
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname);
      } catch {
        return false;
      }
    };

    for (const product of category_results) {
      try {
        // Enforce 50-product cap per category
        if (loadedCount >= MAX_PRODUCTS_PER_CATEGORY) {
          cappedCount++;
          continue;
        }

        // Handle both field naming conventions (image_url vs image, etc.)
        const imageUrl = product.image_url || product.image;
        const price = product.price;
        const rating = product.rating || product.amazonRating;
        const reviewCount = product.review_count || product.reviewCount;
        const link = product.link;
        
        // Skip if missing required fields
        if (!product.asin || !product.title || !price) {
          console.log(`[Webhook] Skipping - missing fields. ASIN: ${product.asin}, Title: ${product.title}, Price: ${price}`);
          skippedCount++;
          continue;
        }

        // Validate image URL - CRITICAL: must have valid image
        if (!isValidImageUrl(imageUrl)) {
          console.log(`[Webhook] Skipping ${product.asin} - invalid image: ${imageUrl}`);
          skippedCount++;
          continue;
        }

        // Skip duplicates
        if (seenASINs.has(product.asin)) {
          console.log(`[Webhook] Skipping duplicate: ${product.asin}`);
          skippedCount++;
          continue;
        }
        seenASINs.add(product.asin);
        console.log(`[Webhook] Processing: ${product.asin} - ${product.title}`);

        // Detect category
        const title = product.title.toLowerCase();
        let category: "necklaces" | "bracelets" | "rings" | "earrings" | "pendants" | "sets" | "other" = "other";
        if (title.includes("necklace") || title.includes("pendant") || title.includes("chain")) {
          category = "necklaces";
        } else if (title.includes("bracelet") || title.includes("bangle") || title.includes("anklet")) {
          category = "bracelets";
        } else if (title.includes("ring")) {
          category = "rings";
        } else if (title.includes("earring") || title.includes("stud") || title.includes("hoop")) {
          category = "earrings";
        }

        // Detect metal type
        let metalType: "gold" | "silver" | "rose_gold" | "white_gold" | "platinum" | "mixed" = "gold";
        if (title.includes("rose gold")) metalType = "rose_gold";
        else if (title.includes("white gold")) metalType = "white_gold";
        else if (title.includes("gold")) metalType = "gold";
        else if (title.includes("silver")) metalType = "silver";
        else if (title.includes("platinum")) metalType = "platinum";

        // Create affiliate link
        const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${affiliateTag}`;

        // Determine if product should be featured based on rating and reviews
        const shouldFeature = (rating && rating >= 4.5 && reviewCount && reviewCount >= 50) || false;

        // Insert product
        const tabValue: any = tab;
        await upsertProduct({
          asin: product.asin,
          title: product.title,
          brand: product.brand || "Unknown",
          price: price,
          originalPrice: product.original_price,
          amazonRating: rating || 0,
          reviewCount: reviewCount || 0,
          imageUrl: imageUrl,
          affiliateUrl: link || affiliateLink,
          category,
          metalType,
          tab: tabValue,
          isActive: true,
          isFeatured: shouldFeature,
        });

        loadedCount++;
        console.log(`[Webhook] ✅ Loaded: ${product.asin} into tab '${tab}'`);
      } catch (error) {
        console.error(`[Webhook] ❌ Error ${product.asin}:`, error);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      loaded: loadedCount,
      skipped: skippedCount,
      capped: cappedCount,
      tab: tab,
      rawTab: rawTab,
      message: `Loaded ${loadedCount} products into '${tab}' tab (${cappedCount} capped at 50/category). Skipped ${skippedCount} invalid/duplicates.`,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
