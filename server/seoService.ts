import { getDb } from "./db";
import { products, blogPosts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * SEO Service: Handles automatic SEO updates
 * - Dynamic meta tags for products and blog posts
 * - XML sitemap generation
 * - Search engine pings (Google, Bing)
 * - Image optimization metadata
 * - Keyword tracking
 */

interface MetaTagData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

/**
 * Generate SEO-optimized meta tags for a product
 */
export async function generateProductMetaTags(productId: number): Promise<MetaTagData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const product = result.length > 0 ? result[0] : null;

  if (!product) throw new Error(`Product ${productId} not found`);

  const title = `${product.title} | LYVARA JEWELS - Luxury Gold & Silver Jewelry`;
  const description = `${product.title} - ${product.brand || "Premium"} jewelry. ${product.description?.substring(0, 100) || "Exquisite gold and silver jewelry for women."} Shop now with free shipping.`;
  const keywords = [
    product.title.toLowerCase(),
    product.category?.toLowerCase() || "jewelry",
    product.brand?.toLowerCase() || "luxury jewelry",
    "gold jewelry",
    "silver jewelry",
    "women's jewelry",
  ];

  return {
    title,
    description,
    keywords,
    ogImage: product.imageUrl || "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200&h=630&fit=crop&q=80",
    ogTitle: title,
    ogDescription: description,
    canonicalUrl: `https://lyvara-jewels.manus.space/product/${productId}`,
  };
}

/**
 * Generate SEO-optimized meta tags for a blog post
 */
export async function generateBlogPostMetaTags(postId: number): Promise<MetaTagData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  const post = result.length > 0 ? result[0] : null;

  if (!post) throw new Error(`Blog post ${postId} not found`);

  const title = `${post.title} | LYVARA JEWELS Journal`;
  const description = post.excerpt || post.content?.substring(0, 155) || "Discover jewelry styling tips, trends, and care guides from LYVARA JEWELS.";
  const keywords = [
    post.title.toLowerCase(),
    "jewelry",
    "jewelry tips",
    "jewelry trends",
    "gold jewelry",
    "silver jewelry",
    "jewelry styling",
  ];

  return {
    title,
    description,
    keywords,
    ogImage: post.heroImageUrl || "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200&h=630&fit=crop&q=80",
    ogTitle: title,
    ogDescription: description,
    canonicalUrl: `https://lyvara-jewels.manus.space/blog/${postId}`,
  };
}

/**
 * Generate XML sitemap for all products and blog posts
 */
export async function generateXmlSitemap(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProducts = await db.select().from(products);
  const allPosts = await db.select().from(blogPosts);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += '    <loc>https://lyvara-jewels.manus.space/</loc>\n';
  xml += '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Products
  for (const product of allProducts) {
    xml += '  <url>\n';
    xml += `    <loc>https://lyvara-jewels.manus.space/product/${product.id}</loc>\n`;
    xml += '    <lastmod>' + new Date(product.createdAt).toISOString().split('T')[0] + '</lastmod>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Blog posts
  for (const post of allPosts) {
    xml += '  <url>\n';
    xml += `    <loc>https://lyvara-jewels.manus.space/blog/${post.id}</loc>\n`;
    xml += '    <lastmod>' + new Date(post.createdAt).toISOString().split('T')[0] + '</lastmod>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }

  // Category pages
  const categories = ["necklaces", "bracelets", "rings", "earrings"];
  for (const cat of categories) {
    xml += '  <url>\n';
    xml += `    <loc>https://lyvara-jewels.manus.space/shop?category=${cat}</loc>\n`;
    xml += '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Ping search engines with new content
 */
export async function pingSearchEngines(url: string): Promise<void> {
  try {
    // Ping Google
    await fetch(`https://www.google.com/ping?sitemap=https://lyvara-jewels.manus.space/sitemap.xml`);
    console.log(`[SEO] Pinged Google for ${url}`);
  } catch (error) {
    console.error(`[SEO] Failed to ping Google:`, error);
  }

  try {
    // Ping Bing
    await fetch(`https://www.bing.com/ping?sitemap=https://lyvara-jewels.manus.space/sitemap.xml`);
    console.log(`[SEO] Pinged Bing for ${url}`);
  } catch (error) {
    console.error(`[SEO] Failed to ping Bing:`, error);
  }
}

/**
 * Generate image alt text and optimization metadata
 */
export function generateImageAltText(productTitle: string, category: string): string {
  return `${productTitle} - ${category} jewelry from LYVARA JEWELS`;
}

/**
 * Extract keywords from content for SEO tracking
 */
export function extractKeywords(content: string): string[] {
  const words = content.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must", "can"
  ]);

  return words
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}
