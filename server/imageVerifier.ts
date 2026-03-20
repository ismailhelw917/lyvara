import axios from "axios";

interface ImageVerificationResult {
  imageUrl: string;
  isValid: boolean;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  error?: string;
  timestamp: number;
  responseTime: number;
}

/**
 * Verify a single image URL
 */
export async function verifyImage(imageUrl: string): Promise<ImageVerificationResult> {
  const startTime = Date.now();

  try {
    const response = await axios.head(imageUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const responseTime = Date.now() - startTime;
    const isValid = response.status >= 200 && response.status < 400;
    const contentType = response.headers["content-type"];
    const contentLength = response.headers["content-length"];

    // Verify it's actually an image
    const isImageType = contentType?.startsWith("image/");

    return {
      imageUrl,
      isValid: isValid && isImageType,
      statusCode: response.status,
      contentType,
      contentLength: contentLength ? parseInt(contentLength) : undefined,
      timestamp: Date.now(),
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      imageUrl,
      isValid: false,
      error: `Image verification failed: ${String(error)}`,
      timestamp: Date.now(),
      responseTime,
    };
  }
}

/**
 * Verify multiple images in parallel with rate limiting
 */
export async function verifyMultipleImages(
  imageUrls: string[],
  concurrency: number = 3
): Promise<ImageVerificationResult[]> {
  const results: ImageVerificationResult[] = [];
  const queue = [...imageUrls];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => verifyImage(url))
    );
    results.push(...batchResults);

    // Rate limiting
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Check for duplicate images
 */
export function findDuplicateImages(
  products: Array<{ id: number; imageUrl: string }>
): Map<string, number[]> {
  const imageMap = new Map<string, number[]>();

  for (const product of products) {
    if (!imageMap.has(product.imageUrl)) {
      imageMap.set(product.imageUrl, []);
    }
    imageMap.get(product.imageUrl)!.push(product.id);
  }

  // Return only duplicates
  const duplicates = new Map<string, number[]>();
  imageMap.forEach((ids, url) => {
    if (ids.length > 1) {
      duplicates.set(url, ids);
    }
  });

  return duplicates;
}

/**
 * Generate image verification report
 */
export function generateImageReport(results: ImageVerificationResult[]): {
  total: number;
  valid: number;
  broken: number;
  avgResponseTime: number;
  details: ImageVerificationResult[];
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

/**
 * Generate duplicate images report
 */
export function generateDuplicateReport(
  duplicates: Map<string, number[]>
): {
  totalDuplicates: number;
  duplicateGroups: Array<{
    imageUrl: string;
    count: number;
    productIds: number[];
  }>;
} {
  const duplicateGroups: Array<{
    imageUrl: string;
    count: number;
    productIds: number[];
  }> = [];
  duplicates.forEach((productIds, imageUrl) => {
    duplicateGroups.push({
      imageUrl,
      count: productIds.length,
      productIds,
    });
  });

  return {
    totalDuplicates: duplicateGroups.length,
    duplicateGroups,
  };
}
