/**
 * Pinterest Auto-Poster Service
 *
 * Automatically posts new products and blog posts to Pinterest boards.
 * Pinterest is the #1 platform for jewelry discovery — 85% of weekly
 * Pinners have made a purchase based on content they saw from brands.
 *
 * Required env vars:
 *   PINTEREST_ACCESS_TOKEN  — OAuth access token from Pinterest Developer Portal
 *   PINTEREST_BOARD_ID      — Target board ID (get from Pinterest API or board URL)
 *
 * API Reference: https://developers.pinterest.com/docs/api/v5/
 */

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// ─── Credential helpers ───────────────────────────────────────────────────────
function getAccessToken(): string | null {
  return process.env.PINTEREST_ACCESS_TOKEN || null;
}
function getBoardId(): string | null {
  return process.env.PINTEREST_BOARD_ID || null;
}
export function isPinterestConfigured(): boolean {
  return !!(getAccessToken() && getBoardId());
}

// ─── Pin creation ─────────────────────────────────────────────────────────────
export interface PinterestPin {
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  boardId?: string;
  altText?: string;
}

/**
 * Create a single Pinterest pin.
 * Returns the pin ID on success, null on failure.
 */
export async function createPin(pin: PinterestPin): Promise<string | null> {
  const token = getAccessToken();
  const boardId = pin.boardId || getBoardId();

  if (!token || !boardId) {
    console.log("[Pinterest] Not configured — skipping pin creation:", pin.title.slice(0, 40));
    return null;
  }

  try {
    const response = await fetch(`${PINTEREST_API_BASE}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title: pin.title.slice(0, 100), // Pinterest max 100 chars
        description: pin.description.slice(0, 500), // Pinterest max 500 chars
        link: pin.link,
        alt_text: pin.altText || pin.title.slice(0, 500),
        media_source: {
          source_type: "image_url",
          url: pin.imageUrl,
        },
      }),
    });

    const result = await response.json() as any;
    if (result.id) {
      console.log(`[Pinterest] Pin created: "${pin.title.slice(0, 40)}" (ID: ${result.id})`);
      return result.id;
    }
    console.warn("[Pinterest] Pin creation failed:", JSON.stringify(result).slice(0, 200));
    return null;
  } catch (err: any) {
    console.warn("[Pinterest] Pin creation error:", err.message);
    return null;
  }
}

/**
 * Auto-post a product to Pinterest.
 * Crafts an optimized pin title and description for jewelry discovery.
 */
export async function pinProduct(product: {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  brand?: string | null;
  category?: string | null;
  metalType?: string | null;
}): Promise<string | null> {
  const metalLabel = product.metalType
    ? product.metalType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Gold";
  const categoryLabel = product.category
    ? product.category.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Jewelry";

  const title = `${product.title.slice(0, 80)} — LYVARA JEWELS`;

  const description = [
    product.description?.slice(0, 200) || `Discover this stunning ${metalLabel} ${categoryLabel} piece.`,
    `✨ ${metalLabel} ${categoryLabel} from ${product.brand || "LYVARA JEWELS"}`,
    `💎 Shop now: $${product.price.toFixed(2)}`,
    "#LuxuryJewelry #GoldJewelry #WomensJewelry #JewelryLovers #FineJewelry",
    `#${metalLabel.replace(" ", "")} #${categoryLabel}`,
  ]
    .join("\n")
    .slice(0, 500);

  return createPin({
    title,
    description,
    link: product.affiliateUrl,
    imageUrl: product.imageUrl,
    altText: `${product.title} — ${metalLabel} ${categoryLabel} for women`,
  });
}

/**
 * Auto-post a blog post to Pinterest.
 * Uses the hero image and crafts an editorial-style pin.
 */
export async function pinBlogPost(post: {
  id: number;
  title: string;
  excerpt?: string | null;
  heroImageUrl?: string | null;
  slug: string;
  category?: string | null;
}): Promise<string | null> {
  if (!post.heroImageUrl) {
    console.log("[Pinterest] Blog post has no hero image, skipping pin:", post.title.slice(0, 40));
    return null;
  }

  const siteUrl = process.env.SITE_URL || "https://lyvara-jewels.manus.space";
  const postUrl = `${siteUrl}/journal/${post.slug}`;

  const categoryHashtags: Record<string, string> = {
    style_guide: "#JewelryStyle #HowToStyle #StyleGuide",
    trend_report: "#JewelryTrends #FashionTrends #TrendAlert",
    gift_ideas: "#JewelryGifts #GiftIdeas #GiftsForHer",
    care_tips: "#JewelryCare #JewelryTips #GoldCare",
    seasonal: "#SeasonalStyle #JewelryLooks",
    promotional: "#JewelryDeals #LuxuryJewelry",
  };

  const hashtags = categoryHashtags[post.category || ""] || "#LuxuryJewelry #JewelryLovers";

  const description = [
    post.excerpt?.slice(0, 250) || `Read our latest jewelry editorial: ${post.title}`,
    "",
    `📖 Full article at LYVARA JEWELS`,
    hashtags,
    "#LYVARAJewels #JewelryBlog #WomensJewelry",
  ]
    .join("\n")
    .slice(0, 500);

  return createPin({
    title: post.title.slice(0, 100),
    description,
    link: postUrl,
    imageUrl: post.heroImageUrl,
    altText: post.title,
  });
}

/**
 * Get Pinterest board analytics (impressions, saves, clicks).
 */
export async function getBoardAnalytics(): Promise<any | null> {
  const token = getAccessToken();
  const boardId = getBoardId();
  if (!token || !boardId) return null;

  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const response = await fetch(
      `${PINTEREST_API_BASE}/boards/${boardId}/analytics?` +
        new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          metric_types: "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK",
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return await response.json();
  } catch (err: any) {
    console.warn("[Pinterest] Analytics fetch error:", err.message);
    return null;
  }
}

/**
 * Get all pins on the board with their performance metrics.
 */
export async function getBoardPins(): Promise<any[]> {
  const token = getAccessToken();
  const boardId = getBoardId();
  if (!token || !boardId) return [];

  try {
    const response = await fetch(
      `${PINTEREST_API_BASE}/boards/${boardId}/pins?page_size=25`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const result = await response.json() as any;
    return result.items || [];
  } catch (err: any) {
    console.warn("[Pinterest] Board pins fetch error:", err.message);
    return [];
  }
}
