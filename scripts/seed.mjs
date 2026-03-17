/**
 * Seed script: populates the database with demo jewelry products
 * Run: node scripts/seed.mjs
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DEMO_PRODUCTS = [
  {
    asin: "B08DEMO001",
    title: "14K Gold Diamond Solitaire Necklace",
    description: "Elegant 14K yellow gold necklace featuring a 0.25 carat round brilliant diamond solitaire pendant. Perfect for everyday luxury.",
    price: "189.99",
    originalPrice: "249.99",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO001?tag=aurumjewels-20",
    category: "necklaces",
    metalType: "gold",
    rating: "4.8",
    reviewCount: 234,
    brand: "Zoe Lev",
    isFeatured: true,
    isHero: true,
    imageSize: "large",
    performanceScore: "95.0",
    displayRank: 1,
  },
  {
    asin: "B08DEMO002",
    title: "Sterling Silver Tennis Bracelet",
    description: "Classic sterling silver tennis bracelet with 3.00 carats total weight of sparkling cubic zirconia stones. Timeless elegance.",
    price: "79.99",
    originalPrice: "129.99",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO002?tag=aurumjewels-20",
    category: "bracelets",
    metalType: "silver",
    rating: "4.7",
    reviewCount: 567,
    brand: "PAVOI",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "88.0",
    displayRank: 2,
  },
  {
    asin: "B08DEMO003",
    title: "Rose Gold Stackable Ring Set",
    description: "Set of 3 delicate 14K rose gold filled stackable rings. Mix and match for a personalized look that transitions from day to night.",
    price: "45.99",
    originalPrice: "65.99",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO003?tag=aurumjewels-20",
    category: "rings",
    metalType: "rose_gold",
    rating: "4.9",
    reviewCount: 1203,
    brand: "Caitlyn Minimalist",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "92.0",
    displayRank: 3,
  },
  {
    asin: "B08DEMO004",
    title: "Gold Hoop Earrings 14K",
    description: "Classic 14K gold hoop earrings, 30mm diameter. Lightweight and comfortable for all-day wear. A wardrobe essential.",
    price: "129.99",
    originalPrice: "179.99",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO004?tag=aurumjewels-20",
    category: "earrings",
    metalType: "gold",
    rating: "4.6",
    reviewCount: 892,
    brand: "Mevecco",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "85.0",
    displayRank: 4,
  },
  {
    asin: "B08DEMO005",
    title: "White Gold Diamond Eternity Band",
    description: "14K white gold eternity band with 1.00 carat total weight of channel-set round diamonds. Stackable and stunning.",
    price: "399.99",
    originalPrice: "549.99",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO005?tag=aurumjewels-20",
    category: "rings",
    metalType: "white_gold",
    rating: "4.9",
    reviewCount: 445,
    brand: "KATARINA",
    isFeatured: true,
    isHero: true,
    imageSize: "large",
    performanceScore: "91.0",
    displayRank: 5,
  },
  {
    asin: "B08DEMO006",
    title: "Silver Pearl Drop Earrings",
    description: "Elegant sterling silver earrings featuring freshwater pearl drops. The perfect blend of classic and contemporary.",
    price: "34.99",
    originalPrice: "49.99",
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO006?tag=aurumjewels-20",
    category: "earrings",
    metalType: "silver",
    rating: "4.5",
    reviewCount: 678,
    brand: "Peora",
    isFeatured: false,
    isHero: false,
    imageSize: "small",
    performanceScore: "72.0",
    displayRank: 6,
  },
  {
    asin: "B08DEMO007",
    title: "Gold Layered Necklace Set",
    description: "Set of 3 dainty 18K gold plated layering necklaces. Includes a bar necklace, coin pendant, and delicate chain.",
    price: "28.99",
    originalPrice: "42.99",
    imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO007?tag=aurumjewels-20",
    category: "necklaces",
    metalType: "gold",
    rating: "4.4",
    reviewCount: 2341,
    brand: "Lateefah",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "80.0",
    displayRank: 7,
  },
  {
    asin: "B08DEMO008",
    title: "Rose Gold Cuff Bracelet",
    description: "Minimalist 14K rose gold filled open cuff bracelet. Adjustable fit, perfect for stacking or wearing alone.",
    price: "39.99",
    originalPrice: "55.99",
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO008?tag=aurumjewels-20",
    category: "bracelets",
    metalType: "rose_gold",
    rating: "4.7",
    reviewCount: 456,
    brand: "Caitlyn Minimalist",
    isFeatured: false,
    isHero: false,
    imageSize: "small",
    performanceScore: "76.0",
    displayRank: 8,
  },
  {
    asin: "B08DEMO009",
    title: "Diamond Stud Earrings 1/4 Carat",
    description: "Classic 14K gold diamond stud earrings, 1/4 carat total weight. Certified conflict-free diamonds with brilliant cut.",
    price: "249.99",
    originalPrice: "349.99",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO009?tag=aurumjewels-20",
    category: "earrings",
    metalType: "gold",
    rating: "4.8",
    reviewCount: 1567,
    brand: "Amazon Collection",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "89.0",
    displayRank: 9,
  },
  {
    asin: "B08DEMO010",
    title: "Sterling Silver Charm Bracelet",
    description: "Italian sterling silver charm bracelet with toggle clasp. Add your own charms or wear as a delicate chain bracelet.",
    price: "24.99",
    originalPrice: "39.99",
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO010?tag=aurumjewels-20",
    category: "bracelets",
    metalType: "silver",
    rating: "4.3",
    reviewCount: 890,
    brand: "Bling Jewelry",
    isFeatured: false,
    isHero: false,
    imageSize: "small",
    performanceScore: "65.0",
    displayRank: 10,
  },
  {
    asin: "B08DEMO011",
    title: "Gold Birthstone Pendant Necklace",
    description: "Personalized 14K gold birthstone pendant necklace. Choose your birthstone for a meaningful, one-of-a-kind gift.",
    price: "89.99",
    originalPrice: "119.99",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO011?tag=aurumjewels-20",
    category: "necklaces",
    metalType: "gold",
    rating: "4.9",
    reviewCount: 3421,
    brand: "Zoe Lev",
    isFeatured: true,
    isHero: false,
    imageSize: "medium",
    performanceScore: "94.0",
    displayRank: 11,
  },
  {
    asin: "B08DEMO012",
    title: "White Gold Sapphire Ring",
    description: "Stunning 14K white gold ring featuring a 1.5 carat oval blue sapphire surrounded by a halo of round diamonds.",
    price: "699.99",
    originalPrice: "899.99",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    affiliateUrl: "https://www.amazon.com/dp/B08DEMO012?tag=aurumjewels-20",
    category: "rings",
    metalType: "white_gold",
    rating: "4.8",
    reviewCount: 234,
    brand: "KATARINA",
    isFeatured: true,
    isHero: true,
    imageSize: "large",
    performanceScore: "87.0",
    displayRank: 12,
  },
];

const DEMO_SETTINGS = [
  { key: "amazon_tag", value: "aurumjewels-20", description: "Amazon Associates tag" },
  { key: "product_fetch_enabled", value: "true", description: "Enable automated product fetching" },
  { key: "blog_generation_enabled", value: "true", description: "Enable automated blog generation" },
  { key: "layout_optimization_enabled", value: "true", description: "Enable automated layout optimization" },
  { key: "performance_threshold_high", value: "80", description: "Score above which products are promoted" },
  { key: "performance_threshold_low", value: "30", description: "Score below which products are replaced" },
  { key: "max_featured_products", value: "8", description: "Maximum number of featured products" },
  { key: "blog_posts_per_day", value: "1", description: "Number of blog posts to generate per day" },
  { key: "last_product_fetch", value: "never", description: "Timestamp of last product fetch" },
  { key: "last_blog_generation", value: "never", description: "Timestamp of last blog generation" },
  { key: "last_layout_optimization", value: "never", description: "Timestamp of last layout optimization" },
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("🌱 Seeding database...");

  // Insert products
  for (const product of DEMO_PRODUCTS) {
    try {
      await connection.execute(
        `INSERT IGNORE INTO products (asin, title, description, price, originalPrice, imageUrl, affiliateUrl, category, metalType, amazonRating, reviewCount, brand, isFeatured, isHero, imageSize, performanceScore, displayRank, isActive, clickCount, conversionCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0)`,
        [
          product.asin, product.title, product.description,
          product.price, product.originalPrice, product.imageUrl,
          product.affiliateUrl, product.category, product.metalType,
          product.rating, product.reviewCount, product.brand,
          product.isFeatured ? 1 : 0, product.isHero ? 1 : 0,
          product.imageSize, product.performanceScore, product.displayRank,
        ]
      );
      console.log(`  ✓ ${product.title}`);
    } catch (err) {
      console.log(`  ⚠ Skipped ${product.title}: ${err.message}`);
    }
  }

  // Insert settings
  for (const setting of DEMO_SETTINGS) {
    try {
      await connection.execute(
        `INSERT IGNORE INTO site_settings (\`key\`, value) VALUES (?, ?)`,
        [setting.key, setting.value]
      );
    } catch (err) {
      console.log(`  ⚠ Setting ${setting.key}: ${err.message}`);
    }
  }

  console.log("✅ Seeding complete!");
  await connection.end();
}

seed().catch(console.error);
