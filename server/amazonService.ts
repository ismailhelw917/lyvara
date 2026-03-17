/**
 * Amazon Product Advertising API (PA-API) Service
 *
 * This service fetches jewelry products from Amazon using the PA-API v5.
 * When Amazon credentials are not configured, it uses a rich mock dataset
 * to demonstrate the full functionality of the platform.
 *
 * To enable live Amazon data:
 * 1. Create an Amazon Associates account at affiliate-program.amazon.com
 * 2. Request PA-API access (requires 3 qualifying sales first)
 * 3. Add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, and AMAZON_ASSOCIATE_TAG to secrets
 */

import { createHmac } from "crypto";
import { InsertProduct } from "../drizzle/schema";

const AMAZON_HOST = "webservices.amazon.com";
const AMAZON_REGION = "us-east-1";
const AMAZON_SERVICE = "ProductAdvertisingAPI";

interface AmazonSearchResult {
  asin: string;
  title: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  affiliateUrl: string;
  category: "necklaces" | "bracelets" | "rings" | "earrings" | "pendants" | "sets" | "other";
  metalType: "gold" | "silver" | "rose_gold" | "white_gold" | "platinum" | "mixed";
  tags?: string[];
}

// ─── Mock Product Data ────────────────────────────────────────────────────────
// Rich mock dataset used when Amazon credentials are not configured
const MOCK_JEWELRY_PRODUCTS: AmazonSearchResult[] = [
  // Gold Necklaces
  {
    asin: "B08GOLD001",
    title: "14K Gold Diamond Pendant Necklace for Women — Delicate Chain with Sparkling Solitaire",
    brand: "Kay Jewelers",
    price: 189.99,
    originalPrice: 249.99,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    rating: 4.8,
    reviewCount: 2341,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD001?tag=lyvarajewels-20",
    category: "necklaces",
    metalType: "gold",
    tags: ["diamond", "pendant", "14k gold", "gift"],
  },
  {
    asin: "B08GOLD002",
    title: "18K Gold Layered Necklace Set — Dainty Chain Choker with Satellite Chain, Women's Jewelry",
    brand: "Mejuri",
    price: 145.00,
    originalPrice: 145.00,
    imageUrl: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD002?tag=lyvarajewels-20",
    category: "necklaces",
    metalType: "gold",
    tags: ["layered", "choker", "18k gold", "dainty"],
  },
  {
    asin: "B08GOLD003",
    title: "Gold Infinity Necklace — 14K Gold Filled Infinity Symbol Pendant, Minimalist Jewelry",
    brand: "Gorjana",
    price: 78.00,
    originalPrice: 98.00,
    imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    rating: 4.6,
    reviewCount: 3102,
    affiliateUrl: "https://www.amazon.com/dp/B08GOLD003?tag=lyvarajewels-20",
    category: "necklaces",
    metalType: "gold",
    tags: ["infinity", "minimalist", "gold filled"],
  },
  // Silver Necklaces
  {
    asin: "B08SILV001",
    title: "Sterling Silver Heart Necklace — 925 Silver Open Heart Pendant with Box Chain",
    brand: "Pandora",
    price: 65.00,
    originalPrice: 85.00,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    rating: 4.9,
    reviewCount: 5621,
    affiliateUrl: "https://www.amazon.com/dp/B08SILV001?tag=lyvarajewels-20",
    category: "necklaces",
    metalType: "silver",
    tags: ["heart", "sterling silver", "925", "romantic"],
  },
  {
    asin: "B08SILV002",
    title: "Silver Moon and Star Necklace — Celestial Crescent Moon Pendant, Dainty Silver Jewelry",
    brand: "Alex and Ani",
    price: 42.00,
    originalPrice: 55.00,
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80",
    rating: 4.5,
    reviewCount: 2890,
    affiliateUrl: "https://www.amazon.com/dp/B08SILV002?tag=lyvarajewels-20",
    category: "necklaces",
    metalType: "silver",
    tags: ["celestial", "moon", "star", "dainty"],
  },
  // Gold Bracelets
  {
    asin: "B08BRAC001",
    title: "14K Gold Tennis Bracelet — Classic Diamond Line Bracelet, 7 Inch Women's Fine Jewelry",
    brand: "Zales",
    price: 349.99,
    originalPrice: 499.99,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    rating: 4.8,
    reviewCount: 1234,
    affiliateUrl: "https://www.amazon.com/dp/B08BRAC001?tag=lyvarajewels-20",
    category: "bracelets",
    metalType: "gold",
    tags: ["tennis bracelet", "diamond", "14k gold", "fine jewelry"],
  },
  {
    asin: "B08BRAC002",
    title: "Gold Bangle Bracelet Set — 18K Gold Plated Stackable Bangles, Set of 3",
    brand: "BaubleBar",
    price: 58.00,
    originalPrice: 72.00,
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80",
    rating: 4.4,
    reviewCount: 4521,
    affiliateUrl: "https://www.amazon.com/dp/B08BRAC002?tag=lyvarajewels-20",
    category: "bracelets",
    metalType: "gold",
    tags: ["bangle", "stackable", "set", "gold plated"],
  },
  // Rose Gold Bracelets
  {
    asin: "B08BRAC003",
    title: "Rose Gold Chain Bracelet — Delicate 14K Rose Gold Filled Paperclip Link Chain",
    brand: "Missoma",
    price: 95.00,
    originalPrice: 120.00,
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",
    rating: 4.7,
    reviewCount: 987,
    affiliateUrl: "https://www.amazon.com/dp/B08BRAC003?tag=lyvarajewels-20",
    category: "bracelets",
    metalType: "rose_gold",
    tags: ["rose gold", "paperclip", "chain", "delicate"],
  },
  // Gold Rings
  {
    asin: "B08RING001",
    title: "14K Gold Solitaire Diamond Ring — Classic Prong Setting, Engagement or Promise Ring",
    brand: "Tiffany & Co.",
    price: 1250.00,
    originalPrice: 1500.00,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    rating: 4.9,
    reviewCount: 876,
    affiliateUrl: "https://www.amazon.com/dp/B08RING001?tag=lyvarajewels-20",
    category: "rings",
    metalType: "gold",
    tags: ["diamond", "solitaire", "engagement", "14k gold"],
  },
  {
    asin: "B08RING002",
    title: "Gold Stacking Rings Set — 14K Gold Filled Thin Band Rings, Set of 5 Minimalist Rings",
    brand: "Catbird",
    price: 89.00,
    originalPrice: 110.00,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    rating: 4.6,
    reviewCount: 3456,
    affiliateUrl: "https://www.amazon.com/dp/B08RING002?tag=lyvarajewels-20",
    category: "rings",
    metalType: "gold",
    tags: ["stacking", "minimalist", "gold filled", "set"],
  },
  {
    asin: "B08RING003",
    title: "Rose Gold Eternity Band — 14K Rose Gold Diamond Eternity Ring, Wedding Band",
    brand: "James Allen",
    price: 695.00,
    originalPrice: 850.00,
    imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
    rating: 4.8,
    reviewCount: 654,
    affiliateUrl: "https://www.amazon.com/dp/B08RING003?tag=lyvarajewels-20",
    category: "rings",
    metalType: "rose_gold",
    tags: ["eternity band", "diamond", "rose gold", "wedding"],
  },
  // Silver Rings
  {
    asin: "B08RING004",
    title: "Sterling Silver Moonstone Ring — 925 Silver Oval Moonstone Cocktail Ring, Boho Jewelry",
    brand: "Astrid & Miyu",
    price: 48.00,
    originalPrice: 65.00,
    imageUrl: "https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=600&q=80",
    rating: 4.5,
    reviewCount: 2109,
    affiliateUrl: "https://www.amazon.com/dp/B08RING004?tag=lyvarajewels-20",
    category: "rings",
    metalType: "silver",
    tags: ["moonstone", "sterling silver", "cocktail", "boho"],
  },
  // Gold Earrings
  {
    asin: "B08EARR001",
    title: "14K Gold Huggie Hoop Earrings — Small Diamond Pave Huggies, Cartilage Earrings",
    brand: "Maria Black",
    price: 165.00,
    originalPrice: 210.00,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    rating: 4.7,
    reviewCount: 1876,
    affiliateUrl: "https://www.amazon.com/dp/B08EARR001?tag=lyvarajewels-20",
    category: "earrings",
    metalType: "gold",
    tags: ["huggie", "hoop", "diamond", "14k gold"],
  },
  {
    asin: "B08EARR002",
    title: "Gold Drop Earrings — 18K Gold Plated Teardrop Crystal Dangle Earrings for Women",
    brand: "Swarovski",
    price: 85.00,
    originalPrice: 110.00,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    rating: 4.6,
    reviewCount: 3210,
    affiliateUrl: "https://www.amazon.com/dp/B08EARR002?tag=lyvarajewels-20",
    category: "earrings",
    metalType: "gold",
    tags: ["drop", "crystal", "dangle", "18k gold"],
  },
  {
    asin: "B08EARR003",
    title: "Gold Stud Earrings — 14K Solid Gold Ball Stud Earrings, Classic Everyday Jewelry",
    brand: "Zoe Chicco",
    price: 125.00,
    originalPrice: 125.00,
    imageUrl: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80",
    rating: 4.9,
    reviewCount: 4567,
    affiliateUrl: "https://www.amazon.com/dp/B08EARR003?tag=lyvarajewels-20",
    category: "earrings",
    metalType: "gold",
    tags: ["stud", "ball", "14k solid gold", "everyday"],
  },
  // Silver Earrings
  {
    asin: "B08EARR004",
    title: "Sterling Silver Hoop Earrings — 925 Silver Classic Thin Hoops, Multiple Sizes",
    brand: "Pandora",
    price: 45.00,
    originalPrice: 60.00,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    rating: 4.8,
    reviewCount: 8901,
    affiliateUrl: "https://www.amazon.com/dp/B08EARR004?tag=lyvarajewels-20",
    category: "earrings",
    metalType: "silver",
    tags: ["hoop", "sterling silver", "925", "classic"],
  },
  // Pendants
  {
    asin: "B08PEND001",
    title: "Gold Butterfly Pendant — 14K Gold Filled Butterfly Charm Pendant, Nature Jewelry",
    brand: "Gorjana",
    price: 68.00,
    originalPrice: 85.00,
    imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    rating: 4.5,
    reviewCount: 1543,
    affiliateUrl: "https://www.amazon.com/dp/B08PEND001?tag=lyvarajewels-20",
    category: "pendants",
    metalType: "gold",
    tags: ["butterfly", "nature", "charm", "gold filled"],
  },
  {
    asin: "B08PEND002",
    title: "Silver Evil Eye Pendant — 925 Sterling Silver Blue Evil Eye Charm, Protective Jewelry",
    brand: "Alex and Ani",
    price: 38.00,
    originalPrice: 48.00,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    rating: 4.7,
    reviewCount: 2876,
    affiliateUrl: "https://www.amazon.com/dp/B08PEND002?tag=lyvarajewels-20",
    category: "pendants",
    metalType: "silver",
    tags: ["evil eye", "protection", "blue", "charm"],
  },
  // Sets
  {
    asin: "B08SETS001",
    title: "Gold Jewelry Set — 14K Gold Plated Necklace, Bracelet & Earrings Set for Women, Gift Box",
    brand: "BaubleBar",
    price: 128.00,
    originalPrice: 165.00,
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",
    rating: 4.6,
    reviewCount: 2341,
    affiliateUrl: "https://www.amazon.com/dp/B08SETS001?tag=lyvarajewels-20",
    category: "sets",
    metalType: "gold",
    tags: ["set", "gift", "necklace", "bracelet", "earrings"],
  },
  {
    asin: "B08SETS002",
    title: "Rose Gold Jewelry Gift Set — Rose Gold Filled Layered Necklace and Stacking Ring Set",
    brand: "Missoma",
    price: 185.00,
    originalPrice: 230.00,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    rating: 4.8,
    reviewCount: 1098,
    affiliateUrl: "https://www.amazon.com/dp/B08SETS002?tag=lyvarajewels-20",
    category: "sets",
    metalType: "rose_gold",
    tags: ["rose gold", "layered", "stacking", "gift set"],
  },
  // White Gold
  {
    asin: "B08WGOL001",
    title: "14K White Gold Diamond Stud Earrings — 0.5 Carat Total Weight, Certified Diamonds",
    brand: "Blue Nile",
    price: 425.00,
    originalPrice: 550.00,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    rating: 4.9,
    reviewCount: 765,
    affiliateUrl: "https://www.amazon.com/dp/B08WGOL001?tag=lyvarajewels-20",
    category: "earrings",
    metalType: "white_gold",
    tags: ["white gold", "diamond", "stud", "certified"],
  },
  {
    asin: "B08WGOL002",
    title: "White Gold Sapphire Ring — 14K White Gold Blue Sapphire and Diamond Cocktail Ring",
    brand: "Brilliant Earth",
    price: 895.00,
    originalPrice: 1100.00,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    rating: 4.8,
    reviewCount: 432,
    affiliateUrl: "https://www.amazon.com/dp/B08WGOL002?tag=lyvarajewels-20",
    category: "rings",
    metalType: "white_gold",
    tags: ["white gold", "sapphire", "diamond", "cocktail"],
  },
];

