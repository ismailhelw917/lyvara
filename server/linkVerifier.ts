import axios from "axios";

interface LinkVerificationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
  timestamp: number;
  responseTime: number;
}

/**
 * Verify a single affiliate link
 */
export async function verifyLink(url: string): Promise<LinkVerificationResult> {
  const startTime = Date.now();

  try {
    const response = await axios.head(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      maxRedirects: 5,
      validateStatus: () => true, // Don't throw on any status
    });

    const responseTime = Date.now() - startTime;
    const isValid = response.status >= 200 && response.status < 400;

    return {
      url,
      isValid,
      statusCode: response.status,
      redirectUrl: response.request?.res?.responseUrl,
      timestamp: Date.now(),
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      url,
      isValid: false,
      error: `Link verification failed: ${String(error)}`,
      timestamp: Date.now(),
      responseTime,
    };
  }
}

/**
 * Verify multiple links in parallel with rate limiting
 */
export async function verifyMultipleLinks(
  urls: string[],
  concurrency: number = 3
): Promise<LinkVerificationResult[]> {
  const results: LinkVerificationResult[] = [];
  const queue = [...urls];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(batch.map((url) => verifyLink(url)));
    results.push(...batchResults);

    // Rate limiting: wait between batches
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Check if URL contains affiliate tag
 */
export function hasAffiliateTag(url: string, tag: string): boolean {
  return url.includes(`tag=${tag}`) || url.includes(`tag%3D${tag}`);
}

/**
 * Verify affiliate link has correct partner tag
 */
export function verifyAffiliateTag(
  url: string,
  expectedTag: string
): { isValid: boolean; tag?: string; error?: string } {
  try {
    const urlObj = new URL(url);
    const tag = urlObj.searchParams.get("tag");

    if (!tag) {
      return {
        isValid: false,
        error: "No affiliate tag found in URL",
      };
    }

    if (tag !== expectedTag) {
      return {
        isValid: false,
        tag,
        error: `Wrong affiliate tag: expected ${expectedTag}, got ${tag}`,
      };
    }

    return {
      isValid: true,
      tag,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL: ${String(error)}`,
    };
  }
}

/**
 * Generate link verification report
 */
export function generateLinkReport(results: LinkVerificationResult[]): {
  total: number;
  valid: number;
  broken: number;
  avgResponseTime: number;
  details: LinkVerificationResult[];
} {
  const valid = results.filter((r) => r.isValid).length;
  const broken = results.length - valid;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  return {
    total: results.length,
    valid,
    broken,
    avgResponseTime,
    details: results,
  };
}
