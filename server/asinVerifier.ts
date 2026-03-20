import axios from "axios";

interface ASINVerificationResult {
  asin: string;
  isValid: boolean;
  format: "valid" | "invalid";
  exists: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Verify ASIN format (10 characters, alphanumeric)
 */
export function verifyASINFormat(asin: string): boolean {
  if (!asin) return false;
  // Amazon ASINs are 10 characters, alphanumeric
  const asinRegex = /^[A-Z0-9]{10}$/;
  return asinRegex.test(asin);
}

/**
 * Check if ASIN exists on Amazon by attempting to fetch product page
 */
export async function verifyASINExists(asin: string): Promise<boolean> {
  if (!verifyASINFormat(asin)) {
    return false;
  }

  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      maxRedirects: 5,
    });

    // 200 = exists, 3xx = redirect (still valid), 404 = not found
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    // If we get 404, ASIN doesn't exist
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    // Other errors (timeout, network) we treat as unknown
    return false;
  }
}

/**
 * Comprehensive ASIN verification
 */
export async function verifyASIN(asin: string): Promise<ASINVerificationResult> {
  const formatValid = verifyASINFormat(asin);

  let exists = false;
  let error: string | undefined;

  if (formatValid) {
    try {
      exists = await verifyASINExists(asin);
    } catch (e) {
      error = `Failed to verify existence: ${String(e)}`;
    }
  } else {
    error = "Invalid ASIN format (must be 10 alphanumeric characters)";
  }

  return {
    asin,
    isValid: formatValid && exists,
    format: formatValid ? "valid" : "invalid",
    exists,
    error,
    timestamp: Date.now(),
  };
}

/**
 * Verify multiple ASINs in parallel
 */
export async function verifyMultipleASINs(
  asins: string[]
): Promise<ASINVerificationResult[]> {
  return Promise.all(asins.map((asin) => verifyASIN(asin)));
}

/**
 * Generate verification report
 */
export function generateASINReport(results: ASINVerificationResult[]): {
  total: number;
  valid: number;
  invalid: number;
  details: ASINVerificationResult[];
} {
  const valid = results.filter((r) => r.isValid).length;
  const invalid = results.length - valid;

  return {
    total: results.length,
    valid,
    invalid,
    details: results,
  };
}
