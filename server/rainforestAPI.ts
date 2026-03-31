/**
 * Rainforest API Service
 * Handles product search and data extraction with proper error handling
 */

import axios, { AxiosError } from 'axios';

const API_KEY = process.env.RAINFOREST_API_KEY || '';
const BASE_URL = 'https://api.rainforestapi.com/request';
const AFFILIATE_TAG = process.env.AMAZON_PARTNER_TAG || '91791709-20';

interface RainforestProduct {
  asin: string;
  title: string;
  brand?: string;
  price?: string;
  original_price?: string;
  rating?: number;
  review_count?: number;
  image?: string;
  link?: string;
}

export interface ProcessedProduct {
  asin: string;
  title: string;
  brand: string;
  category: 'necklaces' | 'bracelets' | 'rings' | 'earrings' | 'other';
  metalType: 'gold' | 'silver' | 'rose_gold' | 'white_gold' | 'platinum';
  price: number;
  originalPrice: number;
  imageUrl: string;
  affiliateUrl: string;
  amazonRating: number;
  reviewCount: number;
  isFeatured: boolean;
}

/**
 * Extract price from string like "$99.99"
 */
function extractPrice(priceStr?: string): number {
  if (!priceStr) return 99.99;
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 99.99;
}

/**
 * Detect product category from title
 */
function detectCategory(title: string): ProcessedProduct['category'] {
  const lower = title.toLowerCase();
  if (lower.includes('necklace') || lower.includes('pendant')) return 'necklaces';
  if (lower.includes('bracelet') || lower.includes('bangle')) return 'bracelets';
  if (lower.includes('ring')) return 'rings';
  if (lower.includes('earring')) return 'earrings';
  return 'other';
}

/**
 * Detect metal type from title
 */
function detectMetalType(title: string): ProcessedProduct['metalType'] {
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
 * Search for products on Amazon via Rainforest API
 */
export async function searchProducts(
  searchTerm: string,
  maxResults: number = 10,
  retries: number = 3
): Promise<RainforestProduct[]> {
  let lastError: AxiosError | Error | null = null;

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
      lastError = error as AxiosError | Error;
      console.error(`❌ Attempt ${attempt} failed: ${(error as Error).message}`);

      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed to search products after ${retries} attempts: ${lastError?.message}`);
}

/**
 * Process raw Rainforest product into database format
 */
export function processProduct(product: RainforestProduct, isFeatured: boolean = false): ProcessedProduct {
  const price = extractPrice(product.price);
  const originalPrice = extractPrice(product.original_price) || price * 1.2;

  return {
    asin: product.asin,
    title: product.title || 'Jewelry Product',
    brand: product.brand || 'Premium',
    category: detectCategory(product.title),
    metalType: detectMetalType(product.title),
    price,
    originalPrice,
    imageUrl: product.image || 'https://via.placeholder.com/300x300?text=Jewelry',
    affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
    amazonRating: product.rating || 4.5,
    reviewCount: product.review_count || 0,
    isFeatured,
  };
}

/**
 * Fetch and process jewelry products
 */
export async function fetchJewelryProducts(maxProducts: number = 20): Promise<ProcessedProduct[]> {
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

  const allProducts: ProcessedProduct[] = [];
  const seenASINs = new Set<string>();

  for (const term of searchTerms) {
    if (allProducts.length >= maxProducts) break;

    try {
      const results = await searchProducts(term, 5);

      for (const product of results) {
        if (product.asin && !seenASINs.has(product.asin) && allProducts.length < maxProducts) {
          seenASINs.add(product.asin);
          const isFeatured = allProducts.length < 5;
          allProducts.push(processProduct(product, isFeatured));
        }
      }

      // Rate limiting - wait between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error searching for "${term}": ${(error as Error).message}`);
      continue;
    }
  }

  if (allProducts.length === 0) {
    throw new Error('No products found from Rainforest API');
  }

  return allProducts;
}

/**
 * Generate SQL INSERT statement for products
 */
export function generateInsertSQL(products: ProcessedProduct[]): string {
  const now = new Date().toISOString();

  const values = products.map(p => {
    const title = p.title.replace(/'/g, "''");
    const brand = p.brand.replace(/'/g, "''");

    return `(
      '${p.asin}',
      '${title}',
      '${brand}',
      '${p.category}',
      '${p.metalType}',
      ${p.price},
      ${p.originalPrice},
      '${p.imageUrl}',
      '${p.affiliateUrl}',
      ${p.amazonRating},
      ${p.reviewCount},
      ${p.isFeatured ? 1 : 0},
      1,
      '${now}',
      '${now}'
    )`;
  });

  return `DELETE FROM products;

INSERT INTO products (
  asin,
  title,
  brand,
  category,
  metalType,
  price,
  originalPrice,
  imageUrl,
  affiliateUrl,
  amazonRating,
  reviewCount,
  isFeatured,
  isActive,
  createdAt,
  updatedAt
) VALUES
${values.join(',\n')};`;
}
