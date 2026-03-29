#!/usr/bin/env node

/**
 * Fetch real jewelry products from Rainforest API
 * and generate SQL to populate the database
 */

import axios from 'axios';

const API_KEY = 'C490A97490CC4C138D143505B41BB0F0';
const BASE_URL = 'https://api.rainforestapi.com/request';
const AFFILIATE_TAG = '91791709-20';

const JEWELRY_SEARCHES = [
  'women gold necklace',
  'women silver bracelet',
  'women gold ring',
  'women diamond earrings',
  'luxury jewelry women',
  'pandora bracelet women',
  'swarovski necklace',
  'fossil jewelry women',
  'michael kors jewelry',
  'cartier jewelry',
];

async function searchProducts(keyword) {
  try {
    console.log(`🔍 Searching: "${keyword}"`);
    
    const params = {
      api_key: API_KEY,
      amazon_domain: 'amazon.com',
      type: 'search',
      search_term: keyword,
      max_results: 5,
    };

    const response = await axios.get(BASE_URL, { params, timeout: 30000 });
    
    if (response.data.search_results && response.data.search_results.length > 0) {
      console.log(`   ✅ Found ${response.data.search_results.length} products`);
      return response.data.search_results;
    } else {
      console.log('   ⚠️  No results');
      return [];
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }
}

function generateAffiliateLink(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
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
  if (titleLower.includes('watch')) return 'other';
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
  console.log('\n🚀 Fetching real jewelry products from Rainforest API...\n');
  
  const allProducts = [];
  const seenASINs = new Set();
  
  for (const keyword of JEWELRY_SEARCHES) {
    const products = await searchProducts(keyword);
    
    for (const product of products) {
      if (product.asin && !seenASINs.has(product.asin)) {
        seenASINs.add(product.asin);
        allProducts.push(product);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Total unique products: ${allProducts.length}\n`);
  
  if (allProducts.length === 0) {
    console.log('❌ No products found');
    process.exit(1);
  }
  
  // Generate SQL
  let sql = 'DELETE FROM products;\n\n';
  sql += 'INSERT INTO products (asin, title, brand, category, metalType, price, originalPrice, imageUrl, affiliateUrl, amazonRating, reviewCount, isFeatured, isActive, createdAt, updatedAt) VALUES\n';
  
  const productsToInsert = allProducts.slice(0, 20);
  const values = productsToInsert.map((product, index) => {
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
  console.log(`\n📌 Products to insert: ${productsToInsert.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
