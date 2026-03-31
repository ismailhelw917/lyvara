/**
 * Shop Content Generator
 *
 * Generates SEO-optimized blog posts for lyvarajewels.shop domain
 * targeting long-tail keywords with internal links back to main domain
 */

import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

// High-value long-tail keywords organized by pillar
export const SHOP_KEYWORDS = {
  buyer_guides: [
    { keyword: "affordable gold jewelry for women", volume: 1200, competition: "low" },
    { keyword: "gold jewelry under $100", volume: 850, competition: "low" },
    { keyword: "best gold jewelry brands", volume: 1800, competition: "medium" },
    { keyword: "14k vs 18k gold jewelry", volume: 650, competition: "low" },
    { keyword: "how to choose gold jewelry", volume: 520, competition: "low" },
    { keyword: "gold jewelry for sensitive skin", volume: 280, competition: "low" },
    { keyword: "luxury gold jewelry under $500", volume: 420, competition: "low" },
    { keyword: "gold jewelry investment guide", volume: 310, competition: "low" },
    { keyword: "gold jewelry quality guide", volume: 240, competition: "low" },
    { keyword: "gold jewelry for different skin tones", volume: 180, competition: "low" },
    { keyword: "affordable luxury jewelry brands", volume: 380, competition: "low" },
    { keyword: "gold jewelry for everyday wear", volume: 550, competition: "low" },
    { keyword: "gold jewelry sizing guide", volume: 290, competition: "low" },
    { keyword: "heirloom gold jewelry guide", volume: 150, competition: "low" },
    { keyword: "professional gold jewelry guide", volume: 210, competition: "low" },
  ],
  gift_guides: [
    { keyword: "gold jewelry gifts for women", volume: 1900, competition: "medium" },
    { keyword: "luxury jewelry gifts under $200", volume: 680, competition: "low" },
    { keyword: "best gold jewelry gifts for mom", volume: 520, competition: "low" },
    { keyword: "gold jewelry gifts for girlfriend", volume: 410, competition: "low" },
    { keyword: "personalized gold jewelry gifts", volume: 380, competition: "low" },
    { keyword: "gold jewelry gift sets", volume: 290, competition: "low" },
    { keyword: "gold jewelry gifts for bridesmaids", volume: 240, competition: "low" },
    { keyword: "gold jewelry gifts for 30th birthday", volume: 180, competition: "low" },
    { keyword: "anniversary gold jewelry gifts", volume: 320, competition: "low" },
    { keyword: "graduation gold jewelry gifts", volume: 190, competition: "low" },
    { keyword: "luxury gold jewelry gifts", volume: 350, competition: "medium" },
    { keyword: "affordable gold jewelry gifts", volume: 420, competition: "low" },
  ],
  care_tips: [
    { keyword: "how to clean gold jewelry at home", volume: 2800, competition: "low" },
    { keyword: "does gold jewelry tarnish", volume: 1200, competition: "low" },
    { keyword: "how to tell if gold jewelry is real", volume: 980, competition: "low" },
    { keyword: "gold jewelry care tips", volume: 420, competition: "low" },
    { keyword: "how to remove tarnish from gold jewelry", volume: 580, competition: "low" },
    { keyword: "best way to store gold jewelry", volume: 340, competition: "low" },
    { keyword: "gold jewelry maintenance tips", volume: 290, competition: "low" },
    { keyword: "how to polish gold jewelry", volume: 410, competition: "low" },
    { keyword: "gold jewelry cleaning products", volume: 320, competition: "low" },
    { keyword: "professional gold jewelry cleaning", volume: 210, competition: "low" },
  ],
  trends: [
    { keyword: "gold jewelry trends 2026", volume: 890, competition: "medium" },
    { keyword: "minimalist gold jewelry", volume: 1100, competition: "medium" },
    { keyword: "vintage gold jewelry for women", volume: 740, competition: "low" },
    { keyword: "sustainable gold jewelry brands", volume: 420, competition: "low" },
    { keyword: "gold jewelry for professional women", volume: 310, competition: "low" },
    { keyword: "layered gold necklaces", volume: 480, competition: "low" },
    { keyword: "gold jewelry stacking guide", volume: 280, competition: "low" },
    { keyword: "celebrity gold jewelry inspiration", volume: 350, competition: "low" },
    { keyword: "gold jewelry for different seasons", volume: 220, competition: "low" },
    { keyword: "gold jewelry color combinations", volume: 180, competition: "low" },
  ],
  education: [
    { keyword: "gold plated vs gold filled", volume: 520, competition: "low" },
    { keyword: "gold jewelry hallmarks explained", volume: 310, competition: "low" },
    { keyword: "gold purity karats explained", volume: 420, competition: "low" },
    { keyword: "gold jewelry certifications", volume: 240, competition: "low" },
    { keyword: "ethical gold jewelry", volume: 380, competition: "low" },
    { keyword: "lab-grown vs mined gold", volume: 290, competition: "low" },
    { keyword: "gold jewelry resale value", volume: 210, competition: "low" },
    { keyword: "fair trade gold jewelry", volume: 180, competition: "low" },
    { keyword: "gold jewelry counterfeits", volume: 350, competition: "low" },
    { keyword: "gold jewelry quality issues", volume: 160, competition: "low" },
  ],
  problem_solution: [
    { keyword: "gold jewelry allergies solutions", volume: 190, competition: "low" },
    { keyword: "why gold jewelry turns skin green", volume: 420, competition: "low" },
    { keyword: "gold jewelry causing itching", volume: 280, competition: "low" },
    { keyword: "how to fix broken gold jewelry", volume: 340, competition: "low" },
    { keyword: "gold jewelry sizing issues", volume: 210, competition: "low" },
    { keyword: "gold jewelry discoloration causes", volume: 180, competition: "low" },
    { keyword: "gold jewelry loose stones fix", volume: 160, competition: "low" },
    { keyword: "gold jewelry clasp problems", volume: 140, competition: "low" },
    { keyword: "gold jewelry scratches prevention", volume: 190, competition: "low" },
    { keyword: "gold jewelry fading prevention", volume: 150, competition: "low" },
    { keyword: "gold jewelry oxidation explained", volume: 130, competition: "low" },
    { keyword: "best gold jewelry brands to avoid", volume: 210, competition: "low" },
    { keyword: "gold jewelry quality red flags", volume: 170, competition: "low" },
  ],
};

