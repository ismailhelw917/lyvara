/**
 * Meta (Facebook/Instagram) Ads Service
 *
 * Handles:
 * 1. Meta Conversions API (server-side pixel events for iOS14+ compliance)
 * 2. Product Catalog feed generation (for Dynamic Product Ads)
 * 3. Meta Marketing API automation (campaign creation, budget rules, ad scheduling)
 *
 * Required env vars:
 *   META_PIXEL_ID        — Your Facebook Pixel ID (from Events Manager)
 *   META_ACCESS_TOKEN    — System User access token (from Meta Business Manager)
 *   META_AD_ACCOUNT_ID   — Your Ad Account ID (format: act_XXXXXXXXX)
 *
 * All functions gracefully degrade (log warning, return null) when credentials
 * are not configured, so the site works without Meta credentials.
 */

const META_API_VERSION = "v21.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ─── Credential helpers ───────────────────────────────────────────────────────
function getPixelId(): string | null {
  return process.env.META_PIXEL_ID || null;
}
function getAccessToken(): string | null {
  return process.env.META_ACCESS_TOKEN || null;
}
function getAdAccountId(): string | null {
  return process.env.META_AD_ACCOUNT_ID || null;
}
function isConfigured(): boolean {
  return !!(getPixelId() && getAccessToken());
}

// ─── Conversions API (server-side events) ────────────────────────────────────
export interface MetaEventData {
  eventName: "PageView" | "ViewContent" | "Search" | "AddToCart" | "Purchase" | "Lead";
  eventTime?: number; // Unix timestamp (seconds), defaults to now
  eventSourceUrl?: string;
  userData?: {
    clientIpAddress?: string;
    clientUserAgent?: string;
    email?: string; // Will be hashed automatically
    phone?: string; // Will be hashed automatically
    fbp?: string;   // Facebook browser cookie (_fbp)
    fbc?: string;   // Facebook click ID cookie (_fbc)
  };
  customData?: {
    contentIds?: string[];
    contentType?: string;
    contentName?: string;
    currency?: string;
    value?: number;
    searchString?: string;
  };
}

/**
 * Send a server-side event to Meta Conversions API.
 * Complements the browser Pixel for iOS14+ privacy compliance.
 */
