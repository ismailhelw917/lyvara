/**
 * RSS Service Tests
 * Verify RSS feed generation produces valid XML
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateRSSFeed } from "./rssService";

describe("RSS Feed Service", () => {
  const baseUrl = "https://lyvarajewels.com";

  it("should generate valid RSS XML structure", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check XML declaration
    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8"?>');

    // Check RSS root element
    expect(feed).toContain('<rss version="2.0"');

    // Check channel element
    expect(feed).toContain("<channel>");
    expect(feed).toContain("</channel>");

    // Check required channel elements
    expect(feed).toContain("<title>LYVARA JEWELS - Blog</title>");
    expect(feed).toContain(`<link>${baseUrl}</link>`);
    expect(feed).toContain("<description>Luxury gold jewelry insights");
    expect(feed).toContain("<language>en-us</language>");
  });

  it("should properly escape XML special characters", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check that unescaped special characters are not in non-CDATA sections
    expect(feed).not.toContain("&w=200</url>");
    
    // Verify XML declaration is present
    expect(feed).toContain('<?xml version="1.0"');
    
    // Verify proper XML structure
    expect(feed).toContain("<rss");
    expect(feed).toContain("</rss>");
  });

  it("should have proper CDATA sections", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check for CDATA sections
    expect(feed).toContain("<![CDATA[");
    expect(feed).toContain("]]>");

    // Verify CDATA sections are properly closed
    const cdataMatches = feed.match(/<!\[CDATA\[/g) || [];
    const cdataCloses = feed.match(/\]\]>/g) || [];
    expect(cdataMatches.length).toBe(cdataCloses.length);
  });

  it("should include item elements with required fields", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check for item elements
    expect(feed).toContain("<item>");
    expect(feed).toContain("</item>");

    // Items should have required fields
    if (feed.includes("<item>")) {
      expect(feed).toContain("<title><![CDATA[");
      expect(feed).toContain("<link>");
      expect(feed).toContain("<guid");
      expect(feed).toContain("<description><![CDATA[");
      expect(feed).toContain("<pubDate>");
    }
  });

  it("should include media namespace for images", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check for media namespace declaration
    expect(feed).toContain('xmlns:media="http://search.yahoo.com/mrss/"');

    // Check for content namespace
    expect(feed).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
  });

  it("should not contain malformed CDATA", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // CDATA should not have nested ]]>
    const cdataPattern = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
    let match;
    while ((match = cdataPattern.exec(feed)) !== null) {
      const cdataContent = match[1];
      // ]]> inside CDATA should be escaped as ]]&gt;
      expect(cdataContent).not.toContain("]]>");
    }
  });

  it("should have valid lastBuildDate format", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Check for lastBuildDate in RFC 2822 format
    expect(feed).toMatch(/<lastBuildDate>.*GMT<\/lastBuildDate>/);
  });

  it("should handle special characters in content", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Verify no unescaped special characters in non-CDATA sections
    const lines = feed.split("\n");
    for (const line of lines) {
      // Skip CDATA lines
      if (line.includes("<![CDATA[")) continue;

      // Check for unescaped ampersands (except in entities)
      const unescapedAmp = line.match(/&(?!amp;|lt;|gt;|quot;|#39;)/);
      if (unescapedAmp && !line.includes("http")) {
        // Allow ampersands in URLs within CDATA
        expect(unescapedAmp).toBeNull();
      }
    }
  });

  it("should generate valid XML structure", async () => {
    const feed = await generateRSSFeed(baseUrl);

    // Verify basic XML structure is valid
    expect(feed.startsWith('<?xml')).toBe(true);
    expect(feed.includes('</rss>')).toBe(true);
    
    // Count opening and closing tags
    const openChannels = (feed.match(/<channel>/g) || []).length;
    const closeChannels = (feed.match(/<\/channel>/g) || []).length;
    expect(openChannels).toBe(closeChannels);
  });


  it("should include channel image element", async () => {
    const feed = await generateRSSFeed(baseUrl);

    expect(feed).toContain("<image>");
    expect(feed).toContain("</image>");
    expect(feed).toContain("<url>https://images.unsplash.com");
  });
});