// ─── PA-API v5 Signature Helper ───────────────────────────────────────────────
function sign(key: Buffer, msg: string): Buffer {
  return createHmac("sha256", key).update(msg).digest();
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = sign(Buffer.from("AWS4" + key), dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  return sign(kService, "aws4_request");
}

async function callPaApi(payload: object): Promise<any> {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  if (!accessKey || !secretKey || !associateTag) {
    return null; // Fall back to mock data
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const path = "/paapi5/searchitems";
  const body = JSON.stringify({ ...payload, PartnerTag: associateTag, PartnerType: "Associates" });

  const headers: Record<string, string> = {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    host: AMAZON_HOST,
    "x-amz-date": amzDate,
    "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
  };

  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k]}\n`)
    .join("");
  const signedHeaders = Object.keys(headers).sort().join(";");
  const payloadHash = createHmac("sha256", "").update(body).digest("hex");
  const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${AMAZON_REGION}/${AMAZON_SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, createHmac("sha256", "").update(canonicalRequest).digest("hex")].join("\n");
  const signingKey = getSignatureKey(secretKey, dateStamp, AMAZON_REGION, AMAZON_SERVICE);
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const response = await fetch(`https://${AMAZON_HOST}${path}`, {
      method: "POST",
      headers: { ...headers, Authorization: authHeader },
      body,
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function parseAmazonItem(item: any, category: AmazonSearchResult["category"], metalType: AmazonSearchResult["metalType"]): AmazonSearchResult | null {
  try {
    const asin = item.ASIN;
    const title = item.ItemInfo?.Title?.DisplayValue;
    if (!asin || !title) return null;
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
    const price = item.Offers?.Listings?.[0]?.Price?.Amount;
    const originalPrice = item.Offers?.Listings?.[0]?.SavingBasis?.Amount;
    const imageUrl = item.Images?.Primary?.Large?.URL;
    const additionalImages = item.Images?.Variants?.map((v: any) => v.Large?.URL).filter(Boolean);
    const rating = item.CustomerReviews?.StarRating?.Value;
    const reviewCount = item.CustomerReviews?.Count;
    const affiliateUrl = item.DetailPageURL;
    return { asin, title, brand, price, originalPrice, imageUrl, additionalImages, rating, reviewCount, affiliateUrl, category, metalType };
  } catch {
    return null;
  }
}

// ─── Main Fetch Function ──────────────────────────────────────────────────────
export async function fetchJewelryProducts(
  category: AmazonSearchResult["category"],
  metalType: AmazonSearchResult["metalType"],
  limit = 10
): Promise<InsertProduct[]> {
  const keywords: Record<string, string> = {
    necklaces: `${metalType.replace("_", " ")} necklace women`,
    bracelets: `${metalType.replace("_", " ")} bracelet women`,
    rings: `${metalType.replace("_", " ")} ring women`,
    earrings: `${metalType.replace("_", " ")} earrings women`,
    pendants: `${metalType.replace("_", " ")} pendant women`,
    sets: `${metalType.replace("_", " ")} jewelry set women`,
    other: `${metalType.replace("_", " ")} jewelry women`,
  };

  const associateTag = process.env.AMAZON_ASSOCIATE_TAG || "lyvarajewels-20";

  // Try PA-API first
  const apiResponse = await callPaApi({
    Keywords: keywords[category] || `${metalType} jewelry women`,
    Resources: [
      "Images.Primary.Large",
      "Images.Variants.Large",
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "CustomerReviews.StarRating",
      "CustomerReviews.Count",
    ],
    SearchIndex: "Jewelry",
    ItemCount: limit,
    Marketplace: "www.amazon.com",
  });

  if (apiResponse?.SearchResult?.Items) {
    return apiResponse.SearchResult.Items.map((item: any) => parseAmazonItem(item, category, metalType))
      .filter(Boolean)
      .map((item: AmazonSearchResult) => mapToProduct(item, associateTag));
  }

  // Fall back to mock data
  const mockProducts = MOCK_JEWELRY_PRODUCTS.filter(
    (p) => p.category === category || (category === "other" && p.category === "other")
  ).slice(0, limit);

  // If no exact category match, return all mock products for that category
  const filtered = MOCK_JEWELRY_PRODUCTS.filter((p) => p.category === category);
  const toReturn = filtered.length > 0 ? filtered.slice(0, limit) : MOCK_JEWELRY_PRODUCTS.slice(0, limit);

  return toReturn.map((item) => mapToProduct(item, associateTag));
}

export async function fetchAllCategories(associateTag = "lyvarajewels-20"): Promise<InsertProduct[]> {
  // Return all mock products with proper affiliate tags
  return MOCK_JEWELRY_PRODUCTS.map((item) => mapToProduct(item, associateTag));
}

function mapToProduct(item: AmazonSearchResult, associateTag: string): InsertProduct {
  const priceDropPercent =
    item.originalPrice && item.price && item.originalPrice > item.price
      ? ((item.originalPrice - item.price) / item.originalPrice) * 100
      : 0;

  // Ensure affiliate tag is in URL
  let affiliateUrl = item.affiliateUrl;
  if (!affiliateUrl.includes("tag=")) {
    affiliateUrl += affiliateUrl.includes("?") ? `&tag=${associateTag}` : `?tag=${associateTag}`;
  }

  return {
    asin: item.asin,
    title: item.title,
    brand: item.brand,
    category: item.category,
    metalType: item.metalType,
    price: item.price ? String(item.price) : undefined,
    originalPrice: item.originalPrice ? String(item.originalPrice) : undefined,
    currency: "USD",
    imageUrl: item.imageUrl,
    additionalImages: item.additionalImages,
    affiliateUrl,
    amazonRating: item.rating,
    reviewCount: item.reviewCount ?? 0,
    tags: item.tags,
    priceDropPercent,
    isActive: true,
    isFeatured: false,
    isHero: false,
    displayRank: 100,
    imageSize: "medium",
    performanceScore: 0,
    ctr: 0,
    clickCount: 0,
    conversionCount: 0,
    estimatedRevenue: "0",
  };
}

export { MOCK_JEWELRY_PRODUCTS };
