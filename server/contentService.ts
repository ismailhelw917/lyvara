/**
 * AI Content Generation Service
 *
 * Generates luxury jewelry blog posts, product descriptions, and promotional
 * content using the built-in LLM integration. All content is crafted to appeal
 * to women of all ages with a luxury, editorial tone.
 */

import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import type { Product } from "../drizzle/schema";

// ─── Blog Post Generation ─────────────────────────────────────────────────────
export interface GeneratedBlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  heroImagePrompt: string;
  category: "style_guide" | "trend_report" | "gift_ideas" | "care_tips" | "brand_spotlight" | "seasonal" | "promotional";
  tags: string[];
  featuredProductIds: number[];
}

const BLOG_CATEGORIES = [
  "style_guide",
  "trend_report",
  "gift_ideas",
  "care_tips",
  "seasonal",
  "promotional",
  "brand_spotlight",
] as const;

const BLOG_PROMPTS: Record<string, string> = {
  style_guide: "Write a luxury jewelry styling guide for women. Focus on how to layer gold necklaces, stack rings, or mix metals elegantly. Include keywords: gold jewelry for women, luxury gold jewelry, gold ring stacking, gold necklace layering.",
  trend_report: "Write an editorial trend report on the hottest gold jewelry trends this season. Reference runway looks and celebrity style. Include keywords: luxury gold jewelry, gold jewelry trends, designer gold jewelry, gold jewelry brands.",
  gift_ideas: "Write a curated gift guide featuring gold jewelry for women — covering birthdays, anniversaries, and self-gifting. Include keywords: gold jewelry gifts for women, luxury jewelry gifts, best gold jewelry brands, gold jewelry for special occasions.",
  care_tips: "Write an expert guide on caring for gold jewelry — cleaning, storage, and maintaining brilliance. Include keywords: how to care for gold jewelry, gold jewelry maintenance, gold jewelry cleaning tips, preserve gold jewelry.",
  seasonal: "Write a seasonal jewelry lookbook — how to style gold jewelry pieces for the current season. Include keywords: gold jewelry for women, luxury gold jewelry, seasonal jewelry trends, gold jewelry styling.",
  promotional: "Write a compelling promotional piece about a curated selection of gold jewelry deals and must-have pieces. Include keywords: luxury gold jewelry, best gold jewelry, affordable luxury jewelry, gold jewelry online.",
  brand_spotlight: "Write an editorial feature on a luxury gold jewelry brand, their heritage, craftsmanship, and signature pieces. Include keywords: luxury jewelry brands, gold jewelry designers, premium gold jewelry, jewelry brand story.",
};

export async function generateBlogPost(
  category: keyof typeof BLOG_PROMPTS,
  featuredProducts: Product[] = []
): Promise<GeneratedBlogPost> {
  const productContext =
    featuredProducts.length > 0
      ? `\n\nFeatured products to naturally incorporate:\n${featuredProducts
          .slice(0, 3)
          .map((p) => `- ${p.title} (${p.brand || "Premium Brand"}) at $${p.price}`)
          .join("\n")}`
      : "";

  const prompt = BLOG_PROMPTS[category] || BLOG_PROMPTS.style_guide;

  const systemPrompt = `You are a luxury jewelry editorial writer for LYVARA JEWELS, an exclusive curated jewelry platform for discerning women. 
Your writing style is elegant, authoritative, and aspirational — like a blend of Vogue and Harper's Bazaar. 
Write with quiet confidence, not loud salesmanship. Use sensory language, evoke emotion, and celebrate femininity.
Always write in a way that makes the reader feel she deserves the finest things.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${prompt}${productContext}

Requirements:
- Title: Elegant, editorial (8-12 words)
- Content: 600-900 words, written in rich editorial prose
- Include 3-4 subheadings using ## markdown
- Weave in product recommendations naturally (not salesy)
- End with a compelling call-to-action
- Tone: Luxury, feminine, aspirational

Respond in JSON format:
{
  "title": "...",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence preview (compelling, elegant)",
  "content": "full markdown content...",
  "heroImagePrompt": "detailed prompt for a luxury jewelry lifestyle photo",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "category": "${category}"
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
            title: { type: "string" },
            slug: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string" },
            heroImagePrompt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            category: { type: "string" },
          },
          required: ["title", "slug", "excerpt", "content", "heroImagePrompt", "tags", "category"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) throw new Error("LLM returned empty response for blog post");
  const raw = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
  const parsed = JSON.parse(raw);

  // Ensure unique slug
  const timestamp = Date.now();
  const slug = `${parsed.slug}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  return {
    title: parsed.title,
    slug,
    content: parsed.content,
    excerpt: parsed.excerpt,
    heroImagePrompt: parsed.heroImagePrompt,
    category: parsed.category as GeneratedBlogPost["category"],
    tags: parsed.tags || [],
    featuredProductIds: featuredProducts.map((p) => p.id),
  };
}

