#!/usr/bin/env node

/**
 * Generate Shop Blog Posts Script
 * Creates initial batch of 20 blog posts for .shop domain targeting high-value keywords
 */

import { invokeLLM } from "../server/_core/llm.mjs";
import { getDb } from "../server/db.mjs";
import { generateImage } from "../server/_core/imageGeneration.mjs";

// High-value keywords for .shop domain
const keywords = [
  {
    title: "Gold Jewelry Gifts for Women: The Ultimate Guide",
    keyword: "gold jewelry gifts for women",
    category: "gift_ideas",
    excerpt: "Discover the perfect gold jewelry gift for the woman in your life. Our curated guide covers timeless pieces, budget options, and luxury selections.",
  },
  {
    title: "Affordable Gold Jewelry for Women: Quality Without the Price Tag",
    keyword: "affordable gold jewelry for women",
    category: "buyer_guide",
    excerpt: "Find beautiful, affordable gold jewelry that doesn't compromise on quality. Learn how to spot genuine pieces and get the best value.",
  },
  {
    title: "How to Clean Gold Jewelry at Home: Expert Tips",
    keyword: "how to clean gold jewelry",
    category: "care_tips",
    excerpt: "Keep your gold jewelry sparkling with our simple home cleaning methods. No expensive cleaners needed!",
  },
  {
    title: "14K vs 18K Gold: Which is Right for You?",
    keyword: "14k vs 18k gold",
    category: "education",
    excerpt: "Understand the differences between 14K and 18K gold, and learn which is best for your jewelry needs.",
  },
  {
    title: "Gold Jewelry Trends 2024: What's Hot Right Now",
    keyword: "gold jewelry trends 2024",
    category: "trend_report",
    excerpt: "Stay ahead of the curve with the latest gold jewelry trends. From minimalist to statement pieces.",
  },
  {
    title: "Layered Gold Necklaces: How to Style Them Like a Pro",
    keyword: "layered gold necklaces",
    category: "style_guide",
    excerpt: "Master the art of layering gold necklaces. Learn proportions, combinations, and styling tips.",
  },
  {
    title: "Gold Jewelry for Sensitive Skin: Safe Options",
    keyword: "gold jewelry sensitive skin",
    category: "education",
    excerpt: "Find hypoallergenic gold jewelry options perfect for sensitive skin. No more irritation!",
  },
  {
    title: "Vintage Gold Jewelry: Timeless Elegance Explained",
    keyword: "vintage gold jewelry",
    category: "buyer_guide",
    excerpt: "Explore the charm and value of vintage gold jewelry. Learn what makes vintage pieces special.",
  },
  {
    title: "Gold Jewelry for Men: Breaking the Stereotype",
    keyword: "gold jewelry for men",
    category: "style_guide",
    excerpt: "Discover how men can confidently wear gold jewelry. From subtle to bold, find your style.",
  },
  {
    title: "Rose Gold vs Yellow Gold: The Complete Comparison",
    keyword: "rose gold vs yellow gold",
    category: "education",
    excerpt: "Understand the differences between rose gold and yellow gold. Which suits your skin tone?",
  },
  {
    title: "Gold Jewelry Investment: Is It Worth It?",
    keyword: "gold jewelry investment",
    category: "education",
    excerpt: "Learn whether gold jewelry is a good investment. Understand value, resale, and appreciation.",
  },
  {
    title: "Minimalist Gold Jewelry: Less is More",
    keyword: "minimalist gold jewelry",
    category: "style_guide",
    excerpt: "Embrace simplicity with minimalist gold jewelry. Discover how to build a timeless collection.",
  },
  {
    title: "Gold Bracelet Stacking: The Ultimate Guide",
    keyword: "gold bracelet stacking",
    category: "style_guide",
    excerpt: "Learn professional bracelet stacking techniques. Create stunning combinations with gold pieces.",
  },
  {
    title: "Gold Jewelry Care: How to Make It Last Forever",
    keyword: "gold jewelry care",
    category: "care_tips",
    excerpt: "Proper care extends the life of your gold jewelry. Learn storage, cleaning, and maintenance tips.",
  },
  {
    title: "Statement Gold Earrings: Make a Bold Impression",
    keyword: "statement gold earrings",
    category: "style_guide",
    excerpt: "Turn heads with statement gold earrings. Learn how to style bold pieces for any occasion.",
  },
  {
    title: "Gold Jewelry for Weddings: Bridal and Guest Guide",
    keyword: "gold jewelry for weddings",
    category: "occasion_guide",
    excerpt: "Choose the perfect gold jewelry for weddings. Bridal inspiration and guest outfit ideas.",
  },
  {
    title: "Sustainable Gold Jewelry: Ethical Choices",
    keyword: "sustainable gold jewelry",
    category: "education",
    excerpt: "Learn about ethically sourced and sustainable gold jewelry options for conscious consumers.",
  },
  {
    title: "Gold Jewelry Repair: When to DIY vs Professional",
    keyword: "gold jewelry repair",
    category: "care_tips",
    excerpt: "Know when to fix jewelry yourself and when to seek professional help. Save money wisely.",
  },
  {
    title: "Gold Jewelry for Everyday Wear: Durable Pieces",
    keyword: "gold jewelry everyday wear",
    category: "buyer_guide",
    excerpt: "Find durable gold jewelry perfect for daily wear. Style meets practicality.",
  },
  {
    title: "Gold Rings: Finding Your Perfect Fit and Style",
    keyword: "gold rings",
    category: "buyer_guide",
    excerpt: "Discover how to choose the perfect gold ring. Sizing, styles, and personal preference guide.",
  },
];