export interface ShopContentRequest {
  keyword: string;
  pillar: string;
  volume: number;
  competition: string;
}

/**
 * Generate SEO-optimized blog post for shop domain
 */
export async function generateShopBlogPost(request: ShopContentRequest): Promise<{
  title: string;
  excerpt: string;
  content: string;
  heroImagePrompt: string;
  internalLinks: Array<{ text: string; url: string; type: "product" | "category" | "blog_post" | "home" }>;
}> {
  const { keyword, pillar } = request;

  // Generate title
  const titlePrompt = `Create an SEO-optimized blog post title for the keyword "${keyword}". 
The title should:
- Be 50-60 characters
- Include the main keyword
- Be compelling and click-worthy
- Be suitable for a luxury gold jewelry blog

Return ONLY the title, nothing else.`;

  const titleResponse = await invokeLLM({
    messages: [{ role: "user", content: titlePrompt }],
  });

  const titleContent = titleResponse.choices[0].message.content;
  const title = (typeof titleContent === 'string' ? titleContent : '')?.trim() || `Complete Guide to ${keyword}`;

  // Generate excerpt
  const excerptPrompt = `Write a compelling 2-3 sentence excerpt for a blog post about "${keyword}".
The excerpt should:
- Be 100-150 characters
- Capture the reader's attention
- Include the keyword naturally
- Be suitable for a luxury gold jewelry blog

Return ONLY the excerpt, nothing else.`;

  const excerptResponse = await invokeLLM({
    messages: [{ role: "user", content: excerptPrompt }],
  });

  const excerptContent = excerptResponse.choices[0].message.content;
  const excerpt = (typeof excerptContent === 'string' ? excerptContent : '')?.trim() || `Discover everything you need to know about ${keyword}`;

  // Generate main content
  const contentPrompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}" for a luxury gold jewelry website.