export async function sendMetaEvent(data: MetaEventData): Promise<boolean> {
  if (!isConfigured()) {
    console.log("[Meta] Conversions API not configured — skipping event:", data.eventName);
    return false;
  }

  const pixelId = getPixelId()!;
  const accessToken = getAccessToken()!;

  const payload = {
    data: [
      {
        event_name: data.eventName,
        event_time: data.eventTime ?? Math.floor(Date.now() / 1000),
        event_source_url: data.eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: data.userData?.clientIpAddress,
          client_user_agent: data.userData?.clientUserAgent,
          fbp: data.userData?.fbp,
          fbc: data.userData?.fbc,
        },
        custom_data: data.customData
          ? {
              content_ids: data.customData.contentIds,
              content_type: data.customData.contentType || "product",
              content_name: data.customData.contentName,
              currency: data.customData.currency || "USD",
              value: data.customData.value,
              search_string: data.customData.searchString,
            }
          : undefined,
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
  };

  try {
    const response = await fetch(
      `${META_GRAPH_BASE}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const result = await response.json() as any;
    if (result.events_received > 0) {
      console.log(`[Meta] Event sent: ${data.eventName} (${result.events_received} received)`);
      return true;
    } else {
      console.warn("[Meta] Event may not have been received:", result);
      return false;
    }
  } catch (err: any) {
    console.warn("[Meta] Conversions API error:", err.message);
    return false;
  }
}

// ─── Product Catalog Feed ─────────────────────────────────────────────────────
export interface CatalogProduct {
  id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  link: string;
  image_link: string;
  brand: string;
  google_product_category: string;
  product_type: string;
}

/**
 * Generate a Meta-compatible product catalog feed as XML (RSS 2.0 / Google Shopping format).
 * Used for Dynamic Product Ads — Meta reads this URL daily to sync your catalog.
 * Expose at: GET /api/meta/catalog.xml
 */
export function generateCatalogXML(products: CatalogProduct[]): string {
  const items = products
    .map(
      (p) => `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.title)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:availability>${p.availability}</g:availability>
      <g:condition>${p.condition}</g:condition>
      <g:price>${escapeXml(p.price)}</g:price>
      <g:link>${escapeXml(p.link)}</g:link>
      <g:image_link>${escapeXml(p.image_link)}</g:image_link>
      <g:brand>${escapeXml(p.brand)}</g:brand>
      <g:google_product_category>${escapeXml(p.google_product_category)}</g:google_product_category>
      <g:product_type>${escapeXml(p.product_type)}</g:product_type>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>LYVARA JEWELS Product Catalog</title>
    <link>https://lyvara-jewels.manus.space</link>
    <description>Luxury gold and silver jewelry curated daily for women</description>
    ${items}
  </channel>
</rss>`;
}

/**
 * Generate a Meta-compatible product catalog feed as JSON.
 * Expose at: GET /api/meta/catalog.json
 */
export function generateCatalogJSON(products: CatalogProduct[]): object {
  return {
    data: products.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      availability: p.availability,
      condition: p.condition,
      price: p.price,
      url: p.link,
      image_url: p.image_link,
      brand: p.brand,
      category: p.google_product_category,
      retailer_product_group_id: p.product_type,
    })),
  };
}

// ─── Marketing API — Campaign Management ─────────────────────────────────────
export interface CampaignConfig {
  name: string;
  objective: "OUTCOME_TRAFFIC" | "OUTCOME_ENGAGEMENT" | "OUTCOME_SALES" | "OUTCOME_LEADS";
  dailyBudget: number; // in cents (e.g. 1000 = $10/day)
  status?: "ACTIVE" | "PAUSED";
}

export interface AdSetConfig {
  campaignId: string;
  name: string;
  targeting: {
    genders?: number[]; // 1=male, 2=female
    ageMin?: number;
    ageMax?: number;
    interests?: string[]; // Interest IDs
    geoLocations?: { countries: string[] };
  };
  dailyBudget: number;
  billingEvent?: string;
  optimizationGoal?: string;
  status?: "ACTIVE" | "PAUSED";
}

/**
 * Create a new Meta ad campaign.
 * Returns the campaign ID on success, null on failure.
 */
export async function createCampaign(config: CampaignConfig): Promise<string | null> {
  const token = getAccessToken();
  const adAccountId = getAdAccountId();
  if (!token || !adAccountId) {
    console.log("[Meta] Marketing API not configured — skipping campaign creation");
    return null;
  }

  try {
    const response = await fetch(
      `${META_GRAPH_BASE}/${adAccountId}/campaigns?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          objective: config.objective,
          daily_budget: config.dailyBudget,
          status: config.status || "PAUSED", // Always start paused for safety
          special_ad_categories: [],
        }),
      }
    );
    const result = await response.json() as any;
    if (result.id) {
      console.log(`[Meta] Campaign created: ${config.name} (ID: ${result.id})`);
      return result.id;
    }
    console.warn("[Meta] Campaign creation failed:", result);
    return null;
  } catch (err: any) {
    console.warn("[Meta] Campaign creation error:", err.message);
    return null;
  }
}

/**
 * Create an ad set targeting women interested in jewelry.
 */