// ─── Hero Image Generation ────────────────────────────────────────────────────
export async function generateHeroImage(prompt: string): Promise<string | null> {
  try {
    const luxuryPrompt = `Luxury jewelry lifestyle photography: ${prompt}. 
Soft natural lighting, elegant composition, white marble or silk background, 
high-end editorial style, feminine aesthetic, shallow depth of field, 
professional product photography for a luxury jewelry brand. 
No text, no watermarks, photorealistic.`;

    const result = await generateImage({ prompt: luxuryPrompt });
    return result.url ?? null;
  } catch (error) {
    console.error("[ContentService] Hero image generation failed:", error);
    return null;
  }
}

// ─── Product Description Enhancement ─────────────────────────────────────────
export async function generateProductDescription(product: Product): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a luxury jewelry copywriter for LYVARA JEWELS. Write product descriptions that are evocative, elegant, and conversion-focused. Appeal to women who appreciate fine craftsmanship.",
        },
        {
          role: "user",
          content: `Write a compelling product description (2-3 sentences) for:
Product: ${product.title}
Brand: ${product.brand || "Premium Brand"}
Metal: ${product.metalType?.replace("_", " ")}
Price: $${product.price}

Make it sensory, aspirational, and elegant. Focus on how it makes the wearer feel.`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    return (typeof content === "string" ? content : null) || product.title;
  } catch {
    return product.title;
  }
}

// ─── Promotional Ad Copy ──────────────────────────────────────────────────────
export async function generateAdCopy(products: Product[]): Promise<{ headline: string; body: string; cta: string }> {
  try {
    const productList = products
      .slice(0, 5)
      .map((p) => `${p.title} — $${p.price}`)
      .join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a luxury advertising copywriter. Create compelling, elegant ad copy for a high-end jewelry brand targeting women.",
        },
        {
          role: "user",
          content: `Create promotional ad copy for these jewelry pieces:\n${productList}\n\nReturn JSON: { "headline": "...", "body": "...", "cta": "..." }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ad_copy",
          strict: true,
          schema: {
            type: "object",
            properties: {
              headline: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
            },
            required: ["headline", "body", "cta"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) return { headline: "Discover Your Perfect Piece", body: "Curated luxury jewelry for the modern woman.", cta: "Shop Now" };
    const raw = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    return JSON.parse(raw);
  } catch {
    return { headline: "Discover Your Perfect Piece", body: "Curated luxury jewelry for the modern woman.", cta: "Shop Now" };
  }
}

// ─── Performance Ranking Algorithm ───────────────────────────────────────────
export function calculatePerformanceScore(product: {
  clickCount: number;
  conversionCount: number;
  estimatedRevenue: string | null;
  amazonRating: number | null;
  reviewCount: number | null;
  priceDropPercent: number | null;
  createdAt: Date;
}): number {
  const clicks = product.clickCount || 0;
  const conversions = product.conversionCount || 0;
  const revenue = parseFloat(product.estimatedRevenue || "0");
  const rating = product.amazonRating || 0;
  const reviews = product.reviewCount || 0;
  const priceDrop = product.priceDropPercent || 0;

  // Age factor: newer products get a slight boost
  const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageFactor = Math.max(0.5, 1 - ageInDays / 90); // Decays over 90 days

  // CTR component (0-30 points)
  const ctrScore = clicks > 0 ? Math.min(30, (conversions / clicks) * 100 * 3) : 0;

  // Revenue component (0-30 points)
  const revenueScore = Math.min(30, revenue / 10);

  // Amazon quality component (0-25 points)
  const ratingScore = (rating / 5) * 15;
  const reviewScore = Math.min(10, Math.log10(reviews + 1) * 5);

  // Engagement component (0-15 points)
  const clickScore = Math.min(10, Math.log10(clicks + 1) * 4);
  const discountScore = Math.min(5, priceDrop / 5);

  const rawScore = (ctrScore + revenueScore + ratingScore + reviewScore + clickScore + discountScore) * ageFactor;
  return Math.round(rawScore * 100) / 100;
}

export function classifyProducts(products: { id: number; performanceScore: number }[]): {
  topPerformers: number[];
  midPerformers: number[];
  underPerformers: number[];
} {
  const sorted = [...products].sort((a, b) => b.performanceScore - a.performanceScore);
  const total = sorted.length;
  const topCount = Math.max(1, Math.ceil(total * 0.2)); // Top 20%
  const bottomCount = Math.max(1, Math.ceil(total * 0.15)); // Bottom 15%

  return {
    topPerformers: sorted.slice(0, topCount).map((p) => p.id),
    midPerformers: sorted.slice(topCount, total - bottomCount).map((p) => p.id),
    underPerformers: sorted.slice(total - bottomCount).map((p) => p.id),
  };
}
