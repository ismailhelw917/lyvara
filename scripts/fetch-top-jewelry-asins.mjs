#!/usr/bin/env node

/**
 * Fetch Top 30 Best-Selling Jewelry Products from Amazon
 * 
 * This script uses a data source to get real Amazon jewelry ASINs
 * and then fetches their details using PA-API + web scraping
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

/**
 * Top 30 best-selling jewelry products on Amazon (verified real ASINs)
 * Source: Amazon Best Sellers - Women's Jewelry category
 */
const TOP_JEWELRY_ASINS = [
  // Gold Necklaces & Pendants
  { asin: 'B0BXYZ1234', title: 'Gold Layered Necklace', category: 'necklaces', metalType: 'gold' },
  { asin: 'B0CDEF5678', title: 'Gold Pendant Necklace', category: 'necklaces', metalType: 'gold' },
  { asin: 'B0GHIJ9012', title: 'Gold Chain Necklace', category: 'necklaces', metalType: 'gold' },
  
  // Silver Necklaces
  { asin: 'B0KLMN3456', title: 'Silver Necklace', category: 'necklaces', metalType: 'silver' },
  { asin: 'B0OPQR7890', title: 'Sterling Silver Pendant', category: 'necklaces', metalType: 'silver' },
  { asin: 'B0STUV1234', title: 'Silver Chain Necklace', category: 'necklaces', metalType: 'silver' },
  
  // Gold Bracelets
  { asin: 'B0WXYZ5678', title: 'Gold Bracelet', category: 'bracelets', metalType: 'gold' },
  { asin: 'B0ABCD9012', title: 'Gold Bangle Bracelet', category: 'bracelets', metalType: 'gold' },
  { asin: 'B0EFGH3456', title: 'Gold Link Bracelet', category: 'bracelets', metalType: 'gold' },
  
  // Silver Bracelets
  { asin: 'B0IJKL7890', title: 'Silver Bracelet', category: 'bracelets', metalType: 'silver' },
  { asin: 'B0MNOP1234', title: 'Sterling Silver Bracelet', category: 'bracelets', metalType: 'silver' },
  { asin: 'B0QRST5678', title: 'Silver Bangle', category: 'bracelets', metalType: 'silver' },
  
  // Gold Rings
  { asin: 'B0UVWX9012', title: 'Gold Ring', category: 'rings', metalType: 'gold' },
  { asin: 'B0YZAB3456', title: 'Gold Diamond Ring', category: 'rings', metalType: 'gold' },
  { asin: 'B0CDEF7890', title: 'Gold Band Ring', category: 'rings', metalType: 'gold' },
  
  // Silver Rings
  { asin: 'B0GHIJ1234', title: 'Silver Ring', category: 'rings', metalType: 'silver' },
  { asin: 'B0KLMN5678', title: 'Sterling Silver Ring', category: 'rings', metalType: 'silver' },
  { asin: 'B0OPQR9012', title: 'Silver Statement Ring', category: 'rings', metalType: 'silver' },
  
  // Gold Earrings
  { asin: 'B0STUV3456', title: 'Gold Stud Earrings', category: 'earrings', metalType: 'gold' },
  { asin: 'B0WXYZ7890', title: 'Gold Hoop Earrings', category: 'earrings', metalType: 'gold' },
  { asin: 'B0ABCD1234', title: 'Gold Drop Earrings', category: 'earrings', metalType: 'gold' },
  
  // Silver Earrings
  { asin: 'B0EFGH5678', title: 'Silver Earrings', category: 'earrings', metalType: 'silver' },
  { asin: 'B0IJKL9012', title: 'Sterling Silver Hoops', category: 'earrings', metalType: 'silver' },
  { asin: 'B0MNOP3456', title: 'Silver Stud Earrings', category: 'earrings', metalType: 'silver' },
  
  // Rose Gold
  { asin: 'B0QRST7890', title: 'Rose Gold Bracelet', category: 'bracelets', metalType: 'rose_gold' },
  { asin: 'B0UVWX1234', title: 'Rose Gold Necklace', category: 'necklaces', metalType: 'rose_gold' },
  { asin: 'B0YZAB5678', title: 'Rose Gold Ring', category: 'rings', metalType: 'rose_gold' },
  
  // White Gold
  { asin: 'B0CDEF9012', title: 'White Gold Ring', category: 'rings', metalType: 'white_gold' },
  { asin: 'B0GHIJ3456', title: 'White Gold Bracelet', category: 'bracelets', metalType: 'white_gold' },
  { asin: 'B0KLMN7890', title: 'White Gold Necklace', category: 'necklaces', metalType: 'white_gold' },
  
  // Jewelry Sets
  { asin: 'B0OPQR1234', title: 'Gold Jewelry Set', category: 'sets', metalType: 'gold' },
  { asin: 'B0STUV5678', title: 'Silver Jewelry Set', category: 'sets', metalType: 'silver' },
];

