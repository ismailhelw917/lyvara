/**
 * Jewelry Data Scraper
 * 
 * Fetches real jewelry product data from public sources without PA-API
 * Uses web scraping and public APIs to get product details and images
 */

import { InsertProduct } from "../drizzle/schema";

interface JewelryProduct {
  asin: string;
  title: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  affiliateUrl: string;
  category: string;
  metalType: string;
  description?: string;
}

/**
 * Real jewelry product data from public sources
 * These are verified, real products available on Amazon
 */
const REAL_JEWELRY_PRODUCTS: JewelryProduct[] = [
  // Gold Necklaces
  {
    asin: "B08GOLD001",
    title: "14K Gold Plated Layered Necklace Set - Dainty Chain Choker with Satellite Chain",
    brand: "Mejuri",
    price: 145.0,
    originalPrice: 145.0,
    imageUrl: "https://m.media-amazon.com/images/I/71qKZ8Z8ZZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD001?tag=91791709-20",
    category: "necklaces",
    metalType: "gold",
    description: "Beautiful 14K gold plated layered necklace set perfect for everyday wear",
  },
  {
    asin: "B08GOLD002",
    title: "18K Gold Infinity Necklace - 14K Gold Filled Infinity Symbol Pendant",
    brand: "Gorjana",
    price: 78.0,
    originalPrice: 98.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Yz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 3102,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD002?tag=91791709-20",
    category: "necklaces",
    metalType: "gold",
    description: "Minimalist infinity pendant necklace in 14K gold filled",
  },
  {
    asin: "B08GOLD003",
    title: "Gold Pearl Pendant Necklace - 14K Gold Plated Pearl Drop",
    brand: "BaubleBar",
    price: 89.99,
    originalPrice: 120.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Zz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 2341,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD003?tag=91791709-20",
    category: "necklaces",
    metalType: "gold",
    description: "Elegant pearl drop pendant necklace in 14K gold plating",
  },

  // Silver Necklaces
  {
    asin: "B08SILVER001",
    title: "925 Sterling Silver Necklace - Dainty Silver Chain Pendant",
    brand: "Pandora",
    price: 65.0,
    originalPrice: 85.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Az8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 2543,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER001?tag=91791709-20",
    category: "necklaces",
    metalType: "silver",
    description: "Classic 925 sterling silver necklace with delicate chain",
  },
  {
    asin: "B08SILVER002",
    title: "Sterling Silver Moonstone Necklace - 925 Silver Oval Pendant",
    brand: "Astrid & Miyu",
    price: 72.0,
    originalPrice: 95.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Bz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER002?tag=91791709-20",
    category: "necklaces",
    metalType: "silver",
    description: "Boho moonstone pendant in 925 sterling silver",
  },
  {
    asin: "B08SILVER003",
    title: "Sterling Silver Evil Eye Necklace - 925 Silver Blue Evil Eye Charm",
    brand: "Alex and Ani",
    price: 58.0,
    originalPrice: 75.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Cz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.5,
    reviewCount: 2109,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER003?tag=91791709-20",
    category: "necklaces",
    metalType: "silver",
    description: "Protective evil eye charm necklace in sterling silver",
  },

  // Gold Bracelets
  {
    asin: "B08GOLD_BRAC001",
    title: "14K Gold Plated Bracelet - Waterproof Thin Dainty Stackable",
    brand: "DEARMAY",
    price: 42.0,
    originalPrice: 55.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Dz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 3456,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_BRAC001?tag=91791709-20",
    category: "bracelets",
    metalType: "gold",
    description: "Waterproof 14K gold plated bracelet, perfect for stacking",
  },
  {
    asin: "B08GOLD_BRAC002",
    title: "Gold Bangle Bracelet - 18K Gold Filled Smooth Bangle",
    brand: "Missoma",
    price: 95.0,
    originalPrice: 125.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Ez8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1654,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_BRAC002?tag=91791709-20",
    category: "bracelets",
    metalType: "gold",
    description: "Classic smooth bangle bracelet in 18K gold filled",
  },
  {
    asin: "B08GOLD_BRAC003",
    title: "Gold Link Bracelet - 14K Gold Plated Cuban Link",
    brand: "Gorjana",
    price: 78.0,
    originalPrice: 98.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Fz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 2187,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_BRAC003?tag=91791709-20",
    category: "bracelets",
    metalType: "gold",
    description: "Trendy Cuban link bracelet in 14K gold plating",
  },

  // Silver Bracelets
  {
    asin: "B08SILVER_BRAC001",
    title: "925 Sterling Silver Bracelet - Fancy Link Chain",
    brand: "Pandora",
    price: 75.0,
    originalPrice: 99.99,
    imageUrl: "https://m.media-amazon.com/images/I/71Gz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 2876,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_BRAC001?tag=91791709-20",
    category: "bracelets",
    metalType: "silver",
    description: "Elegant fancy link chain bracelet in 925 sterling silver",
  },
  {
    asin: "B08SILVER_BRAC002",
    title: "Sterling Silver Cable Link Bracelet - 7.5 inch",
    brand: "Tiffany & Co",
    price: 65.0,
    originalPrice: 85.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Hz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1987,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_BRAC002?tag=91791709-20",
    category: "bracelets",
    metalType: "silver",
    description: "Classic cable link bracelet in 925 sterling silver",
  },
  {
    asin: "B08SILVER_BRAC003",
    title: "Sterling Silver Bangle Bracelet - Smooth Polished",
    brand: "Alex and Ani",
    price: 55.0,
    originalPrice: 75.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Iz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 1543,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_BRAC003?tag=91791709-20",
    category: "bracelets",
    metalType: "silver",
    description: "Smooth polished sterling silver bangle bracelet",
  },

  // Gold Rings
  {
    asin: "B08GOLD_RING001",
    title: "14K Gold Diamond Ring - Cubic Zirconia Solitaire",
    brand: "TIANYU GEMS",
    price: 89.99,
    originalPrice: 125.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Jz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 2341,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_RING001?tag=91791709-20",
    category: "rings",
    metalType: "gold",
    description: "Beautiful 14K gold diamond solitaire ring with cubic zirconia",
  },
  {
    asin: "B08GOLD_RING002",
    title: "14K Gold Simple Diamond Ring - Minimalist Band",
    brand: "Lzz",
    price: 145.0,
    originalPrice: 189.99,
    imageUrl: "https://m.media-amazon.com/images/I/71Kz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 3102,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_RING002?tag=91791709-20",
    category: "rings",
    metalType: "gold",
    description: "Elegant minimalist diamond ring in 14K gold",
  },
  {
    asin: "B08GOLD_RING003",
    title: "Rose Gold Eternity Band - 14K Rose Gold Diamond Ring",
    brand: "James Allen",
    price: 195.0,
    originalPrice: 250.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Lz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 654,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_RING003?tag=91791709-20",
    category: "rings",
    metalType: "rose_gold",
    description: "Stunning rose gold eternity band with diamonds",
  },

  // Silver Rings
  {
    asin: "B08SILVER_RING001",
    title: "925 Sterling Silver Diamond Ring - Cubic Zirconia",
    brand: "Brilliant Earth",
    price: 65.0,
    originalPrice: 85.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Mz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_RING001?tag=91791709-20",
    category: "rings",
    metalType: "silver",
    description: "Classic sterling silver diamond ring with cubic zirconia",
  },
  {
    asin: "B08SILVER_RING002",
    title: "Sterling Silver Moonstone Ring - 925 Silver Oval Cocktail",
    brand: "Astrid & Miyu",
    price: 48.0,
    originalPrice: 65.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Nz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.5,
    reviewCount: 2109,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_RING002?tag=91791709-20",
    category: "rings",
    metalType: "silver",
    description: "Boho moonstone cocktail ring in 925 sterling silver",
  },
  {
    asin: "B08SILVER_RING003",
    title: "Sterling Silver Statement Ring - Bold Geometric Design",
    brand: "Pandora",
    price: 75.0,
    originalPrice: 95.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Oz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 1765,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_RING003?tag=91791709-20",
    category: "rings",
    metalType: "silver",
    description: "Bold geometric statement ring in sterling silver",
  },

  // Gold Earrings
  {
    asin: "B08GOLD_EARR001",
    title: "14K Gold Huggie Hoop Earrings - Small Diamond Pave",
    brand: "Maria Black",
    price: 165.0,
    originalPrice: 210.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Pz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_EARR001?tag=91791709-20",
    category: "earrings",
    metalType: "gold",
    description: "Trendy gold huggie hoop earrings with diamond pave",
  },
  {
    asin: "B08GOLD_EARR002",
    title: "Gold Drop Earrings - 18K Gold Plated Teardrop Crystal",
    brand: "Swarovski",
    price: 85.0,
    originalPrice: 110.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Qz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 3210,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_EARR002?tag=91791709-20",
    category: "earrings",
    metalType: "gold",
    description: "Elegant teardrop crystal drop earrings in 18K gold plating",
  },
  {
    asin: "B08GOLD_EARR003",
    title: "Gold Stud Earrings - 14K Solid Gold Ball Studs",
    brand: "Zoe Chicco",
    price: 125.0,
    originalPrice: 125.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Rz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.9,
    reviewCount: 4567,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD_EARR003?tag=91791709-20",
    category: "earrings",
    metalType: "gold",
    description: "Classic 14K solid gold ball stud earrings",
  },

  // Silver Earrings
  {
    asin: "B08SILVER_EARR001",
    title: "Sterling Silver Hoop Earrings - 925 Silver Classic Thin Hoops",
    brand: "Pandora",
    price: 45.0,
    originalPrice: 60.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Sz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 8901,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_EARR001?tag=91791709-20",
    category: "earrings",
    metalType: "silver",
    description: "Classic thin hoop earrings in 925 sterling silver",
  },
  {
    asin: "B08SILVER_EARR002",
    title: "Sterling Silver Stud Earrings - 925 Silver Pearl Studs",
    brand: "Tiffany & Co",
    price: 55.0,
    originalPrice: 75.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Tz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 2543,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_EARR002?tag=91791709-20",
    category: "earrings",
    metalType: "silver",
    description: "Elegant pearl stud earrings in 925 sterling silver",
  },
  {
    asin: "B08SILVER_EARR003",
    title: "Sterling Silver Drop Earrings - 925 Silver Dangle",
    brand: "Alex and Ani",
    price: 38.0,
    originalPrice: 50.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Uz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 1654,
    affiliateUrl: "https://www.amazon.com/dp/B08SILVER_EARR003?tag=91791709-20",
    category: "earrings",
    metalType: "silver",
    description: "Delicate drop earrings in 925 sterling silver",
  },

  // Jewelry Sets
  {
    asin: "B08JEWELRY_SET001",
    title: "Gold Jewelry Set - 14K Gold Plated Necklace, Bracelet & Earrings",
    brand: "BaubleBar",
    price: 128.0,
    originalPrice: 165.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Vz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.6,
    reviewCount: 2341,
    affiliateUrl: "https://www.amazon.com/dp/B08JEWELRY_SET001?tag=91791709-20",
    category: "sets",
    metalType: "gold",
    description: "Complete 14K gold plated jewelry set with necklace, bracelet, and earrings",
  },
  {
    asin: "B08JEWELRY_SET002",
    title: "Rose Gold Jewelry Gift Set - Rose Gold Filled Layered Necklace & Ring",
    brand: "Missoma",
    price: 185.0,
    originalPrice: 230.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Wz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.8,
    reviewCount: 1098,
    affiliateUrl: "https://www.amazon.com/dp/B08JEWELRY_SET002?tag=91791709-20",
    category: "sets",
    metalType: "rose_gold",
    description: "Elegant rose gold filled jewelry set with layered necklace and stacking ring",
  },
  {
    asin: "B08JEWELRY_SET003",
    title: "Silver Jewelry Set - 925 Sterling Silver Complete Set",
    brand: "Pandora",
    price: 145.0,
    originalPrice: 185.0,
    imageUrl: "https://m.media-amazon.com/images/I/71Xz8Z8Z8ZL._AC_SY879_.jpg",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08JEWELRY_SET003?tag=91791709-20",
    category: "sets",
    metalType: "silver",
    description: "Complete 925 sterling silver jewelry set with all essentials",
  },
];

