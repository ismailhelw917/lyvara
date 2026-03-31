/**
 * Product Webhook Service
 * Sends product data to Zapier when products are added/updated from Rainforest API
 */

import type { ProcessedProduct } from "./rainforestAPI";

export interface ProductWebhookPayload {
  asin: string;
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  affiliateUrl: string;
  amazonRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category: 'necklaces' | 'bracelets' | 'rings' | 'earrings' | 'other';
  metalType: 'gold' | 'silver' | 'rose_gold' | 'white_gold' | 'platinum';
}

/**
 * Send product data to Zapier webhook
 * Called whenever a product is added or updated from Rainforest API
 */
export async function sendProductWebhook(product: ProcessedProduct): Promise<{
  success: boolean;
  message: string;
  webhookUrl?: string;
}> {
  const webhookUrl = process.env.ZAPIER_PRODUCT_WEBHOOK;

  if (!webhookUrl) {
    console.warn("⚠️ ZAPIER_PRODUCT_WEBHOOK not configured. Skipping webhook.");
    return {
      success: false,
      message: "Webhook URL not configured",
    };
  }

  try {
    const payload: ProductWebhookPayload = {
      asin: product.asin,
      title: product.title,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.imageUrl,
      affiliateUrl: product.affiliateUrl,
      amazonRating: product.amazonRating,
      reviewCount: product.reviewCount,
      isFeatured: product.isFeatured,
      category: product.category,
      metalType: product.metalType,
    };

    console.log(`📤 Sending product webhook for: ${product.title}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`✅ Product webhook sent successfully for ASIN: ${product.asin}`);

    return {
      success: true,
      message: `Product webhook sent for ${product.title}`,
      webhookUrl,
    };
  } catch (error) {
    console.error(
      `❌ Error sending product webhook for ${product.title}:`,
      error
    );
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send multiple products to Zapier webhook
 * Called when batch products are added from Rainforest API
 */
export async function sendProductsWebhook(
  products: ProcessedProduct[]
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  message: string;
}> {
  let sent = 0;
  let failed = 0;

  for (const product of products) {
    const result = await sendProductWebhook(product);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    message: `Sent ${sent} products, ${failed} failed`,
  };
}

/**
 * Generate Zapier webhook configuration instructions
 */
export function getWebhookSetupInstructions(): {
  webhookName: string;
  description: string;
  fields: string[];
  setupSteps: string[];
} {
  return {
    webhookName: "New Product Added",
    description:
      "Triggered when a new product is fetched from Rainforest API and added to the database",
    fields: [
      "asin",
      "title",
      "brand",
      "price",
      "originalPrice",
      "imageUrl",
      "affiliateUrl",
      "amazonRating",
      "reviewCount",
      "isFeatured",
      "category",
      "metalType",
    ],
    setupSteps: [
      "1. Go to zapier.com and create a new Zap",
      "2. Choose 'Webhooks by Zapier' as the trigger app",
      "3. Select 'Catch Raw Hook' as the trigger event",
      "4. Copy the webhook URL provided by Zapier",
      "5. Add the URL to your environment variables as ZAPIER_PRODUCT_WEBHOOK",
      "6. Restart your server",
      "7. Test by adding a new product from Rainforest API",
      "8. In Zapier, you'll see the webhook payload with all product fields",
      "9. Create your Zap actions (e.g., post to social media, add to spreadsheet, send email)",
    ],
  };
}