Requirements:
- 800-1000 words
- Include the keyword in the first 100 words
- Use H2 and H3 headers for structure
- Include practical tips and advice
- Target audience: women interested in luxury gold jewelry
- Pillar category: ${pillar}
- Professional, informative tone
- Include natural CTAs like "explore our collection" or "shop now"

Format the response with proper markdown headers (##, ###).`;

  const contentResponse = await invokeLLM({
    messages: [{ role: "user", content: contentPrompt }],
  });

  const contentData = contentResponse.choices[0].message.content;
  const content = (typeof contentData === 'string' ? contentData : '') || '';

  // Generate hero image prompt
  const imagePrompt = `Create a detailed image generation prompt for a luxury gold jewelry blog post about "${keyword}".
The image should:
- Feature elegant gold jewelry
- Be professional and high-quality
- Represent the topic "${keyword}"
- Be suitable for a luxury jewelry website
- Include lighting and styling details

Return ONLY the image prompt, nothing else.`;

  const imagePromptResponse = await invokeLLM({
    messages: [{ role: "user", content: imagePrompt }],
  });

  const imagePromptContent = imagePromptResponse.choices[0].message.content;
  const heroImagePrompt = (typeof imagePromptContent === 'string' ? imagePromptContent : '')?.trim() || `Luxury gold jewelry collection, professional photography, elegant styling`;

  // Generate internal links
  const linksPrompt = `For a blog post about "${keyword}", generate 3 relevant internal links to a luxury gold jewelry website.
Return a JSON array with this structure:
[
  { "text": "anchor text", "url": "/path/to/page", "type": "product|category|blog_post|home" }
]

Make the links:
- Relevant to the topic
- Natural and helpful
- Mix of product, category, and home links
- Use realistic URL paths

Return ONLY valid JSON, nothing else.`;

  const linksResponse = await invokeLLM({
    messages: [{ role: "user", content: linksPrompt }],
  });

  let internalLinks: Array<{ text: string; url: string; type: "product" | "category" | "blog_post" | "home" }> = [];
  try {
    const linksContent = linksResponse.choices[0].message.content;
    const linksText = (typeof linksContent === 'string' ? linksContent : '') || "[]";
    internalLinks = JSON.parse(linksText);
  } catch (error) {
    // Fallback links
    internalLinks = [
      { text: "Browse our gold jewelry collection", url: "/shop/necklaces", type: "category" },
      { text: "Shop luxury gold bracelets", url: "/shop/bracelets", type: "category" },
      { text: "View all gold jewelry", url: "/shop", type: "home" },
    ];
  }

  return {
    title,
    excerpt,
    content,
    heroImagePrompt,
    internalLinks,
  };
}

/**
 * Get all keywords for a specific pillar
 */
export function getKeywordsByPillar(pillar: keyof typeof SHOP_KEYWORDS): ShopContentRequest[] {
  return SHOP_KEYWORDS[pillar].map((kw) => ({
    keyword: kw.keyword,
    pillar,
    volume: kw.volume,
    competition: kw.competition,
  }));
}

/**
 * Get all keywords across all pillars
 */
export function getAllKeywords(): ShopContentRequest[] {
  const all: ShopContentRequest[] = [];
  for (const pillar of Object.keys(SHOP_KEYWORDS) as Array<keyof typeof SHOP_KEYWORDS>) {
    all.push(...getKeywordsByPillar(pillar));
  }
  return all;
}

/**
 * Get top keywords by search volume
 */
export function getTopKeywords(limit: number = 20): ShopContentRequest[] {
  return getAllKeywords().sort((a, b) => b.volume - a.volume).slice(0, limit);
}

/**
 * Get low-competition keywords (best for ranking quickly)
 */
export function getLowCompetitionKeywords(): ShopContentRequest[] {
  return getAllKeywords().filter((kw) => kw.competition === "low").sort((a, b) => b.volume - a.volume);
}
