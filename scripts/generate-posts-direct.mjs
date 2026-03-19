/**
 * generate-posts-direct.mjs
 * Directly imports and calls runBlogGeneration from automationEngine
 * bypassing HTTP auth — runs in the same Node.js process as the server.
 */

// Set up environment
process.env.NODE_ENV = "development";

// Use tsx to handle TypeScript imports
import { execSync } from "child_process";
import { writeFileSync } from "fs";

// Create a temporary TypeScript runner script
const tsScript = `
import { runBlogGeneration } from "./server/automationEngine";

const CONTENT_TYPES = [
  "style_guide",
  "trend_report", 
  "gift_ideas",
  "care_tips",
  "seasonal",
] as const;

async function main() {
  console.log("=== LYVARA JEWELS — Blog Post Generator ===");
  console.log("Generating 5 posts sequentially...\\n");

  const results = [];
  for (let i = 0; i < CONTENT_TYPES.length; i++) {
    const contentType = CONTENT_TYPES[i];
    console.log(\`[\\${i + 1}/5] Generating "\\${contentType}" post...\`);
    const start = Date.now();
    try {
      const result = await runBlogGeneration(contentType);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(\`  ✓ Done in \\${elapsed}s: \\${result.message}\`);
      results.push({ success: true, contentType, message: result.message });
    } catch (err: any) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(\`  ✗ Failed in \\${elapsed}s: \\${err.message}\`);
      results.push({ success: false, contentType, error: err.message });
    }
    // Delay between posts
    if (i < CONTENT_TYPES.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const succeeded = results.filter(r => r.success).length;
  console.log(\`\\n=== Summary: \\${succeeded}/5 posts generated ===\`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
`;

writeFileSync("/tmp/gen-posts.ts", tsScript);

try {
  execSync(
    "cd /home/ubuntu/jewelry_affiliate && npx tsx /tmp/gen-posts.ts",
    { stdio: "inherit", timeout: 600000 }
  );
} catch (err) {
  console.error("Script failed:", err.message);
  process.exit(1);
}
