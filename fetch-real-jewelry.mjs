#!/usr/bin/env node

/**
 * Fetch real jewelry products from Rainforest API
 * and generate SQL to populate the database
 */

import axios from 'axios';

const RAINFOREST_API_KEY = '7F4D9C23710F4304A980CD94CAD644E2';
const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';
const AMAZON_AFFILIATE_TAG = '91791709-20';

// Jewelry search terms
const JEWELRY_SEARCHES = [
  'women gold necklace',
  'women silver bracelet',
  'women gold ring',
  'women diamond earrings',
  'luxury jewelry women',
  'pandora bracelet',
  'swarovski necklace',
  'fossil jewelry women',
  'michael kors jewelry',
  'cartier jewelry women',
];

async function searchProducts(keyword) {
  try {
    console.log(`\n🔍 Searching for: "${keyword}"`);
    
    const params = {
      api_key: RAINFOREST_API_KEY,
      amazon_domain: 'amazon.com',
      type: 'search',
      search_term: keyword,
      max_results: 5,
    };

    const response = await axios.get(RAINFOREST_BASE_URL, { params });
    
    if (response.data.search_results && response.data.search_results.length > 0) {
      console.log(`✅ Found ${response.data.search_results.length} products`);
      return response.data.search_results;
    } else {
      console.log('⚠️  No results found');
      return [];
    }
  } catch (error) {
    console.error(`❌ Error searching for "${keyword}":`, error.message);
    return [];
  }
}

function generateAffiliateLink(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

function extractPrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function categorizeProduct(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('necklace') || titleLower.includes('pendant')) return 'necklaces';
  if (titleLower.includes('bracelet') || titleLower.includes('bangle')) return 'bracelets';
  if (titleLower.includes('ring')) return 'rings';
  if (titleLower.includes('earring')) return 'earrings';
  if (titleLower.includes('set')) return 'sets';
  
  return 'other';
}

function detectMetalType(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('rose gold')) return 'rose_gold';
  if (titleLower.includes('white gold')) return 'white_gold';
  if (titleLower.includes('yellow gold') || (titleLower.includes('gold') && !titleLower.includes('white') && !titleLower.includes('rose'))) {
    return 'gold';
  }
  if (titleLower.includes('silver')) return 'silver';
  if (titleLower.includes('platinum')) return 'platinum';
  
  return 'gold';
}

async function main() {
  console.log('🚀 Starting Rainforest API jewelry product fetch...\n');
  
  const allProducts = [];
  const seenASINs = new Set();
  
  // Search for products
  for (const keyword of JEWELRY_SEARCHES) {
    const products = await searchProducts(keyword);
    
    for (const product of products) {
      if (product.asin && !seenASINs.has(product.asin)) {
        seenASINs.add(product.asin);
        allProducts.push(product);
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n\n📊 Total unique products found: ${allProducts.length}\n`);
  
  if (allProducts.length === 0) {
    console.log('❌ No products found. Check your API key and internet connection.');
    process.exit(1);
  }
  
  // Generate SQL
  let sql = 'DELETE FROM products;\n\n';
  sql += 'INSERT INTO products (asin, title, brand, category, metalType, price, originalPrice, imageUrl, affiliateUrl, amazonRating, reviewCount, isFeatured, isActive, createdAt, updatedAt) VALUES\n';
  
  const values = allProducts.slice(0, 20).map((product, index) => {
    const price = extractPrice(product.price) || 99.99;
    const originalPrice = extractPrice(product.original_price) || price * 1.2;
    const category = categorizeProduct(product.title);
    const metalType = detectMetalType(product.title);
    const rating = product.rating || 4.5;
    const reviewCount = product.review_count || 100;
    const isFeatured = index < 5 ? 1 : 0;
    const imageUrl = product.image || 'https://via.placeholder.com/300x300?text=Jewelry';
    const affiliateUrl = generateAffiliateLink(product.asin);
    const now = new Date().toISOString();
    
    return `(
      '${product.asin}',
      '${product.title.replace(/'/g, "''")}',
      '${(product.brand || 'Premium').replace(/'/g, "''")}',
      '${category}',
      '${metalType}',
      ${price},
      ${originalPrice},
      '${imageUrl}',
      '${affiliateUrl}',
      ${rating},
      ${reviewCount},
      ${isFeatured},
      1,
      '${now}',
      '${now}'
    )`;
  });
  
  sql += values.join(',\n') + ';\n';
  
  console.log('📝 Generated SQL:\n');
  console.log(sql);
  
  console.log('\n✅ SQL generated successfully!');
  console.log(`\n📌 Total products to insert: ${Math.min(20, allProducts.length)}`);
  console.log('\n💡 Copy the SQL above and run it in your database.\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
