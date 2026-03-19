/**
 * Image Optimization Service
 * - Auto-compress images
 * - Generate alt text
 * - Optimize for web (WebP, AVIF)
 * - Track image performance metrics
 */

interface ImageOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  altText: string;
}

/**
 * Generate optimized image alt text for SEO
 */
export function generateAltText(productTitle: string, category: string, brand?: string): string {
  const parts = [productTitle, category, "jewelry"];
  if (brand) parts.push(brand);
  return parts.join(" - ") + " from LYVARA JEWELS";
}

/**
 * Calculate image optimization metrics
 */
export function calculateCompressionRatio(originalSize: number, optimizedSize: number): number {
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

/**
 * Get recommended image formats for different use cases
 */
export function getOptimizedImageUrl(originalUrl: string, width: number, format: "webp" | "avif" | "jpg" = "webp"): string {
  // Add image optimization parameters (works with Unsplash, Cloudinary, etc.)
  const params = new URLSearchParams();
  params.set("w", width.toString());
  params.set("q", "80");
  params.set("fm", format);
  
  const separator = originalUrl.includes("?") ? "&" : "?";
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Generate responsive image srcset for lazy loading
 */
export function generateResponsiveImageSrcset(imageUrl: string): string {
  const sizes = [400, 600, 800, 1200];
  return sizes
    .map(size => `${getOptimizedImageUrl(imageUrl, size)} ${size}w`)
    .join(", ");
}

/**
 * Track image performance metrics
 */
export interface ImageMetrics {
  url: string;
  loadTime: number;
  size: number;
  format: string;
  cacheHit: boolean;
}

export function trackImageMetrics(url: string, loadTimeMs: number, sizeBytes: number): ImageMetrics {
  return {
    url,
    loadTime: loadTimeMs,
    size: sizeBytes,
    format: url.split(".").pop()?.toLowerCase() || "unknown",
    cacheHit: loadTimeMs < 100, // Heuristic: fast loads likely from cache
  };
}
