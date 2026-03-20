import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyMultipleASINs, generateASINReport } from "./asinVerifier";
import { verifyMultipleLinks, verifyAffiliateTag, generateLinkReport } from "./linkVerifier";
import { verifyMultipleImages, findDuplicateImages, generateImageReport, generateDuplicateReport } from "./imageVerifier";

export interface VerificationReport {
  timestamp: number;
  asins: {
    total: number;
    valid: number;
    invalid: number;
    invalidASINs: string[];
  };
  links: {
    total: number;
    valid: number;
    broken: number;
    wrongTag: string[];
  };
  images: {
    total: number;
    valid: number;
    broken: number;
    duplicates: number;
  };
  issues: string[];
  summary: string;
}

/**
 * Run comprehensive verification on all products
 */
export async function runFullVerification(): Promise<VerificationReport> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const startTime = Date.now();
  const issues: string[] = [];

  // Fetch all products
  const allProducts = await db.select().from(products);

  console.log(`[Verification] Starting full verification for ${allProducts.length} products...`);

  // 1. Verify ASINs
  console.log("[Verification] Verifying ASINs...");
  const asins = allProducts.map((p: any) => p.asin);
  const asinResults = await verifyMultipleASINs(asins);
  const asinReport = generateASINReport(asinResults);
  const invalidASINs = asinResults
    .filter((r) => !r.isValid)
    .map((r) => r.asin);

  if (invalidASINs.length > 0) {
    issues.push(`${invalidASINs.length} invalid ASINs found: ${invalidASINs.join(", ")}`);
  }

  // 2. Verify affiliate links
  console.log("[Verification] Verifying affiliate links...");
  const affiliateUrls = allProducts.map((p: any) => p.affiliateUrl).filter(Boolean);
  const linkResults = await verifyMultipleLinks(affiliateUrls, 2);
  const linkReport = generateLinkReport(linkResults);

  // Check affiliate tags
  const expectedTag = process.env.AMAZON_PARTNER_TAG || "91791709-20";
  const wrongTagLinks: string[] = [];
  for (const product of allProducts) {
    if (product.affiliateUrl) {
      const tagCheck = verifyAffiliateTag(product.affiliateUrl, expectedTag);
      if (!tagCheck.isValid) {
        wrongTagLinks.push(`${product.title}: ${tagCheck.error}`);
      }
    }
  }

  if (wrongTagLinks.length > 0) {
    issues.push(`${wrongTagLinks.length} links with wrong affiliate tag`);
  }

  // 3. Verify images
  console.log("[Verification] Verifying product images...");
  const imageUrls = allProducts
    .map((p: any) => p.imageUrl)
    .filter(Boolean);
  const imageResults = await verifyMultipleImages(imageUrls, 2);
  const imageReport = generateImageReport(imageResults);

  // Check for duplicate images
  const duplicates = findDuplicateImages(
    allProducts.map((p: any) => ({
      id: p.id,
      imageUrl: p.imageUrl,
    }))
  );
  const duplicateReport = generateDuplicateReport(duplicates);

  if (duplicateReport.totalDuplicates > 0) {
    issues.push(
      `${duplicateReport.totalDuplicates} duplicate image(s) found affecting ${
        duplicateReport.duplicateGroups.reduce((sum, g) => sum + g.count, 0)
      } products`
    );
  }

  // Generate summary
  const totalIssues = issues.length;
  const summary =
    totalIssues === 0
      ? "✅ All verifications passed!"
      : `⚠️ ${totalIssues} issue(s) found`;

  const report: VerificationReport = {
    timestamp: Date.now(),
    asins: {
      total: asinReport.total,
      valid: asinReport.valid,
      invalid: asinReport.invalid,
      invalidASINs,
    },
    links: {
      total: linkReport.total,
      valid: linkReport.valid,
      broken: linkReport.broken,
      wrongTag: wrongTagLinks,
    },
    images: {
      total: imageReport.total,
      valid: imageReport.valid,
      broken: imageReport.broken,
      duplicates: duplicateReport.totalDuplicates,
    },
    issues,
    summary,
  };

  const duration = Date.now() - startTime;
  console.log(`[Verification] Completed in ${duration}ms`);
  console.log(`[Verification] ${report.summary}`);

  return report;
}

/**
 * Generate HTML report for verification results
 */
export function generateHTMLReport(report: VerificationReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Product Verification Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .summary { padding: 15px; background: ${report.issues.length === 0 ? "#d4edda" : "#fff3cd"}; border-radius: 4px; margin: 20px 0; }
    .section { margin: 20px 0; }
    .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .issue { color: #d32f2f; margin: 5px 0; }
    .valid { color: #388e3c; }
    .invalid { color: #d32f2f; }
    .timestamp { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Product Verification Report</h1>
    <p class="timestamp">Generated: ${new Date(report.timestamp).toISOString()}</p>
    
    <div class="summary">
      <h2>${report.summary}</h2>
    </div>

    <div class="section">
      <h2>ASIN Verification</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Count</th>
        </tr>
        <tr>
          <td>Total ASINs</td>
          <td>${report.asins.total}</td>
        </tr>
        <tr>
          <td class="valid">Valid</td>
          <td class="valid">${report.asins.valid}</td>
        </tr>
        <tr>
          <td class="invalid">Invalid</td>
          <td class="invalid">${report.asins.invalid}</td>
        </tr>
      </table>
      ${report.asins.invalidASINs.length > 0 ? `<p class="issue">Invalid ASINs: ${report.asins.invalidASINs.join(", ")}</p>` : ""}
    </div>

    <div class="section">
      <h2>Link Verification</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Count</th>
        </tr>
        <tr>
          <td>Total Links</td>
          <td>${report.links.total}</td>
        </tr>
        <tr>
          <td class="valid">Valid</td>
          <td class="valid">${report.links.valid}</td>
        </tr>
        <tr>
          <td class="invalid">Broken</td>
          <td class="invalid">${report.links.broken}</td>
        </tr>
        <tr>
          <td class="invalid">Wrong Tag</td>
          <td class="invalid">${report.links.wrongTag.length}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>Image Verification</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Count</th>
        </tr>
        <tr>
          <td>Total Images</td>
          <td>${report.images.total}</td>
        </tr>
        <tr>
          <td class="valid">Valid</td>
          <td class="valid">${report.images.valid}</td>
        </tr>
        <tr>
          <td class="invalid">Broken</td>
          <td class="invalid">${report.images.broken}</td>
        </tr>
        <tr>
          <td class="invalid">Duplicates</td>
          <td class="invalid">${report.images.duplicates}</td>
        </tr>
      </table>
    </div>

    ${report.issues.length > 0 ? `
    <div class="section">
      <h2>Issues Found</h2>
      ${report.issues.map((issue) => `<p class="issue">• ${issue}</p>`).join("")}
    </div>
    ` : ""}
  </div>
</body>
</html>
  `;
}