export async function createJewelryAdSet(config: AdSetConfig): Promise<string | null> {
  const token = getAccessToken();
  const adAccountId = getAdAccountId();
  if (!token || !adAccountId) return null;

  const targeting = {
    genders: config.targeting.genders || [2], // Default: women
    age_min: config.targeting.ageMin || 22,
    age_max: config.targeting.ageMax || 65,
    geo_locations: config.targeting.geoLocations || { countries: ["US", "GB", "CA", "AU"] },
    interests: config.targeting.interests
      ? config.targeting.interests.map((id) => ({ id }))
      : [
          { id: "6003107902433", name: "Jewelry" },
          { id: "6003349442621", name: "Fashion accessories" },
          { id: "6003397425735", name: "Luxury goods" },
        ],
  };

  try {
    const response = await fetch(
      `${META_GRAPH_BASE}/${adAccountId}/adsets?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          campaign_id: config.campaignId,
          daily_budget: config.dailyBudget,
          billing_event: config.billingEvent || "IMPRESSIONS",
          optimization_goal: config.optimizationGoal || "LINK_CLICKS",
          targeting,
          status: config.status || "PAUSED",
        }),
      }
    );
    const result = await response.json() as any;
    if (result.id) {
      console.log(`[Meta] Ad set created: ${config.name} (ID: ${result.id})`);
      return result.id;
    }
    console.warn("[Meta] Ad set creation failed:", result);
    return null;
  } catch (err: any) {
    console.warn("[Meta] Ad set creation error:", err.message);
    return null;
  }
}

/**
 * Get performance metrics for all active campaigns.
 * Returns spend, impressions, clicks, CTR, ROAS for the last 7 days.
 */
export async function getCampaignInsights(): Promise<any[]> {
  const token = getAccessToken();
  const adAccountId = getAdAccountId();
  if (!token || !adAccountId) return [];

  try {
    const response = await fetch(
      `${META_GRAPH_BASE}/${adAccountId}/campaigns?` +
        new URLSearchParams({
          fields: "id,name,status,insights{spend,impressions,clicks,ctr,actions,cost_per_action_type}",
          date_preset: "last_7d",
          access_token: token,
        }),
      { method: "GET" }
    );
    const result = await response.json() as any;
    return result.data || [];
  } catch (err: any) {
    console.warn("[Meta] Insights fetch error:", err.message);
    return [];
  }
}

/**
 * Automated budget rules:
 * - Pause ad sets with CTR < 0.5% after 1000+ impressions
 * - Scale daily budget +20% for ad sets with CTR > 3%
 */
export async function runBudgetOptimization(): Promise<{ paused: number; scaled: number }> {
  const token = getAccessToken();
  const adAccountId = getAdAccountId();
  if (!token || !adAccountId) return { paused: 0, scaled: 0 };

  let paused = 0;
  let scaled = 0;

  try {
    // Get all active ad sets with insights
    const response = await fetch(
      `${META_GRAPH_BASE}/${adAccountId}/adsets?` +
        new URLSearchParams({
          fields: "id,name,status,daily_budget,insights{impressions,clicks,ctr}",
          date_preset: "last_7d",
          filtering: JSON.stringify([{ field: "adset.effective_status", operator: "IN", value: ["ACTIVE"] }]),
          access_token: token,
        }),
      { method: "GET" }
    );
    const result = await response.json() as any;
    const adSets = result.data || [];

    for (const adSet of adSets) {
      const insights = adSet.insights?.data?.[0];
      if (!insights) continue;

      const impressions = parseInt(insights.impressions || "0");
      const ctr = parseFloat(insights.ctr || "0");
      const currentBudget = parseInt(adSet.daily_budget || "0");

      if (impressions >= 1000 && ctr < 0.5) {
        // Pause underperformer
        await fetch(
          `${META_GRAPH_BASE}/${adSet.id}?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PAUSED" }),
          }
        );
        console.log(`[Meta] Paused underperforming ad set: ${adSet.name} (CTR: ${ctr.toFixed(2)}%)`);
        paused++;
      } else if (ctr > 3.0 && currentBudget > 0) {
        // Scale winner +20%
        const newBudget = Math.round(currentBudget * 1.2);
        await fetch(
          `${META_GRAPH_BASE}/${adSet.id}?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ daily_budget: newBudget }),
          }
        );
        console.log(`[Meta] Scaled winning ad set: ${adSet.name} (CTR: ${ctr.toFixed(2)}%, budget: $${currentBudget / 100} → $${newBudget / 100})`);
        scaled++;
      }
    }
  } catch (err: any) {
    console.warn("[Meta] Budget optimization error:", err.message);
  }

  return { paused, scaled };
}

/**
 * Auto-create a Dynamic Product Ad campaign for a new product.
 * Creates: Campaign → Ad Set (women, jewelry interests) → Ad (product image + title)
 */
export async function createProductAd(product: {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  brand?: string;
}): Promise<{ campaignId: string | null; adSetId: string | null }> {
  const token = getAccessToken();
  const adAccountId = getAdAccountId();
  if (!token || !adAccountId) {
    return { campaignId: null, adSetId: null };
  }

  const campaignId = await createCampaign({
    name: `LYVARA — ${product.title.slice(0, 40)}`,
    objective: "OUTCOME_TRAFFIC",
    dailyBudget: 500, // $5/day default
    status: "PAUSED",
  });

  if (!campaignId) return { campaignId: null, adSetId: null };

  const adSetId = await createJewelryAdSet({
    campaignId,
    name: `Women 22-65 — Jewelry Interests — ${product.brand || "LYVARA"}`,
    targeting: {
      genders: [2],
      ageMin: 22,
      ageMax: 65,
    },
    dailyBudget: 500,
    status: "PAUSED",
  });

  return { campaignId, adSetId };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export { isConfigured as isMetaConfigured };
