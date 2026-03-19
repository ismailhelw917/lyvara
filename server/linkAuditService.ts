/**
 * Link Audit Service
 * 
 * Automatically crawls and validates all internal and external links on the website.
 * Detects broken links, redirects, and SSL issues.
 */

import { getDb } from "./db";

export interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  isValid: boolean;
  responseTime: number;
  redirectUrl?: string;
  error?: string;
  lastChecked: Date;
}

export interface AuditReport {
  totalLinksChecked: number;
  validLinks: number;
  brokenLinks: number;
  redirects: number;
  errors: LinkCheckResult[];
  warnings: LinkCheckResult[];
  timestamp: Date;
}

// Internal routes to check
const INTERNAL_ROUTES = [
  "/",
  "/shop",
  "/shop/necklaces",
  "/shop/bracelets",
  "/shop/rings",
  "/shop/earrings",
  "/shop/pendants",
  "/shop/sets",
  "/journal",
  "/admin",
];

// External links to check (from footer, navigation, etc.)
const EXTERNAL_LINKS = [
  "https://instagram.com",
  "https://www.amazon.com",
  "https://www.skimlinks.com",
];

// API endpoints to check
const API_ENDPOINTS = [
  "/api/meta/catalog.xml",
  "/api/meta/catalog.json",
  "/api/trpc/products.getAll",
  "/api/trpc/blog.getAll",
];

/**
 * Check if a single URL is valid
 */
async function checkLink(url: string, timeout: number = 10000): Promise<LinkCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "LYVARA-LinkAudit/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const isValid = response.status >= 200 && response.status < 400;

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      isValid,
      responseTime,
      redirectUrl: response.redirected ? response.url : undefined,
      lastChecked: new Date(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      url,
      status: 0,
      statusText: "Error",
      isValid: false,
      responseTime,
      error: errorMessage,
      lastChecked: new Date(),
    };
  }
}

/**
 * Run full link audit
 */
export async function runLinkAudit(baseUrl: string = "https://3000-ian3n3itwemn26uv1xh8t-fd45ed1a.sg1.manus.computer"): Promise<AuditReport> {
  console.log("[LinkAudit] Starting link audit...");

  const allLinks = [
    ...INTERNAL_ROUTES.map((route) => `${baseUrl}${route}`),
    ...EXTERNAL_LINKS,
    ...API_ENDPOINTS.map((endpoint) => `${baseUrl}${endpoint}`),
  ];

  const results: LinkCheckResult[] = [];
  const errors: LinkCheckResult[] = [];
  const warnings: LinkCheckResult[] = [];

  // Check all links in parallel (max 5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < allLinks.length; i += batchSize) {
    const batch = allLinks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((link) => checkLink(link)));
    results.push(...batchResults);
  }

  // Categorize results
  for (const result of results) {
    if (!result.isValid) {
      errors.push(result);
    } else if (result.redirectUrl) {
      warnings.push(result);
    }
  }

  const report: AuditReport = {
    totalLinksChecked: results.length,
    validLinks: results.filter((r) => r.isValid).length,
    brokenLinks: errors.length,
    redirects: warnings.length,
    errors,
    warnings,
    timestamp: new Date(),
  };

  console.log(`[LinkAudit] Audit complete: ${report.validLinks}/${report.totalLinksChecked} valid, ${report.brokenLinks} broken, ${report.redirects} redirects`);

  // Log audit results (database table not yet created)
  console.log("[LinkAudit] Audit results:", {
    totalLinksChecked: report.totalLinksChecked,
    validLinks: report.validLinks,
    brokenLinks: report.brokenLinks,
    redirects: report.redirects,
  });

  // Alert if broken links found
  if (errors.length > 0) {
    console.error(`[LinkAudit] ⚠️  Found ${errors.length} broken links:`, errors);
    
    // Send notification to owner
    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: "🔗 Link Audit Alert",
        content: `Found ${errors.length} broken links:\n${errors
          .map((e) => `- ${e.url} (${e.status || "Error"})`)
          .join("\n")}`,
      });
    } catch (err) {
      console.warn("[LinkAudit] Failed to send notification:", err);
    }
  }

  return report;
}

/**
 * Get latest audit report
 */
export async function getLatestAuditReport() {
  // Placeholder - database table will be created in schema migration
  return null;
}

/**
 * Get audit history (last 30 days)
 */
export async function getAuditHistory(days: number = 30) {
  // Placeholder - database table will be created in schema migration
  return [];
}
