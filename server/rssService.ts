/**
 * RSS Feed Service
 * Generates valid RSS feed for blog posts
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
 * Escape XML special characters
 * Must escape & first, then other characters
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")  // Must be first!
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape content for CDATA sections
 * CDATA sections cannot contain ]]> so we need to handle that
 */
function escapeCDATA(str: string): string {
  if (!str) return "";
  // Replace ]]> with ]]&gt; to prevent breaking CDATA
  return str.replace(/\]\]>/g, "]]&gt;");
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
      .orderBy(desc(blogPosts.publishedAt))
      .limit(20);

    // Convert to RSS items
    const items: RSSItem[] = posts.map((post: any) => ({
      title: post.title || "Untitled",
      link: `${baseUrl}/blog/${post.slug}`,
      description: post.excerpt || post.content?.substring(0, 200) || post.title,
      pubDate: post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString(),
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
 * Properly escapes all content to ensure valid XML
 */
function generateRSSXml(items: RSSItem[], baseUrl: string): string {
  const now = new Date().toUTCString();

  const itemsXml = items
    .map((item: RSSItem) => {
      // Escape all content properly
      const escapedTitle = escapeCDATA(item.title);
      const escapedDescription = escapeCDATA(item.description);
      const escapedLink = escapeXml(item.link);
      const escapedGuid = escapeXml(item.guid);
      const escapedCategory = escapeXml(item.category);
      const escapedImage = item.image ? escapeXml(item.image) : "";

      let itemXml = `    <item>
      <title><![CDATA[${escapedTitle}]]></title>
      <link>${escapedLink}</link>
      <guid isPermaLink="true">${escapedGuid}</guid>
      <description><![CDATA[${escapedDescription}]]></description>
      <category>${escapedCategory}</category>
      <pubDate>${item.pubDate}</pubDate>`;

      // Add image/enclosure if available
      if (escapedImage) {
        itemXml += `
      <enclosure url="${escapedImage}" type="image/jpeg" length="0" />
      <media:content url="${escapedImage}" type="image/jpeg" medium="image" />`;
      }

      itemXml += `
    </item>`;

      return itemXml;
    })
    .join("\n");

  const escapedBaseUrl = escapeXml(baseUrl);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>LYVARA JEWELS - Blog</title>
    <link>${escapedBaseUrl}</link>
    <description>Luxury gold jewelry insights, styling tips, and jewelry care guides</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <image>
      <url>https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200</url>
      <title>LYVARA JEWELS</title>
      <link>${escapedBaseUrl}</link>
    </image>
${itemsXml}
  </channel>
</rss>`;
}
