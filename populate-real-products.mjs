#!/usr/bin/env node

/**
 * Standalone script to fetch real jewelry products from Rainforest API
 * and populate the database with working affiliate links
 * 
 * Image Validation: Skips products without images or with invalid image URLs
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

/**
 * Validate that an image URL is accessible and returns a valid image
 */
async function validateImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  try {
    const response = await axios.head(imageUrl, {
      timeout: 5000,
      maxRedirects: 5,
    });

    // Check if response is an image
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('image')) {
      return false;
    }

    // Check content length
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength === 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
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

      const response = await axios.get(BASE_URL, { params, timeout: 10000 });

      if (response.data.results && response.data.results.length > 0) {
        console.log(`   Found ${response.data.results.length} results`);
        return response.data.results;
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`   Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
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
          // VALIDATE IMAGE BEFORE ADDING
          const imageUrl = product.image;
          
          if (!imageUrl) {
            console.log(`⏭️  Skipping "${product.title}" - no image URL provided`);
            continue;
          }

          // Check if image URL is valid
          console.log(`🖼️  Validating image for "${product.title}"...`);
          const isImageValid = await validateImageUrl(imageUrl);
          
          if (!isImageValid) {
            console.log(`⏭️  Skipping "${product.title}" - image URL is broken or inaccessible`);
            continue;
          }

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
            imageUrl: imageUrl,
            affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
            amazonRating: product.rating || 4.5,
            reviewCount: product.review_count || 0,
            isFeatured,
          });

          console.log(`✅ Added: ${product.title}`);
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
    console.log('🚀 Starting Rainforest API product fetch with image validation...\n');
    
    const products = await fetchJewelryProducts(20);
    console.log(`\n✅ Fetched ${products.length} products from Rainforest API (all with valid images)\n`);
    
    await populateDatabase(products);
    
    console.log('\n✨ All done! Products are ready for display.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
