#!/usr/bin/env node

/**
 * Standalone script to fetch real jewelry products from Rainforest API
 * and populate the database with working affiliate links
 */

import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = 'C490A97490CC4C138D143505B41BB0F0';
const BASE_URL = 'https://api.rainforestapi.com/request';
const AFFILIATE_TAG = '91791709-20';

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

function extractPrice(priceStr) {
  if (!priceStr) return 99.99;
  if (typeof priceStr === 'number') return priceStr;
  if (typeof priceStr !== 'string') return 99.99;
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 99.99;
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

async function searchProducts(searchTerm, maxResults = 10, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Searching for "${searchTerm}" (attempt ${attempt}/${retries})`);

      const params = {
        api_key: API_KEY,
        amazon_domain: 'amazon.com',
        type: 'search',
        search_term: searchTerm,
        max_results: maxResults,
      };

      const response = await axios.get(BASE_URL, {
        params,
        timeout: 30000,
      });

      if (response.data.search_results && Array.isArray(response.data.search_results)) {
        console.log(`✅ Found ${response.data.search_results.length} products`);
        return response.data.search_results;
      } else {
        console.log('⚠️ No search results in response');
        return [];
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed: ${error.message}`);

      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed to search products after ${retries} attempts`);
}

async function fetchJewelryProducts(maxProducts = 20) {
  const searchTerms = [
    'women gold necklace',
    'women silver bracelet',
    'women gold ring',
    'women diamond earrings',
    'luxury jewelry women',
    'pandora bracelet',
    'swarovski jewelry',
    'fossil jewelry women',
    'michael kors jewelry',
  ];

  const allProducts = [];
  const seenASINs = new Set();

  for (const term of searchTerms) {
    if (allProducts.length >= maxProducts) break;

    try {
      const results = await searchProducts(term, 5);

      for (const product of results) {
        if (product.asin && !seenASINs.has(product.asin) && allProducts.length < maxProducts) {
          seenASINs.add(product.asin);
          const isFeatured = allProducts.length < 5;
          
          allProducts.push({
            asin: product.asin,
            title: product.title || 'Jewelry Product',
            brand: product.brand || 'Premium',
            category: detectCategory(product.title),
            metalType: detectMetalType(product.title),
            price: extractPrice(product.price),
            originalPrice: extractPrice(product.original_price) || extractPrice(product.price) * 1.2,
            imageUrl: product.image || 'https://via.placeholder.com/300x300?text=Jewelry',
            affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
            amazonRating: product.rating || 4.5,
            reviewCount: product.review_count || 0,
            isFeatured,
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error searching for "${term}": ${error.message}`);
      continue;
    }
  }

  if (allProducts.length === 0) {
    throw new Error('No products found from Rainforest API');
  }

  return allProducts;
}

async function populateDatabase(products) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await connection.execute('DELETE FROM products');

    // Insert new products
    console.log(`💾 Inserting ${products.length} products...`);
    
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
      console.log(`✅ Inserted: ${product.title}`);
    }

    console.log(`\n🎉 Successfully populated database with ${products.length} real jewelry products!`);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('🚀 Starting Rainforest API product fetch...\n');
    
    const products = await fetchJewelryProducts(20);
    console.log(`\n✅ Fetched ${products.length} products from Rainforest API\n`);
    
    await populateDatabase(products);
    
    console.log('\n✨ All done! Your jewelry affiliate site now has real Amazon products with working affiliate links.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
