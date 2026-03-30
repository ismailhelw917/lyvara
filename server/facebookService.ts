/**
 * Facebook Blog Posting Service
 * Handles automated posting of blog content to Facebook page
 */

const FACEBOOK_API_VERSION = "v18.0";
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export interface FacebookPostOptions {
  message: string;
  link?: string;
  picture?: string;
  name?: string;
  description?: string;
  caption?: string;
  scheduled_publish_time?: number;
}

/**
 * Post content to Facebook page
 */
export async function postToFacebook(options: FacebookPostOptions): Promise<{ id: string; success: boolean }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error("Facebook credentials not configured");
  }

  const postData = new URLSearchParams({
    message: options.message,
    access_token: accessToken,
  });

  if (options.link) postData.append("link", options.link);
  if (options.picture) postData.append("picture", options.picture);
  if (options.name) postData.append("name", options.name);
  if (options.description) postData.append("description", options.description);
  if (options.caption) postData.append("caption", options.caption);
  if (options.scheduled_publish_time) {
    postData.append("published", "false");
    postData.append("scheduled_publish_time", options.scheduled_publish_time.toString());
  }

  try {
    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      body: postData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Facebook API Error:", data);
      throw new Error(data.error?.message || "Failed to post to Facebook");
    }

    return {
      id: data.id,
      success: true,
    };
  } catch (error) {
    console.error("Facebook posting error:", error);
    throw error;
  }
}

/**
 * Format blog post for Facebook sharing
 */
export function formatBlogPostForFacebook(blog: {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  imageUrl?: string;
  siteUrl: string;
}): FacebookPostOptions {
  const postUrl = `${blog.siteUrl}/blog/${blog.slug}`;

  const message = `✨ ${blog.title}${blog.category ? ` - ${blog.category}` : ""}

${blog.excerpt || "Read our latest jewelry insights and styling tips."}

👉 Read more: ${postUrl}

#JewelryBlog #LuxuryJewelry #StylingTips`;

  return {
    message,
    link: postUrl,
    picture: blog.imageUrl,
    name: blog.title,
    description: blog.excerpt,
  };
}

/**
 * Schedule blog post to Facebook at optimal time
 */
export function getOptimalPostTime(): number {
  // Schedule for next day at 1 PM EST (optimal engagement time)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(13, 0, 0, 0);

  // Convert to UTC timestamp (seconds)
  return Math.floor(tomorrow.getTime() / 1000);
}

/**
 * Post blog to Facebook with scheduling
 */
export async function postBlogToFacebook(blog: {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  imageUrl?: string;
  siteUrl: string;
  schedule?: boolean;
}): Promise<{ id: string; success: boolean; scheduled?: boolean }> {
  const postOptions = formatBlogPostForFacebook(blog);

  if (blog.schedule) {
    postOptions.scheduled_publish_time = getOptimalPostTime();
  }

  const result = await postToFacebook(postOptions);

  return {
    ...result,
    scheduled: blog.schedule,
  };
}


/**
 * Post content to Instagram
 */
export async function postToInstagram(options: {
  caption: string;
  imageUrl: string;
  scheduled_publish_time?: number;
}): Promise<{ id: string; success: boolean }> {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    throw new Error("Instagram credentials not configured");
  }

  const postData = new URLSearchParams({
    image_url: options.imageUrl,
    caption: options.caption,
    access_token: accessToken,
  });

  if (options.scheduled_publish_time) {
    postData.append("published", "false");
    postData.append("scheduled_publish_time", options.scheduled_publish_time.toString());
  } else {
    postData.append("published", "true");
  }

  try {
    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${accountId}/media`, {
      method: "POST",
      body: postData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Instagram API Error:", data);
      throw new Error(data.error?.message || "Failed to post to Instagram");
    }

    return {
      id: data.id,
      success: true,
    };
  } catch (error) {
    console.error("Instagram posting error:", error);
    throw error;
  }
}

/**
 * Format blog post for Instagram sharing
 */
export function formatBlogPostForInstagram(blog: {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  imageUrl?: string;
  siteUrl: string;
}): { caption: string; imageUrl: string } {
  const caption = `✨ ${blog.title}${blog.category ? ` - ${blog.category}` : ""}

${blog.excerpt || "Read our latest jewelry insights and styling tips."}

👉 Link in bio for the full story!

#JewelryBlog #LuxuryJewelry #StylingTips #GoldJewelry #JewelryInspo`;

  return {
    caption,
    imageUrl: blog.imageUrl || "",
  };
}

/**
 * Post blog to Instagram with scheduling
 */
export async function postBlogToInstagram(blog: {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  imageUrl?: string;
  siteUrl: string;
  schedule?: boolean;
}): Promise<{ id: string; success: boolean; scheduled?: boolean }> {
  if (!blog.imageUrl) {
    throw new Error("Instagram posts require an image URL");
  }

  const postOptions = formatBlogPostForInstagram(blog);

  const instagramOptions: any = {
    caption: postOptions.caption,
    imageUrl: postOptions.imageUrl,
  };

  if (blog.schedule) {
    instagramOptions.scheduled_publish_time = getOptimalPostTime();
  }

  const result = await postToInstagram(instagramOptions);

  return {
    ...result,
    scheduled: blog.schedule,
  };
}
