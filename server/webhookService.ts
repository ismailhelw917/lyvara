import { z } from "zod";

// Webhook payload schema for blog posts
export const BlogWebhookPayloadSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
  imageUrl: z.string().optional(),
  category: z.string(),
  publishedAt: z.number(), // Unix timestamp
  url: z.string(),
});

export type BlogWebhookPayload = z.infer<typeof BlogWebhookPayloadSchema>;

/**
 * Send webhook to Zapier when a new blog post is published
 * This triggers automatic posting to Facebook and Instagram
 */
export async function sendBlogWebhook(
  payload: BlogWebhookPayload,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!webhookUrl) {
      console.warn("[Webhook] No webhook URL configured, skipping");
      return { success: false, error: "No webhook URL configured" };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: "lyvara-jewelry-blog",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        `[Webhook] Failed to send: ${response.status} - ${error}`
      );
      return {
        success: false,
        error: `HTTP ${response.status}: ${error}`,
      };
    }

    console.log(`[Webhook] Successfully sent blog post: ${payload.title}`);
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook] Error sending webhook: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Validate webhook URL format
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Extract excerpt from blog content
 */
export function extractExcerpt(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, "");
  // Truncate to maxLength
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}
