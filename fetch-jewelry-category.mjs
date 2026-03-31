#!/usr/bin/env node

/**
 * Fetch jewelry products from Rainforest API using correct category ID
 * Category: 3880961 (Fine Jewelry)
 */

import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.RAINFOREST_API_KEY || 'C490A97490CC4C138D143505B41BB0F0';
const BASE_URL = 'https://api.rainforestapi.com/request';
const AFFILIATE_TAG = '91791709-20';
const JEWELRY_CATEGORY_ID = '3880961';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jewelry_affiliate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
};

// Parse DATABASE_URL if provided
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig.host = url.hostname;
  dbConfig.user = url.username;
  dbConfig.password = url.password;
  dbConfig.database = url.pathname.slice(1);
}

function detectCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('necklace') || lower.includes('pendant')) return 'necklaces';
  if (lower.includes('bracelet') || lower.includes('bangle')) return 'bracelets';
  if (lower.includes('ring')) return 'rings';
  if (lower.includes('earring')) return 'earrings';
  return 'other';
}

function detectMetalType(title) {
  const lower = title.toLowerCase();
  if (lower.includes('rose gold')) return 'rose_gold';
  if (lower.includes('white gold')) return 'white_gold';
  if (lower.includes('yellow gold') || (lower.includes('gold') && !lower.includes('white') && !lower.includes('rose'))) {
    return 'gold';
  }
  if (lower.includes('silver')) return 'silver';
  if (lower.includes('platinum')) return 'platinum';
  return 'gold';
}

async function validateImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  try {
    const response = await axios.head(imageUrl, {
      timeout: 5000,
      maxRedirects: 5,
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('image')) {
      return false;
    }

    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength === 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function fetchJewelryCategory(page = 1, maxPages = 3) {
  try {
    console.log(`\n🔍 Fetching jewelry category page ${page}...`);

    const params = {
      api_key: API_KEY,
      type: 'category',
      amazon_domain: 'amazon.com',
      category_id: JEWELRY_CATEGORY_ID,
      sort_by: 'bestseller_rankings',
      currency: 'usd',
      associate_id: AFFILIATE_TAG,
      page: String(page),
      output: 'json',
      max_page: String(maxPages),
    };

    const response = await axios.get(BASE_URL, { params, timeout: 30000 });

    if (!response.data.products || response.data.products.length === 0) {
      console.log(`   ⏭️  No products on page ${page}`);
      return [];
    }

    console.log(`   ✅ Found ${response.data.products.length} products`);
    return response.data.products;
  } catch (error) {
    console.error(`   ❌ Error fetching page ${page}: ${error.message}`);
    return [];
  }
}

async function fetchAllJewelry(maxPages = 3) {
  const allProducts = [];
  const seenASINs = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const products = await fetchJewelryCategory(page, maxPages);

    for (const product of products) {
      if (!product.asin || !product.image || seenASINs.has(product.asin)) {
        continue;
      }

      // Validate image
      console.log(`   🖼️  Validating image for "${product.title}"...`);
      const isImageValid = await validateImageUrl(product.image);

      if (!isImageValid) {
        console.log(`      ❌ Image invalid`);
        continue;
      }

      seenASINs.add(product.asin);

      const price = typeof product.price === 'object' ? product.price.value : product.price;
      if (!price || isNaN(price)) {
        continue;
      }

      allProducts.push({
        asin: product.asin,
        title: product.title || 'Jewelry Product',
        brand: product.brand || 'Premium',
        category: detectCategory(product.title),
        metalType: detectMetalType(product.title),
        price: price,
        originalPrice: product.price?.list_price ? parseFloat(product.price.list_price.replace('$', '')) : price * 1.2,
        imageUrl: product.image,
        affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
        amazonRating: product.rating || 4.5,
        reviewCount: product.ratings_total || 0,
        isFeatured: allProducts.length < 5,
      });

      console.log(`      ✅ Added: ${product.title}`);
    }

    // Rate limiting
    if (page < maxPages) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return allProducts;
}

async function populateDatabase(products) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Clear existing products
    console.log('\n🗑️  Clearing existing products...');
    await connection.execute('DELETE FROM products');

    // Insert new products
    console.log(`💾 Inserting ${products.length} products...\n`);

    for (const product of products) {
      const query = `
        INSERT INTO products (
          asin, title, brand, category, metalType, price, originalPrice,
          imageUrl, affiliateUrl, amazonRating, reviewCount, isFeatured,
          isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        product.asin,
        product.title,
        product.brand,
        product.category,
        product.metalType,
        String(product.price),
        String(product.originalPrice),
        product.imageUrl,
        product.affiliateUrl,
        product.amazonRating,
        product.reviewCount,
        product.isFeatured ? 1 : 0,
        1, // isActive
      ];

      await connection.execute(query, values);
    }

    console.log(`\n🎉 Successfully inserted ${products.length} jewelry products!`);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('🚀 Fetching jewelry products from Rainforest API...');
    console.log(`📦 Category ID: ${JEWELRY_CATEGORY_ID} (Fine Jewelry)`);
    console.log(`🔖 Affiliate Tag: ${AFFILIATE_TAG}\n`);

    const products = await fetchAllJewelry(3);

    if (products.length === 0) {
      console.error('\n❌ No valid jewelry products found');
      process.exit(1);
    }

    console.log(`\n✅ Fetched ${products.length} jewelry products`);

    await populateDatabase(products);

    console.log('\n✨ All done! Your jewelry products are ready.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
