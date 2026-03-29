/**
 * Rainforest API SDK Wrapper
 * Provides methods to search for products and fetch product details
 * with affiliate link generation
 */

import axios from 'axios';

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY || '7F4D9C23710F4304A980CD94CAD644E2';
const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';
const AMAZON_AFFILIATE_TAG = '91791709-20';

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

interface SearchResponse {
  search_results?: RainforestProduct[];
  product?: RainforestProduct;
}

/**
 * Search for products on Amazon
 */
export async function searchProducts(
  keyword: string,
  limit: number = 10
): Promise<RainforestProduct[]> {
  try {
    const params = {
      api_key: RAINFOREST_API_KEY,
      amazon_domain: 'amazon.com',
      type: 'search',
      search_term: keyword,
      max_results: limit,
    };

    const response = await axios.get<SearchResponse>(RAINFOREST_BASE_URL, { params });
    
    if (response.data.search_results) {
      return response.data.search_results.map(product => ({
        ...product,
        link: generateAffiliateLink(product.asin),
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error searching for "${keyword}":`, error);
    return [];
  }
}

/**
 * Get product details by ASIN
 */
export async function getProductByASIN(asin: string): Promise<RainforestProduct | null> {
  try {
    const params = {
      api_key: RAINFOREST_API_KEY,
      amazon_domain: 'amazon.com',
      type: 'product',
      asin: asin,
    };

    const response = await axios.get<SearchResponse>(RAINFOREST_BASE_URL, { params });
    
    if (response.data.product) {
      return {
        ...response.data.product,
        link: generateAffiliateLink(response.data.product.asin),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching product ${asin}:`, error);
    return null;
  }
}

/**
 * Generate affiliate link for a product
 */
export function generateAffiliateLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

/**
 * Extract price as number
 */
export function extractPrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  
  const match = priceStr.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  
  return null;
}

/**
 * Categorize product based on title
 */
export function categorizeProduct(
  title: string
): 'necklaces' | 'bracelets' | 'rings' | 'earrings' | 'pendants' | 'sets' | 'other' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('necklace') || titleLower.includes('pendant')) return 'necklaces';
  if (titleLower.includes('bracelet') || titleLower.includes('bangle')) return 'bracelets';
  if (titleLower.includes('ring')) return 'rings';
  if (titleLower.includes('earring')) return 'earrings';
  if (titleLower.includes('pendant')) return 'pendants';
  if (titleLower.includes('set')) return 'sets';
  
  return 'other';
}

/**
 * Detect metal type from title
 */
export function detectMetalType(
  title: string
): 'gold' | 'silver' | 'rose_gold' | 'white_gold' | 'platinum' | 'mixed' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('rose gold')) return 'rose_gold';
  if (titleLower.includes('white gold')) return 'white_gold';
  if (titleLower.includes('yellow gold') || (titleLower.includes('gold') && !titleLower.includes('white') && !titleLower.includes('rose'))) {
    return 'gold';
  }
  if (titleLower.includes('silver')) return 'silver';
  if (titleLower.includes('platinum')) return 'platinum';
  if (titleLower.includes('mixed metal')) return 'mixed';
  
  return 'gold'; // default
}
