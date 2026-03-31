/**
 * Zapier Integration Service
 * Handles webhooks and integrations with Zapier for automated backlinks and partnerships
 */

import { z } from "zod";

/**
 * Webhook payload schemas for different Zapier triggers
 */

// Blog post published webhook
export const BlogPostPublishedSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  url: z.string(),
  excerpt: z.string(),
  content: z.string(),
  keywords: z.array(z.string()),
  category: z.string(),
  heroImageUrl: z.string().optional(),
  publishedAt: z.string().datetime(),
  domain: z.enum(["lyvarajewels.com", "lyvarajewels.shop"]),
});

export type BlogPostPublished = z.infer<typeof BlogPostPublishedSchema>;

// Partnership opportunity webhook
export const PartnershipOpportunitySchema = z.object({
  partnerName: z.string(),
  partnerType: z.enum(["influencer", "brand", "blog", "podcast", "directory"]),
  contactEmail: z.string().email(),
  website: z.string().url().optional(),
  socialHandle: z.string().optional(),
  followers: z.number().optional(),
  relevanceScore: z.number().min(0).max(100),
  proposedCollaboration: z.string(),
  estimatedValue: z.number().optional(),
});

export type PartnershipOpportunity = z.infer<typeof PartnershipOpportunitySchema>;

// Backlink found webhook
export const BacklinkFoundSchema = z.object({
  sourceUrl: z.string().url(),
  targetUrl: z.string().url(),
  anchorText: z.string(),
  domain: z.string(),
  domainAuthority: z.number().optional(),
  referralTraffic: z.number().optional(),
  foundAt: z.string().datetime(),
});

export type BacklinkFound = z.infer<typeof BacklinkFoundSchema>;

/**
 * Zapier webhook handlers
 */

/**
 * Handle blog post published event
 * Triggers: Guest post outreach, social media sharing, directory submissions
 */
export async function handleBlogPostPublished(payload: BlogPostPublished): Promise<{
  success: boolean;
  triggeredWorkflows: string[];
}> {
  const triggeredWorkflows: string[] = [];

  try {
    // Trigger 1: Guest post outreach
    if (process.env.ZAPIER_GUEST_POST_WEBHOOK) {
      await fetch(process.env.ZAPIER_GUEST_POST_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          url: payload.url,
          excerpt: payload.excerpt,
          keywords: payload.keywords,
          domain: payload.domain,
          category: payload.category,
        }),
      });
      triggeredWorkflows.push("guest_post_outreach");
    }

    // Trigger 2: Social media syndication
    if (process.env.ZAPIER_SOCIAL_SYNDICATION_WEBHOOK) {
      await fetch(process.env.ZAPIER_SOCIAL_SYNDICATION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          url: payload.url,
          excerpt: payload.excerpt,
          heroImageUrl: payload.heroImageUrl,
          keywords: payload.keywords,
        }),
      });
      triggeredWorkflows.push("social_syndication");
    }

    // Trigger 3: Directory submissions
    if (process.env.ZAPIER_DIRECTORY_SUBMISSION_WEBHOOK) {
      await fetch(process.env.ZAPIER_DIRECTORY_SUBMISSION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          url: payload.url,
          excerpt: payload.excerpt,
          category: payload.category,
          keywords: payload.keywords,
        }),
      });
      triggeredWorkflows.push("directory_submissions");
    }

    // Trigger 4: Influencer outreach (if relevant keywords)
    if (
      payload.keywords.some((k) =>
        ["styling", "trends", "tips", "guide"].includes(k.toLowerCase())
      )
    ) {
      if (process.env.ZAPIER_INFLUENCER_OUTREACH_WEBHOOK) {
        await fetch(process.env.ZAPIER_INFLUENCER_OUTREACH_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            url: payload.url,
            excerpt: payload.excerpt,
            keywords: payload.keywords,
          }),
        });
        triggeredWorkflows.push("influencer_outreach");
      }
    }

    // Trigger 5: Press release (if major content)
    if (payload.category === "trend_report" || payload.keywords.length > 5) {
      if (process.env.ZAPIER_PRESS_RELEASE_WEBHOOK) {
        await fetch(process.env.ZAPIER_PRESS_RELEASE_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            url: payload.url,
            excerpt: payload.excerpt,
            category: payload.category,
          }),
        });
        triggeredWorkflows.push("press_release");
      }
    }

    console.log(`✅ Blog post published webhook processed. Triggered: ${triggeredWorkflows.join(", ")}`);

    return {
      success: true,
      triggeredWorkflows,
    };
  } catch (error) {
    console.error("❌ Error processing blog post published webhook:", error);
    throw error;
  }
}

