/**
 * Social Media Automation Scheduler
 * Handles automatic daily posting of blog content to Facebook and Instagram
 */

import { getDb, getBlogPosts, recordFacebookShare, recordInstagramShare } from "./db";
import { postBlogToFacebook, postBlogToInstagram } from "./facebookService";

const POSTING_HOUR = 13; // 1 PM EST
const POSTING_MINUTE = 0;

/**
 * Check if it's time to post (runs daily at optimal time)
 */
function isPostingTime(): boolean {
  const now = new Date();
  return now.getHours() === POSTING_HOUR && now.getMinutes() === POSTING_MINUTE;
}

/**
 * Get the last posted blog post timestamp from storage
 */
async function getLastPostedTimestamp(): Promise<number> {
  // For now, return 0 to always post the latest blog
  // In production, you'd store this in a database or cache
  return 0;
}

/**
 * Update last posted timestamp
 */
async function updateLastPostedTimestamp(timestamp: number): Promise<void> {
  // In production, store this timestamp for next check
  console.log("[SocialMediaScheduler] Updated last posted timestamp:", new Date(timestamp).toISOString());
}

/**
 * Post latest blog to social media
 */
export async function postLatestBlogToSocial(): Promise<{
  success: boolean;
  facebookPostId?: string;
  instagramMediaId?: string;
  error?: string;
}> {
  try {
    // Get the most recent published blog post
    const blogs = await getBlogPosts({
      status: "published",
      limit: 1,
      offset: 0,
    });

    if (!blogs || blogs.length === 0) {
      return { success: false, error: "No published blog posts found" };
    }

    const blog = blogs[0];
    const lastPosted = await getLastPostedTimestamp();
    const blogCreatedTime = new Date(blog.createdAt).getTime();

    // Only post if blog is newer than last posted
    if (blogCreatedTime <= lastPosted) {
      return { success: false, error: "Blog post already shared" };
    }

    const siteUrl = process.env.SITE_URL || "https://lyvarajewels.com";
    let facebookPostId: string | undefined;
    let instagramMediaId: string | undefined;

    // Post to Facebook
    try {
      const facebookResult = await postBlogToFacebook({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt || undefined,
        category: blog.category || undefined,
        imageUrl: blog.heroImageUrl || undefined,
        siteUrl,
        schedule: false,
      });

      facebookPostId = facebookResult.id;

      await recordFacebookShare({
        blogPostId: blog.id,
        facebookPostId: facebookResult.id,
        status: "published",
      });
    } catch (error) {
      console.error("Failed to post to Facebook:", error);
    }

    // Post to Instagram (if image available)
    if (blog.heroImageUrl) {
      try {
        const instagramResult = await postBlogToInstagram({
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt || undefined,
          category: blog.category || undefined,
          imageUrl: blog.heroImageUrl || undefined,
          siteUrl,
          schedule: false,
        });

        instagramMediaId = instagramResult.id;

        await recordInstagramShare({
          blogPostId: blog.id,
          instagramMediaId: instagramResult.id,
          status: "published",
        });
      } catch (error) {
        console.error("Failed to post to Instagram:", error);
      }
    }

    // Update timestamp
    await updateLastPostedTimestamp(blogCreatedTime);

    return {
      success: true,
      facebookPostId,
      instagramMediaId,
    };
  } catch (error) {
    console.error("Social media posting error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Initialize daily posting scheduler
 */
export function initializeSocialMediaScheduler(): void {
  // Check every minute if it's time to post
  setInterval(async () => {
    if (isPostingTime()) {
      console.log("[SocialMediaScheduler] Posting latest blog to social media...");
      const result = await postLatestBlogToSocial();
      console.log("[SocialMediaScheduler] Result:", result);
    }
  }, 60000); // Check every minute

  console.log("[SocialMediaScheduler] Initialized - will post daily at 1 PM EST");
}