async function generateShopPosts() {
  console.log("🚀 Starting shop blog post generation...");
  console.log(`📝 Generating ${keywords.length} blog posts for .shop domain\n`);

  const posts = [];

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    console.log(`[${i + 1}/${keywords.length}] Generating: ${kw.title}`);

    try {
      // Generate blog content using LLM
      const contentResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert jewelry writer. Write engaging, SEO-optimized blog posts about gold jewelry. Include natural product recommendations and affiliate links. Write in markdown format.",
          },
          {
            role: "user",
            content: `Write a comprehensive blog post about "${kw.keyword}". 
            
Title: ${kw.title}
Category: ${kw.category}
Target keyword: ${kw.keyword}

Requirements:
- 1500-2000 words
- Include 3-5 internal links to relevant jewelry products
- Use natural language, not salesy
- Include practical tips and expert advice
- Format with H2 and H3 headers
- Include a conclusion with a call-to-action

Write in markdown format.`,
          },
        ],
      });

      const content = contentResponse.choices[0].message.content;

      // Generate hero image
      console.log(`  → Generating hero image...`);
      const imagePrompt = `Professional luxury gold jewelry photography for blog post about "${kw.keyword}". 
      High-end jewelry styling on elegant background. Soft natural lighting. 16:9 aspect ratio. 4K quality.`;

      const imageResponse = await generateImage({
        prompt: imagePrompt,
      });

      const heroImageUrl = imageResponse.url;

      posts.push({
        title: kw.title,
        slug: kw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: kw.excerpt,
        content,
        category: kw.category,
        heroImageUrl,
        keyword: kw.keyword,
        status: "published",
        createdAt: new Date(),
        publishedAt: new Date(),
      });

      console.log(`  ✓ Post created with hero image\n`);
    } catch (error) {
      console.error(`  ✗ Error generating post: ${error.message}\n`);
    }
  }

  console.log(`\n✅ Generated ${posts.length} blog posts`);
  console.log("📊 Posts ready for database insertion");

  return posts;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateShopPosts()
    .then((posts) => {
      console.log(`\n✨ Successfully generated ${posts.length} blog posts`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

export { generateShopPosts };
