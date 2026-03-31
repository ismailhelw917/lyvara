/**
 * Blog Image Generator Service
 *
 * Automatically generates hero images for blog posts using AI
 * Integrates with the image generation service
 */

import { generateImage } from "./_core/imageGeneration";

export interface BlogImagePrompt {
  title: string;
  category: string;
  keywords: string[];
}

/**
 * Generate image prompts based on blog post metadata
 */
export function generateImagePrompt(blog: BlogImagePrompt): string {
  const categoryPrompts: Record<string, string> = {
    style_guide: `Luxury minimalist gold jewelry lifestyle photography featuring delicate gold pieces arranged artfully. Professional product photography with soft natural lighting, warm golden hour tones, elegant aesthetic. High-end jewelry styling on marble or white surfaces with subtle lifestyle elements.`,
    
    trend_report: `Fashion-forward luxury jewelry trend photography. Modern, contemporary styling of gold jewelry pieces. Editorial fashion photography with sophisticated lighting, luxury aesthetic, trending jewelry styles displayed on elegant backgrounds.`,
    
    gift_ideas: `Luxury gift presentation photography. Beautifully wrapped or displayed gold jewelry gifts. Premium packaging, gift wrapping, and presentation styling. Warm, inviting aesthetic perfect for gift guides and special occasions.`,
    
    care_tips: `Jewelry care and maintenance photography. Delicate hands caring for gold jewelry pieces. Soft, clean aesthetic showing jewelry cleaning, polishing, or storage. Educational but elegant presentation of jewelry care.`,
    
    brand_spotlight: `Luxury brand jewelry photography. Premium gold jewelry pieces displayed in high-end retail aesthetic. Sophisticated lighting, elegant backgrounds, professional jewelry photography style.`,
    
    seasonal: `Seasonal jewelry styling photography. Gold jewelry pieces styled for specific seasons. Seasonal color palettes and styling elements integrated with luxury jewelry photography.`,
    
    promotional: `Eye-catching promotional jewelry photography. Gold jewelry pieces displayed with compelling visual elements. High-impact, attention-grabbing aesthetic suitable for promotions and sales.`,
  };

  const basePrompt = categoryPrompts[blog.category] || categoryPrompts.style_guide;
  const keywordPhrase = blog.keywords.slice(0, 3).join(", ");

  return `${basePrompt} Focus on: ${keywordPhrase}. 16:9 aspect ratio, 4K quality, professional jewelry photography, luxury aesthetic. CDN-ready image suitable for blog hero sections.`;
}

/**
 * Generate hero image for a blog post
 */
export async function generateBlogHeroImage(blog: BlogImagePrompt): Promise<{ url: string; prompt: string }> {
  try {
    const prompt = generateImagePrompt(blog);

    const result = await generateImage({
      prompt,
    });

    if (!result.url) {
      throw new Error("Failed to generate image: no URL returned");
    }

    return {
      url: result.url,
      prompt,
    };
  } catch (error) {
    console.error("Error generating blog hero image:", error);
    throw error;
  }
}

/**
 * Generate images for multiple blog posts in parallel
 */
export async function generateBlogHeroImages(
  blogs: BlogImagePrompt[]
): Promise<Array<{ blog: BlogImagePrompt; url: string; prompt: string; error?: string }>> {
  const results = await Promise.allSettled(
    blogs.map(async (blog) => {
      const { url, prompt } = await generateBlogHeroImage(blog);
      return { blog, url, prompt };
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        blog: blogs[index],
        url: "",
        prompt: "",
        error: result.reason?.message || "Unknown error",
      };
    }
  });
}
