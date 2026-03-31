/**
 * Automated Shop Content Generation Job
 * Generates new blog posts for .shop domain on a schedule
 */

import { getDb } from "./db";
import { shopBlogPosts } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

interface ShopContentJob {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  postsGenerated: number;
  error?: string;
}

// Keywords to target - rotates through these for continuous content generation
const shopKeywords = [
  { keyword: "gold jewelry under 100", category: "buyer_guide" },
  { keyword: "luxury gold jewelry brands", category: "brand_spotlight" },
  { keyword: "gold jewelry for special occasions", category: "occasion_guide" },
  { keyword: "how to store gold jewelry", category: "care_tips" },
  { keyword: "gold jewelry hallmarks explained", category: "education" },
  { keyword: "gold jewelry for sensitive skin", category: "education" },
  { keyword: "best gold jewelry websites", category: "buyer_guide" },
  { keyword: "gold jewelry color guide", category: "education" },
  { keyword: "gold jewelry for men", category: "style_guide" },
  { keyword: "gold jewelry investment value", category: "education" },
];

/**
 * Generate a single blog post for .shop domain
 */
export async function generateShopBlogPost(keyword: string, category: string): Promise<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImageUrl: string;
}> {
  try {
    // Generate title and content using LLM
    const contentResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert jewelry blogger. Write engaging, SEO-optimized blog posts about gold jewelry. 
          Include natural product recommendations and affiliate links. Write in markdown format.
          Focus on the target keyword naturally throughout the post.`,
        },
        {
          role: "user",
          content: `Create a blog post about "${keyword}" for category "${category}".

Requirements:
- Generate an engaging title that includes the keyword
- Write 1500-2000 words
- Include 3-5 natural product recommendations with affiliate links
- Use markdown format with H2 and H3 headers
- Include practical tips and expert advice
- End with a compelling call-to-action
- Make it SEO-optimized for the target keyword

Format your response as JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "blog_post",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Blog post title" },
              excerpt: { type: "string", description: "Short excerpt/summary" },
              content: { type: "string", description: "Full blog post content in markdown" },
            },
            required: ["title", "excerpt", "content"],
            additionalProperties: false,
          },
        },
      },
    });

    const contentText = contentResponse.choices[0].message.content;
    const parsedContent = typeof contentText === "string" ? contentText : JSON.stringify(contentText);
    const parsed = JSON.parse(parsedContent);

    // Generate hero image
    const imagePrompt = `Professional luxury gold jewelry photography for blog post about "${keyword}". 
    High-end jewelry styling on elegant background. Soft natural lighting. 16:9 aspect ratio. 4K quality. 
    Professional product photography aesthetic.`;

    const imageResponse = await generateImage({
      prompt: imagePrompt,
    });

    const imageUrl = imageResponse.url || "";
    const slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      title: parsed.title,
      slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      heroImageUrl: imageUrl,
    };
  } catch (error) {
    console.error(`Error generating blog post for keyword "${keyword}":`, error);
    throw error;
  }
}

/**
 * Run automated content generation job
 * Generates 1-2 new posts per week
 */
export async function runShopContentGenerationJob(): Promise<ShopContentJob> {
  const job: ShopContentJob = {
    id: `job-${Date.now()}`,
    status: "running",
    createdAt: new Date(),
    postsGenerated: 0,
  };

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Select a random keyword to generate content for
    const selectedKeyword = shopKeywords[Math.floor(Math.random() * shopKeywords.length)];

    console.log(`🚀 Starting shop content generation job for keyword: "${selectedKeyword.keyword}"`);

    // Generate blog post
    const post = await generateShopBlogPost(selectedKeyword.keyword, selectedKeyword.category);

    // Insert into database
    await db.insert(shopBlogPosts).values({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      heroImageUrl: post.heroImageUrl,
      targetKeyword: selectedKeyword.keyword,
      pillar: selectedKeyword.category,
      status: "published",
      publishedAt: new Date(),
    });

    job.postsGenerated = 1;
    job.status = "completed";
    job.completedAt = new Date();

    console.log(`✅ Successfully generated blog post: "${post.title}"`);

    return job;
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown error";
    job.completedAt = new Date();

    console.error(`❌ Shop content generation job failed:`, error);

    return job;
  }
}

/**
 * Schedule automated content generation
 * Runs weekly to generate new posts
 */
export async function scheduleShopContentGeneration(): Promise<void> {
  // This would be called by a scheduler (e.g., node-cron, AWS Lambda, etc.)
  // For now, we export the job function to be called by external schedulers

  console.log("📅 Shop content generation scheduler initialized");
  console.log("⏰ Posts will be generated weekly automatically");
}

/**
 * Get job history
 */
export async function getShopContentJobHistory(limit: number = 10): Promise<ShopContentJob[]> {
  // In a real implementation, this would query a jobs table
  // For now, return empty array
  return [];
}
