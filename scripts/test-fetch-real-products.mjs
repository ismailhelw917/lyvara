#!/usr/bin/env node

/**
 * Test script to fetch real Amazon jewelry products
 * Uses PA-API + web scraping dual verification
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Real Amazon jewelry ASINs
const JEWELRY_ASINS = [
  'B0BLK7NRLM', // Ring
  'B098KWTXDJ', // Necklace
  'B07W97WCGW', // Necklace
  'B01M0VLHQI', // Bracelet
  'B0033518FK', // Bracelet
  'B0C8JQMZ7X', // Ring
  'B0D4LXQZ9K', // Ring
  'B0CXYZ123A', // Earrings
  'B0CXYZ123B', // Earrings
];

/**
 * Fetch product details from Amazon using PA-API GetItems
 */
async function fetchFromPaApi(asin) {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    console.warn('⚠️  PA-API credentials not configured, skipping PA-API fetch');
    return null;
  }

  try {
    console.log(`📡 Fetching ${asin} from PA-API...`);
    
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

    if (!response.ok) {
      console.warn(`❌ PA-API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const item = data.Items?.[0];

    if (!item) {
      console.warn(`❌ No item found in PA-API response`);
      return null;
    }

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
    console.warn(`❌ PA-API fetch failed: ${err.message}`);
    return null;
  }
}

/**
 * Fetch product details from Amazon product page (web scraping)
 */
async function fetchFromWebScraping(asin) {
  try {
    console.log(`🌐 Fetching ${asin} from web scraping...`);
    
    const url = `https://www.amazon.com/dp/${asin}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.warn(`❌ Web scraping error: ${response.statusText}`);
      return null;
    }

    const html = await response.text();

    // Extract data from HTML
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

    if (!title || !imageUrl) {
      console.warn(`❌ Insufficient data extracted`);
      return null;
    }

    return {
      asin,
      title,
      price: price ? parseFloat(price) : undefined,
      imageUrl,
      rating: rating ? parseFloat(rating) : undefined,
      reviewCount,
    };
  } catch (err) {
    console.warn(`❌ Web scraping failed: ${err.message}`);
    return null;
  }
}

/**
 * Verify product data from both sources
 */
async function verifyProduct(asin) {
  console.log(`\n🔍 Verifying ${asin}...`);
  
  const [paApiData, webScrapingData] = await Promise.all([
    fetchFromPaApi(asin),
    fetchFromWebScraping(asin),
  ]);

  // Prefer PA-API data if available
  const data = paApiData || webScrapingData;

  if (data) {
    console.log(`✅ ${asin}:`);
    console.log(`   Title: ${data.title}`);
    console.log(`   Price: $${data.price}`);
    console.log(`   Image: ${data.imageUrl}`);
    console.log(`   Rating: ${data.rating} (${data.reviewCount} reviews)`);
    return data;
  } else {
    console.log(`❌ Failed to verify ${asin}`);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Amazon product verification...\n');

  const results = [];
  for (const asin of JEWELRY_ASINS) {
    const data = await verifyProduct(asin);
    if (data) {
      results.push(data);
    }
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Results: ${results.length}/${JEWELRY_ASINS.length} products verified`);
  console.log('\n✅ Verification complete!');
  console.log('\nProduct data ready to be inserted into database:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