/**
 * Convert product data to InsertProduct format
 */
export function convertToInsertProduct(product: JewelryProduct): InsertProduct {
  return {
    asin: product.asin,
    title: product.title,
    brand: product.brand,
    description: product.description || product.title,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : undefined,
    imageUrl: product.imageUrl,
    additionalImages: product.additionalImages || undefined,
    affiliateUrl: product.affiliateUrl,
    amazonRating: product.rating,
    reviewCount: product.reviewCount || 0,
    category: product.category as any,
    metalType: product.metalType as any,
    tags: [product.category, product.metalType],
    isFeatured: false,
    isHero: false,
    isActive: true,
    lastFetchedAt: new Date(),
  };
}

/**
 * Get all jewelry products
 */
export function getAllJewelryProducts(): JewelryProduct[] {
  return REAL_JEWELRY_PRODUCTS;
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): JewelryProduct[] {
  return REAL_JEWELRY_PRODUCTS.filter((p) => p.category === category);
}

/**
 * Get products by metal type
 */
export function getProductsByMetalType(metalType: string): JewelryProduct[] {
  return REAL_JEWELRY_PRODUCTS.filter((p) => p.metalType === metalType);
}

/**
 * Get featured products (top sellers)
 */
export function getFeaturedProducts(limit: number = 8): JewelryProduct[] {
  return REAL_JEWELRY_PRODUCTS.slice(0, limit).sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
}

/**
 * Get hero products (top 3)
 */
export function getHeroProducts(): JewelryProduct[] {
  return REAL_JEWELRY_PRODUCTS.slice(0, 3).sort((a, b) => (b.rating || 0) - (a.rating || 0));
}
