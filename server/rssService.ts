/**
 * RSS Feed Service
 * Generates RSS feed for blog posts
 */

import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string;
  guid: string;
  image?: string;
}

/**
 * Generate RSS feed XML for blog posts
 */
export async function generateRSSFeed(baseUrl: string): Promise<string> {
  try {
    // Fetch latest 20 blog posts
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.createdAt))
      .limit(20);

    // Convert to RSS items
    const items: RSSItem[] = posts.map((post: any) => ({
      title: post.title,
      link: `${baseUrl}/blog/${post.slug}`,
      description: post.excerpt || post.title,
      pubDate: new Date(post.createdAt).toUTCString(),
      category: post.category || "jewelry",
      guid: `${baseUrl}/blog/${post.slug}`,
      image: post.heroImageUrl,
    }));

    // Generate RSS XML
    const rssXml = generateRSSXml(items, baseUrl);
    return rssXml;
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    throw error;
  }
}

/**
 * Generate RSS XML from items
 */
function generateRSSXml(items: RSSItem[], baseUrl: string): string {
  const now = new Date().toUTCString();

  const itemsXml = items
    .map(
      (item: RSSItem) => `
    <item>
      <title><![CDATA[${escapeXml(item.title)}]]></title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <description><![CDATA[${escapeXml(item.description)}]]></description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${item.pubDate}</pubDate>
      ${item.image ? `<enclosure url="${escapeXml(item.image)}" type="image/jpeg" />
      <media:content url="${escapeXml(item.image)}" type="image/jpeg" medium="image" />` : ""}
    </item>
  `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>LYVARA JEWELS - Blog</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Luxury gold jewelry insights, styling tips, and jewelry care guides</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <image>
      <url>https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200</url>
      <title>LYVARA JEWELS</title>
      <link>${escapeXml(baseUrl)}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`;
}

/**
 * Escape XML special characters
 * Use numeric entities for better compatibility with strict XML validators
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")  // Must be first!
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");  // Use numeric entity instead of &apos;
}
