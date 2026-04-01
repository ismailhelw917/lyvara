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
    const tab = req.query.tab as string || "classic"; // Allow tab to be specified via query param

    let loadedCount = 0;
    let skippedCount = 0;
    const seenASINs = new Set<string>();

    for (const product of category_results) {
      try {
        // Skip if missing required fields
        if (!product.asin || !product.title || !product.image_url || !product.price) {
          skippedCount++;
          continue;
        }

        // Skip duplicates
        if (seenASINs.has(product.asin)) {
          skippedCount++;
          continue;
        }
        seenASINs.add(product.asin);

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

        // Insert product
        const tabValue: "classic" | "bargains" = (tab === "bargains" || tab === "classic") ? tab : "classic";
        await upsertProduct({
          asin: product.asin,
          title: product.title,
          brand: product.brand || "Unknown",
          price: product.price,
          originalPrice: product.original_price,
          amazonRating: product.rating || 0,
          reviewCount: product.review_count || 0,
          imageUrl: product.image_url,
          affiliateUrl: affiliateLink,
          category,
          metalType,
          tab: tabValue,
          isActive: true,
          isFeatured: false,
        });

        loadedCount++;
      } catch (error) {
        console.error(`Error processing product ${product.asin}:`, error);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      loaded: loadedCount,
      skipped: skippedCount,
      tab,
      message: `Loaded ${loadedCount} products into ${tab} tab`,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
