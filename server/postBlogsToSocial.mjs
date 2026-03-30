#!/usr/bin/env node

/**
 * Direct Blog Posting Script
 * Posts 5 blog posts directly to Facebook and Instagram using Meta Graph API
 */

import fetch from "node-fetch";

const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const BLOGS = [
  {
    id: 1,
    title: "The Luminous Duet: Gold & Silver's Reign in This Season's Adornments",
    slug: "luminous-duet-gold-silver-jewelry-trends-1773871428037",
    excerpt: "Discover how gold and silver are dominating this season's jewelry trends. Learn styling tips and collection highlights.",
    category: "trend_report",
    heroImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
  },
  {
    id: 2,
    title: "The Art of Adornment: Mastering the Elegant Layer and Stack",
    slug: "the-art-of-adornment-mastering-the-elegant-layer-and-stack-1773926407245",
    excerpt: "Master the art of layering and stacking jewelry for a sophisticated, curated look. Expert tips for creating your signature style.",
    category: "style_guide",
    heroImageUrl: "https://images.unsplash.com/photo-1515562141207-5dca89f118dd?w=800",
  },
  {
    id: 3,
    title: "The Luminous Allure: Gold and Silver's Reign in This Season's Collections",
    slug: "luminous-allure-gold-silver-trend-report-1773926443028",
    excerpt: "Explore the latest gold and silver collections that are capturing hearts this season. Premium pieces for every occasion.",
    category: "trend_report",
    heroImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
  },
  {
    id: 4,
    title: "The Luminous Language of Gold and Silver: A Curated Gift Guide",
    slug: "luminous-language-gold-silver-curated-gift-guide-1773926474112",
    excerpt: "Perfect gift ideas for every budget. Find the ideal gold or silver piece for your loved ones this season.",
    category: "gift_ideas",
    heroImageUrl: "https://images.unsplash.com/photo-1515562141207-5dca89f118dd?w=800",
  },
  {
    id: 5,
    title: "The Enduring Radiance: A Connoisseur's Guide to Fine Jewelry Care",
    slug: "enduring-radiance-fine-jewelry-care-guide-1773926509426",
    excerpt: "Learn professional jewelry care tips to keep your gold and silver pieces radiant for years to come.",
    category: "care_tips",
    heroImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
  },
];

/**
 * Post to Facebook
 */
async function postToFacebook(blog) {
  try {
    const message = `✨ ${blog.title}\n\n${blog.excerpt}\n\n👉 Read the full story on our blog!\n\n#JewelryBlog #LuxuryJewelry #GoldJewelry #StylingTips`;

    const postData = new URLSearchParams({
      message,
      link: `https://lyvarajewels.com/blog/${blog.slug}`,
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
    });

    if (blog.heroImageUrl) {
      postData.set("picture", blog.heroImageUrl);
    }

    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${FACEBOOK_PAGE_ID}/feed`, {
      method: "POST",
      body: postData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Facebook: "${blog.title}"`);
      return { success: true, id: result.id };
    } else {
      console.error(`❌ Facebook: "${blog.title}" - ${result.error?.message}`);
      return { success: false, error: result.error?.message };
    }
  } catch (error) {
    console.error(`❌ Facebook Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Post to Instagram
 */
async function postToInstagram(blog) {
  try {
    if (!blog.heroImageUrl) {
      console.log(`⚠️  Instagram: Skipping - no image`);
      return { success: false, error: "No image" };
    }

    const caption = `✨ ${blog.title}\n\n${blog.excerpt}\n\n👉 Link in bio!\n\n#JewelryBlog #LuxuryJewelry #GoldJewelry #JewelryInspo #AccessoryGoals`;

    const postData = new URLSearchParams({
      image_url: blog.heroImageUrl,
      caption,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    });

    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${INSTAGRAM_ACCOUNT_ID}/media`, {
      method: "POST",
      body: postData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Instagram: "${blog.title}"`);
      return { success: true, id: result.id };
    } else {
      console.error(`❌ Instagram: "${blog.title}" - ${result.error?.message}`);
      return { success: false, error: result.error?.message };
    }
  } catch (error) {
    console.error(`❌ Instagram Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting bulk blog posting to Facebook & Instagram...\n");

  // Validate credentials
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.error("❌ Missing Facebook credentials");
    console.error(`   FACEBOOK_PAGE_ID: ${FACEBOOK_PAGE_ID ? "✓" : "✗"}`);
    console.error(`   FACEBOOK_PAGE_ACCESS_TOKEN: ${FACEBOOK_PAGE_ACCESS_TOKEN ? "✓" : "✗"}`);
    process.exit(1);
  }

  if (!INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    console.error("❌ Missing Instagram credentials");
    console.error(`   INSTAGRAM_BUSINESS_ACCOUNT_ID: ${INSTAGRAM_ACCOUNT_ID ? "✓" : "✗"}`);
    console.error(`   INSTAGRAM_ACCESS_TOKEN: ${INSTAGRAM_ACCESS_TOKEN ? "✓" : "✗"}`);
    process.exit(1);
  }

  console.log(`📝 Posting ${BLOGS.length} blog posts to both platforms...\n`);

  let facebookSuccess = 0;
  let instagramSuccess = 0;

  // Post each blog to both platforms
  for (let i = 0; i < BLOGS.length; i++) {
    const blog = BLOGS[i];
    console.log(`\n[${i + 1}/${BLOGS.length}] ${blog.title}`);

    // Post to Facebook
    const fbResult = await postToFacebook(blog);
    if (fbResult.success) facebookSuccess++;

    // Post to Instagram
    const igResult = await postToInstagram(blog);
    if (igResult.success) instagramSuccess++;

    // Small delay between posts
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ POSTING COMPLETE!`);
  console.log(`📱 Facebook: ${facebookSuccess}/${BLOGS.length} posts successful`);
  console.log(`📸 Instagram: ${instagramSuccess}/${BLOGS.length} posts successful`);
  console.log("=".repeat(60));

  if (facebookSuccess + instagramSuccess === BLOGS.length * 2) {
    console.log("\n🎉 All posts successful!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some posts failed. Check errors above.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