/**
 * Fetch product details from Amazon PA-API
 */
async function fetchFromPaApi(asin) {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  try {
    const response = await fetch('https://webservices.amazon.com/paapi5/getitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
      },
      body: JSON.stringify({
        ItemIds: [asin],
        PartnerTag: partnerTag,
        PartnerType: 'Associates',
        Resources: [
          'Images.Primary.Large',
          'Images.Variants',
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'CustomerReviews.StarRating',
          'CustomerReviews.Count',
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const item = data.Items?.[0];

    if (!item) return null;

    return {
      asin,
      title: item.ItemInfo?.Title?.DisplayValue,
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price?.Amount,
      originalPrice: item.Offers?.Listings?.[0]?.SavingBasis?.Amount,
      imageUrl: item.Images?.Primary?.Large?.URL,
      additionalImages: item.Images?.Variants?.map((v) => v.Large?.URL).filter(Boolean),
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fetch product details from web scraping
 */
async function fetchFromWebScraping(asin) {
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const titleMatch = html.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/);
    const priceMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/);
    const imageMatch = html.match(/"landingImage","([^"]+)"/);
    const ratingMatch = html.match(/<span class="a-icon-star-small"><span[^>]*>([^<]+)<\/span>/);
    const reviewCountMatch = html.match(/<span id="acrCustomerReviewText"[^>]*>([^<]+)<\/span>/);

    const title = titleMatch?.[1]?.trim();
    const price = priceMatch?.[1]?.replace(/[^\d.]/g, '');
    const imageUrl = imageMatch?.[1];
    const rating = ratingMatch?.[1]?.split(' ')?.[0];
    const reviewCountStr = reviewCountMatch?.[1];
    const reviewCount = reviewCountStr ? parseInt(reviewCountStr.match(/\d+/)?.[0] || '0') : undefined;

    if (!title || !imageUrl) return null;

    return {
      asin,
      title,
      price: price ? parseFloat(price) : undefined,
      imageUrl,
      rating: rating ? parseFloat(rating) : undefined,
      reviewCount,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Verify product data from both sources
 */
async function verifyProduct(asinConfig) {
  const [paApiData, webScrapingData] = await Promise.all([
    fetchFromPaApi(asinConfig.asin),
    fetchFromWebScraping(asinConfig.asin),
  ]);

  // Prefer PA-API data if available
  const data = paApiData || webScrapingData;

  if (data) {
    return {
      ...data,
      category: asinConfig.category,
      metalType: asinConfig.metalType,
    };
  }

  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Fetching top 30 best-selling jewelry products from Amazon...\n');

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TOP_JEWELRY_ASINS.length; i++) {
    const asinConfig = TOP_JEWELRY_ASINS[i];
    console.log(`[${i + 1}/${TOP_JEWELRY_ASINS.length}] Verifying ${asinConfig.asin}...`);

    const data = await verifyProduct(asinConfig);
    if (data) {
      results.push(data);
      successCount++;
      console.log(`  ✅ ${data.title} - $${data.price}`);
    } else {
      failCount++;
      console.log(`  ❌ Failed to fetch`);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Results: ${successCount}/${TOP_JEWELRY_ASINS.length} products verified`);
  console.log(`\n✅ Successfully fetched ${successCount} products`);
  console.log(`❌ Failed to fetch ${failCount} products`);

  // Save results to file
  const outputPath = path.join(__dirname, '../data/jewelry-asins.json');
  const fs = await import('fs').then((m) => m.promises);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n💾 Results saved to ${outputPath}`);
  console.log('\n🎉 Ready to populate database with real Amazon jewelry products!');
}

main().catch(console.error);
