/**
 * Bulk Blog Posting Script
 * Posts 5 latest blog posts to both Instagram and Facebook
 */

import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:3000/api/trpc";
const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

/**
 * Get 5 latest blog posts
 */
async function getLatestBlogPosts() {
  try {
    const response = await fetch(`${API_URL}/blog.list?input={"status":"published","limit":5,"offset":0}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return data.result?.data || [];
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

/**
 * Post to Facebook
 */
async function postToFacebook(blog) {
  try {
    const message = `✨ ${blog.title}\n\n${blog.excerpt || "Read our latest jewelry insights"}\n\n👉 Link in bio for the full story!\n\n#JewelryBlog #LuxuryJewelry #GoldJewelry`;

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
      console.log(`✅ Facebook: Posted "${blog.title}" (ID: ${result.id})`);
      return { success: true, id: result.id };
    } else {
      console.error(`❌ Facebook Error for "${blog.title}":`, result.error?.message);
      return { success: false, error: result.error?.message };
    }
  } catch (error) {
    console.error(`❌ Facebook posting error for "${blog.title}":`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Post to Instagram
 */
async function postToInstagram(blog) {
  try {
    if (!blog.heroImageUrl) {
      console.log(`⚠️  Instagram: Skipping "${blog.title}" - no image`);
      return { success: false, error: "No image" };
    }

    const caption = `✨ ${blog.title}${blog.category ? ` - ${blog.category}` : ""}\n\n${blog.excerpt || "Read our latest jewelry insights"}\n\n👉 Link in bio for the full story!\n\n#JewelryBlog #LuxuryJewelry #StylingTips #GoldJewelry #JewelryInspo`;

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
      console.log(`✅ Instagram: Posted "${blog.title}" (ID: ${result.id})`);
      return { success: true, id: result.id };
    } else {
      console.error(`❌ Instagram Error for "${blog.title}":`, result.error?.message);
      return { success: false, error: result.error?.message };
    }
  } catch (error) {
    console.error(`❌ Instagram posting error for "${blog.title}":`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting bulk blog posting...\n");

  // Validate credentials
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.error("❌ Missing Facebook credentials");
    process.exit(1);
  }

  if (!INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN) {
    console.error("❌ Missing Instagram credentials");
    process.exit(1);
  }

  // Get latest blogs
  const blogs = await getLatestBlogPosts();

  if (blogs.length === 0) {
    console.error("❌ No blog posts found");
    process.exit(1);
  }

  console.log(`📝 Found ${blogs.length} blog posts to post\n`);

  let facebookSuccess = 0;
  let instagramSuccess = 0;

  // Post each blog to both platforms
  for (const blog of blogs) {
    console.log(`\n📌 Processing: "${blog.title}"`);

    // Post to Facebook
    const fbResult = await postToFacebook(blog);
    if (fbResult.success) facebookSuccess++;

    // Post to Instagram
    const igResult = await postToInstagram(blog);
    if (igResult.success) instagramSuccess++;

    // Small delay between posts
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Posting Complete!`);
  console.log(`📱 Facebook: ${facebookSuccess}/${blogs.length} successful`);
  console.log(`📸 Instagram: ${instagramSuccess}/${blogs.length} successful`);
  console.log("=".repeat(50));
}

main().catch(console.error);
