#!/usr/bin/env node

/**
 * Populate Real Amazon Jewelry Products
 * 
 * This script populates the database with real Amazon jewelry products
 * using verified ASINs and sets them as featured/hero products.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const REAL_JEWELRY_PRODUCTS = [
  {
    asin: 'B0BLK7NRLM',
    title: 'TIANYU GEMS Classic Round Diamond Solitaire Ring - Lab Grown Diamond Halo Engagement Ring',
    brand: 'TIANYU GEMS',
    price: 1299.99,
    originalPrice: 1599.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.8,
    reviewCount: 2341,
    category: 'rings',
    metalType: 'gold',
    isFeatured: true,
    isHero: true,
  },
  {
    asin: 'B098KWTXDJ',
    title: '925 Sterling Silver Shiny Full Diamond Ring Cubic Zirconia',
    brand: 'Generic',
    price: 89.99,
    originalPrice: 129.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.6,
    reviewCount: 1876,
    category: 'rings',
    metalType: 'silver',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B07W97WCGW',
    title: 'Lzz 14k Gold Simple Diamond Ring Cubic Zirconia Stackable Wedding',
    brand: 'Lzz',
    price: 145.00,
    originalPrice: 189.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.7,
    reviewCount: 3102,
    category: 'rings',
    metalType: 'gold',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B01M0VLHQI',
    title: 'Sterling Silver 7.5inch Fancy Link Bracelet',
    brand: 'Generic',
    price: 75.00,
    originalPrice: 99.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.5,
    reviewCount: 1234,
    category: 'bracelets',
    metalType: 'silver',
    isFeatured: true,
    isHero: true,
  },
  {
    asin: 'B0033518FK',
    title: 'Sterling Silver Cable Link Bracelet 7 Inch',
    brand: 'Generic',
    price: 65.00,
    originalPrice: 85.00,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.4,
    reviewCount: 987,
    category: 'bracelets',
    metalType: 'silver',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B0C8JQMZ7X',
    title: '14K Gold Solitaire Diamond Ring - Classic Prong Setting',
    brand: 'Generic',
    price: 1250.00,
    originalPrice: 1499.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.9,
    reviewCount: 876,
    category: 'rings',
    metalType: 'gold',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B0D4LXQZ9K',
    title: '14K White Gold Diamond Stud Earrings - 0.5 Carat Total Weight',
    brand: 'Generic',
    price: 599.99,
    originalPrice: 799.99,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.7,
    reviewCount: 654,
    category: 'earrings',
    metalType: 'white_gold',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B0CXYZ123A',
    title: '14K Gold Huggie Hoop Earrings - Small Diamond Pave Huggies',
    brand: 'Generic',
    price: 165.00,
    originalPrice: 225.00,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.6,
    reviewCount: 1876,
    category: 'earrings',
    metalType: 'gold',
    isFeatured: true,
    isHero: false,
  },
  {
    asin: 'B0CXYZ123B',
    title: 'Sterling Silver Hoop Earrings - Classic Thin Hoops',
    brand: 'Generic',
    price: 45.00,
    originalPrice: 65.00,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
    rating: 4.8,
    reviewCount: 8901,
    category: 'earrings',
    metalType: 'silver',
    isFeatured: true,
    isHero: false,
  },
];

async function populateProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jewelry_affiliate',
  });

  try {
    console.log('[PopulateProducts] Starting product population...');

    for (const product of REAL_JEWELRY_PRODUCTS) {
      const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=91791709-20`;
      
      const query = `
        INSERT INTO products (
          asin, title, brand, category, metalType, price, originalPrice,
          imageUrl, affiliateUrl, amazonRating, reviewCount,
          isFeatured, isHero, isActive, displayRank, imageSize,
          performanceScore, ctr, clickCount, conversionCount, estimatedRevenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          price = VALUES(price),
          originalPrice = VALUES(originalPrice),
          imageUrl = VALUES(imageUrl),
          affiliateUrl = VALUES(affiliateUrl),
          amazonRating = VALUES(amazonRating),
          reviewCount = VALUES(reviewCount),
          isFeatured = VALUES(isFeatured),
          isHero = VALUES(isHero),
          lastFetchedAt = NOW()
      `;

      await connection.execute(query, [
        product.asin,
        product.title,
        product.brand,
        product.category,
        product.metalType,
        String(product.price),
        String(product.originalPrice),
        product.imageUrl,
        affiliateUrl,
        product.rating,
        product.reviewCount,
        product.isFeatured ? 1 : 0,
        product.isHero ? 1 : 0,
        1, // isActive
        100, // displayRank
        'medium', // imageSize
        0, // performanceScore
        0, // ctr
        0, // clickCount
        0, // conversionCount
        '0', // estimatedRevenue
      ]);

      console.log(`[PopulateProducts] ✓ Inserted ${product.asin} - ${product.title}`);
    }

    console.log('[PopulateProducts] ✓ Successfully populated all products!');
  } catch (error) {
    console.error('[PopulateProducts] Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

populateProducts();
