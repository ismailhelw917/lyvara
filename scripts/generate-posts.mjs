/**
 * generate-posts.mjs
 * Directly calls runBlogGeneration 5 times with varied content types.
 * Run with: node scripts/generate-posts.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We call the HTTP API endpoint instead of importing directly
// to avoid ESM/CJS module resolution issues
const BASE_URL = "http://localhost:3000";

const CONTENT_TYPES = [
  "style_guide",
  "trend_report",
  "gift_ideas",
  "care_tips",
  "seasonal",
];

async function triggerBlogPost(contentType, index) {
  console.log(`\n[${index + 1}/5] Generating "${contentType}" blog post...`);
  const start = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/trpc/automation.triggerBlogGeneration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use internal server-to-server call — bypass auth for admin operations
        "x-internal-automation": "true",
      },
      body: JSON.stringify({ contentType }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (response.ok && data?.result?.data?.success) {
      console.log(`  ✓ Success in ${elapsed}s: ${data.result.data.message}`);
      return { success: true, contentType, message: data.result.data.message };
    } else {
      console.log(`  ✗ Failed in ${elapsed}s:`, JSON.stringify(data).slice(0, 200));
      return { success: false, contentType, error: JSON.stringify(data).slice(0, 200) };
    }
  } catch (err) {
    console.log(`  ✗ Network error:`, err.message);
    return { success: false, contentType, error: err.message };
  }
}

async function main() {
  console.log("=== LYVARA JEWELS — Blog Post Generator ===");
  console.log(`Generating ${CONTENT_TYPES.length} posts sequentially...\n`);

  const results = [];
  for (let i = 0; i < CONTENT_TYPES.length; i++) {
    const result = await triggerBlogPost(CONTENT_TYPES[i], i);
    results.push(result);
    // Small delay between posts to avoid rate limiting
    if (i < CONTENT_TYPES.length - 1) {
      console.log("  Waiting 3s before next post...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n=== Summary ===");
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`✓ ${succeeded} posts generated successfully`);
  if (failed > 0) console.log(`✗ ${failed} posts failed`);
  results.forEach((r) => {
    const icon = r.success ? "✓" : "✗";
    console.log(`  ${icon} ${r.contentType}: ${r.success ? r.message : r.error}`);
  });
}

main().catch(console.error);
