#!/usr/bin/env node

import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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

async function main() {
  try {
    // Read the JSON file
    const jsonData = fs.readFileSync('/home/ubuntu/upload/pasted_content_2.txt', 'utf-8');
    const data = JSON.parse(jsonData);

    // Use category_results array from jewelry category
    const sourceArray = data.category_results || [];
    
    if (sourceArray.length === 0) {
      console.error('❌ No products found in JSON');
      process.exit(1);
    }

    console.log(`📦 Found ${sourceArray.length} jewelry products in JSON\n`);

    // Filter and extract data
    const products = [];
    const seenASINs = new Set();
    
    for (const product of sourceArray) {
      if (!product.asin || !product.image) {
        console.log(`⏭️  Skipping "${product.title}" - missing required fields`);
        continue;
      }

      // Skip duplicates
      if (seenASINs.has(product.asin)) {
        console.log(`⏭️  Skipping "${product.title}" - duplicate ASIN`);
        continue;
      }

      // Extract price
      const price = typeof product.price === 'object' ? product.price.value : product.price;
      if (!price || isNaN(price)) {
        console.log(`⏭️  Skipping "${product.title}" - invalid price`);
        continue;
      }

      seenASINs.add(product.asin);
      
      products.push({
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
        isFeatured: products.length < 5,
      });

      console.log(`✅ Added: ${product.title}`);
    }

    if (products.length === 0) {
      console.error('\n❌ No valid jewelry products found');
      process.exit(1);
    }

    console.log(`\n💾 Inserting ${products.length} products into database...\n`);

    // Connect to database
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Clear existing products
      await connection.execute('DELETE FROM products');
      console.log('🗑️  Cleared existing products');

      // Insert new products
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
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
