/**
 * Domain Router
 * Detects which domain is being accessed and routes to appropriate content
 */

export type DomainType = "shop" | "main";

/**
 * Detect domain type from request
 */
export function detectDomain(host: string | undefined): DomainType {
  if (!host) return "main";

  // Remove port if present
  const domain = host.split(":")[0].toLowerCase();

  // Check if it's a .shop domain
  if (domain.includes("lyvarajewels.shop") || domain.includes("www.lyvarajewels.shop")) {
    return "shop";
  }

  // Check if it's a .com domain
  if (domain.includes("lyvarajewels.com") || domain.includes("www.lyvarajewels.com")) {
    return "main";
  }

  // Check if it's the Manus subdomain (treat as main)
  if (domain.includes("manus.space")) {
    return "main";
  }

  // Default to main
  return "main";
}

/**
 * Get base URL for current domain
 */
export function getBaseUrl(host: string | undefined, protocol: string = "https"): string {
  if (!host) return "https://lyvarajewels.com";

  const domain = host.split(":")[0].toLowerCase();

  if (domain.includes("lyvarajewels.shop")) {
    return `${protocol}://lyvarajewels.shop`;
  }

  if (domain.includes("lyvarajewels.com")) {
    return `${protocol}://lyvarajewels.com`;
  }

  if (domain.includes("manus.space")) {
    return `${protocol}://${host}`;
  }

  return `${protocol}://lyvarajewels.com`;
}

/**
 * Get internal link for cross-domain navigation
 * Links from .shop back to .com products
 */
export function getInternalLink(path: string, targetDomain: "shop" | "main" = "main"): string {
  const baseUrl = targetDomain === "shop" ? "https://lyvarajewels.shop" : "https://lyvarajewels.com";
  return `${baseUrl}${path}`;
}

/**
 * Check if domain is shop domain
 */
export function isShopDomain(host: string | undefined): boolean {
  return detectDomain(host) === "shop";
}

/**
 * Check if domain is main domain
 */
export function isMainDomain(host: string | undefined): boolean {
  return detectDomain(host) === "main";
}
