/**
 * AI-Powered Hashtag Suggestion Service
 * Uses LLM to generate relevant hashtags based on blog content
 */

import { invokeLLM } from "./_core/llm";

interface HashtagSuggestion {
  hashtags: string[];
  brandHashtags: string[];
  trendingHashtags: string[];
}

/**
 * Generate AI-powered hashtag suggestions for blog post
 */
export async function generateHashtagSuggestions(blog: {
  title: string;
  excerpt?: string;
  category?: string;
  content?: string;
}): Promise<HashtagSuggestion> {
  try {
    const contentPreview = blog.content?.substring(0, 500) || blog.excerpt || blog.title;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a social media expert specializing in luxury jewelry marketing. Generate relevant hashtags for Instagram and Facebook posts.
          
Return a JSON object with three arrays:
- "hashtags": 8-12 relevant hashtags for the jewelry niche (e.g., #GoldJewelry, #LuxuryBracelets)
- "brandHashtags": 3-5 brand-specific hashtags (e.g., #LyvaraJewels, #GoldCollection)
- "trendingHashtags": 3-5 trending hashtags in jewelry/fashion (e.g., #JewelryTrends, #AccessoryGoals)

All hashtags should be relevant to luxury gold jewelry for women.`,
        },
        {
          role: "user",
          content: `Generate hashtags for this jewelry blog post:

Title: ${blog.title}
Category: ${blog.category || "General"}
Preview: ${contentPreview}

Return ONLY valid JSON, no markdown or extra text.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hashtag_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hashtags: {
                type: "array",
                items: { type: "string" },
                description: "Relevant hashtags for the jewelry niche",
              },
              brandHashtags: {
                type: "array",
                items: { type: "string" },
                description: "Brand-specific hashtags",
              },
              trendingHashtags: {
                type: "array",
                items: { type: "string" },
                description: "Trending hashtags in jewelry/fashion",
              },
            },
            required: ["hashtags", "brandHashtags", "trendingHashtags"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return getDefaultHashtags(blog.category);
    }

    const parsed = JSON.parse(content);
    return {
      hashtags: parsed.hashtags || [],
      brandHashtags: parsed.brandHashtags || [],
      trendingHashtags: parsed.trendingHashtags || [],
    };
  } catch (error) {
    console.error("Error generating hashtags:", error);
    return getDefaultHashtags(blog.category);
  }
}

/**
 * Get default hashtags if AI generation fails
 */
function getDefaultHashtags(category?: string): HashtagSuggestion {
  const categoryHashtags: Record<string, string[]> = {
    style_guide: ["#StyleGuide", "#JewelryStyle", "#FashionTips", "#AccessoryInspo"],
    trend_report: ["#JewelryTrends", "#FashionForward", "#TrendAlert", "#StyleTrends"],
    gift_ideas: ["#GiftGuide", "#GiftIdeas", "#PerfectGift", "#GiftShopping"],
    care_tips: ["#JewelryCare", "#CareTips", "#Maintenance", "#JewelryHelp"],
    brand_spotlight: ["#BrandSpotlight", "#DesignerJewelry", "#BrandFeature", "#JewelryDesigner"],
    seasonal: ["#SeasonalStyle", "#SeasonalCollection", "#NewSeason", "#SeasonalTrends"],
    promotional: ["#SpecialOffer", "#Sale", "#LimitedTime", "#Exclusive"],
  };

  const categoryTags = categoryHashtags[category || ""] || [];

  return {
    hashtags: [
      "#GoldJewelry",
      "#LuxuryJewelry",
      "#JewelryForWomen",
      "#GoldBracelets",
      "#GoldNecklaces",
      "#JewelryInspo",
      "#AccessoryGoals",
      "#JewelryLover",
    ],
    brandHashtags: [
      "#LyvaraJewels",
      "#LyvaraCollection",
      "#CuratedLuxury",
      "#GoldCollection",
    ],
    trendingHashtags: [
      "#JewelryTrends",
      "#AccessoryTrends",
      "#FashionJewelry",
      "#JewelryAddict",
      ...categoryTags,
    ],
  };
}

/**
 * Format hashtags for social media post
 */
export function formatHashtagsForPost(suggestions: HashtagSuggestion): string {
  const allHashtags = [
    ...suggestions.brandHashtags,
    ...suggestions.hashtags.slice(0, 8),
    ...suggestions.trendingHashtags,
  ];

  // Remove duplicates and limit to 30 hashtags (Instagram limit)
  const uniqueHashtags = Array.from(new Set(allHashtags)).slice(0, 30);

  return uniqueHashtags.join(" ");
}
