#!/usr/bin/env node

/**
 * Parse Classic Jewelry JSON and load into database
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

const jsonFilePath = '/home/ubuntu/upload/pasted_content_7.txt';
const affiliateTag = '91791709-20';

let dbConfig = process.env.DATABASE_URL || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jewelry_affiliate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
};

function detectCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('necklace') || lower.includes('pendant')) return 'necklaces';
  if (lower.includes('bracelet') || lower.includes('bangle') || lower.includes('anklet')) return 'bracelets';
  if (lower.includes('ring')) return 'rings';
  if (lower.includes('earring')) return 'earrings';
  if (lower.includes('box') || lower.includes('organizer') || lower.includes('storage')) return 'other';
  if (lower.includes('cleaner') || lower.includes('cleaning') || lower.includes('care')) return 'other';
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
    console.log(`📂 Reading JSON file: ${jsonFilePath}`);
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(jsonData);

    const sourceArray = data.category_results || data.products || [];
    
    if (sourceArray.length === 0) {
      console.error('❌ No products found in JSON');
      process.exit(1);
    }

    console.log(`📦 Found ${sourceArray.length} products in JSON\n`);

    const products = [];
    const seenASINs = new Set();
    let skipped = 0;
    
    for (const product of sourceArray) {
      if (!product.asin || !product.image) {
        skipped++;
        continue;
      }

      if (seenASINs.has(product.asin)) {
        skipped++;
        continue;
      }

      const price = typeof product.price === 'object' ? product.price.value : product.price;
      if (!price || isNaN(price)) {
        skipped++;
        continue;
      }

      seenASINs.add(product.asin);
      
      products.push({
        asin: product.asin,
        title: product.title || 'Jewelry Product',
        brand: product.brand || 'Premium',
        category: detectCategory(product.title),
        metalType: detectMetalType(product.title),
        price: parseFloat(price),
        originalPrice: product.price?.list_price 
          ? parseFloat(product.price.list_price.toString().replace('$', ''))
          : parseFloat(price) * 1.2,
        imageUrl: product.image,
        affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${affiliateTag}`,
        amazonRating: parseFloat(product.rating) || 4.5,
        reviewCount: parseInt(product.ratings_total) || 0,
        isFeatured: products.length < 5,
      });

      if (products.length % 10 === 0) {
        process.stdout.write(`✅ Processed ${products.length} products...\r`);
      }
    }

    console.log(`\n✅ Processed ${products.length} valid products (skipped ${skipped})\n`);

    if (products.length === 0) {
      console.error('❌ No valid products found after filtering');
      process.exit(1);
    }

    // Parse DATABASE_URL if string
    let connConfig = dbConfig;
    if (typeof dbConfig === 'string') {
      connConfig = dbConfig;
    }
    const connection = await mysql.createConnection(connConfig);

    try {
      // Get current product count
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM products');
      const currentCount = countResult[0].total;
      console.log(`📊 Current database has ${currentCount} products\n`);
      
      // Insert products (don't clear, merge with existing)
      let inserted = 0;
      for (const product of products) {
        const query = `
          INSERT INTO products (
            asin, title, brand, category, metalType, price, originalPrice,
            imageUrl, affiliateUrl, amazonRating, reviewCount, isFeatured,
            isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            originalPrice = VALUES(originalPrice),
            amazonRating = VALUES(amazonRating),
            reviewCount = VALUES(reviewCount),
            updatedAt = NOW()
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
          1,
        ];

        try {
          await connection.execute(query, values);
          inserted++;
          if (inserted % 10 === 0) {
            process.stdout.write(`💾 Inserted ${inserted}/${products.length} products...\r`);
          }
        } catch (err) {
          if (err.code !== 'ER_DUP_ENTRY') {
            throw err;
          }
        }
      }

      const [newCountResult] = await connection.execute('SELECT COUNT(*) as total FROM products');
      const newCount = newCountResult[0].total;
      console.log(`\n🎉 Successfully inserted ${inserted} Classic jewelry products!`);
      console.log(`📊 Total products in database: ${newCount}\n`);
      
    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