/**
 * Handle partnership opportunity found
 * Triggers: Partnership outreach, CRM update, email notification
 */
export async function handlePartnershipOpportunity(
  payload: PartnershipOpportunity
): Promise<{
  success: boolean;
  actions: string[];
}> {
  const actions: string[] = [];

  try {
    // Action 1: Send partnership outreach email
    if (process.env.ZAPIER_PARTNERSHIP_OUTREACH_WEBHOOK) {
      await fetch(process.env.ZAPIER_PARTNERSHIP_OUTREACH_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerName: payload.partnerName,
          contactEmail: payload.contactEmail,
          partnerType: payload.partnerType,
          proposedCollaboration: payload.proposedCollaboration,
          website: payload.website,
        }),
      });
      actions.push("partnership_email_sent");
    }

    // Action 2: Add to CRM
    if (process.env.ZAPIER_CRM_UPDATE_WEBHOOK) {
      await fetch(process.env.ZAPIER_CRM_UPDATE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.partnerName,
          email: payload.contactEmail,
          type: payload.partnerType,
          relevanceScore: payload.relevanceScore,
          estimatedValue: payload.estimatedValue,
          status: "prospect",
        }),
      });
      actions.push("crm_updated");
    }

    // Action 3: Notify owner if high relevance
    if (payload.relevanceScore > 80) {
      if (process.env.ZAPIER_OWNER_NOTIFICATION_WEBHOOK) {
        await fetch(process.env.ZAPIER_OWNER_NOTIFICATION_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `High-Value Partnership Opportunity: ${payload.partnerName}`,
            message: `${payload.partnerType} with ${payload.followers || "unknown"} followers. Relevance: ${payload.relevanceScore}%`,
            link: payload.website,
          }),
        });
        actions.push("owner_notified");
      }
    }

    console.log(`✅ Partnership opportunity processed. Actions: ${actions.join(", ")}`);

    return {
      success: true,
      actions,
    };
  } catch (error) {
    console.error("❌ Error processing partnership opportunity:", error);
    throw error;
  }
}

/**
 * Handle backlink found event
 * Triggers: Backlink tracking, competitor analysis, outreach follow-up
 */
export async function handleBacklinkFound(payload: BacklinkFound): Promise<{
  success: boolean;
  tracked: boolean;
}> {
  try {
    // Track in spreadsheet/database
    if (process.env.ZAPIER_BACKLINK_TRACKING_WEBHOOK) {
      await fetch(process.env.ZAPIER_BACKLINK_TRACKING_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: payload.sourceUrl,
          targetUrl: payload.targetUrl,
          anchorText: payload.anchorText,
          domain: payload.domain,
          domainAuthority: payload.domainAuthority,
          referralTraffic: payload.referralTraffic,
          foundAt: payload.foundAt,
        }),
      });
    }

    console.log(`✅ Backlink tracked: ${payload.sourceUrl} → ${payload.targetUrl}`);

    return {
      success: true,
      tracked: true,
    };
  } catch (error) {
    console.error("❌ Error tracking backlink:", error);
    throw error;
  }
}

/**
 * Generate Zapier webhook payload for blog post
 */
export function generateBlogPostWebhookPayload(post: {
  id: string;
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  content: string;
  keywords?: string[];
  category?: string;
  heroImageUrl?: string;
  publishedAt: Date;
  domain: "lyvarajewels.com" | "lyvarajewels.shop";
}): BlogPostPublished {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    url: post.url,
    excerpt: post.excerpt,
    content: post.content,
    keywords: post.keywords || [],
    category: post.category || "general",
    heroImageUrl: post.heroImageUrl,
    publishedAt: post.publishedAt.toISOString(),
    domain: post.domain,
  };
}

/**
 * Generate partnership opportunity payload
 */
export function generatePartnershipOpportunityPayload(partner: {
  name: string;
  type: "influencer" | "brand" | "blog" | "podcast" | "directory";
  email: string;
  website?: string;
  socialHandle?: string;
  followers?: number;
  relevanceScore: number;
  proposedCollaboration: string;
  estimatedValue?: number;
}): PartnershipOpportunity {
  return {
    partnerName: partner.name,
    partnerType: partner.type,
    contactEmail: partner.email,
    website: partner.website,
    socialHandle: partner.socialHandle,
    followers: partner.followers,
    relevanceScore: partner.relevanceScore,
    proposedCollaboration: partner.proposedCollaboration,
    estimatedValue: partner.estimatedValue,
  };
}
