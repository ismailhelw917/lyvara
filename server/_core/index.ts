import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startScheduler } from "../automationEngine";
import { getDb } from "../db";
import { blogPosts, products } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── SEO: sitemap.xml ──────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const db = await getDb();
      const BASE = "https://lyvara-jewels.manus.space";
      const now = new Date().toISOString().split("T")[0];

      const staticUrls: { loc: string; priority: string; changefreq: string; lastmod?: string }[] = [
        { loc: BASE, priority: "1.0", changefreq: "daily" },
        { loc: `${BASE}/shop`, priority: "0.9", changefreq: "daily" },
        { loc: `${BASE}/shop/necklaces`, priority: "0.8", changefreq: "weekly" },
        { loc: `${BASE}/shop/bracelets`, priority: "0.8", changefreq: "weekly" },
        { loc: `${BASE}/shop/rings`, priority: "0.8", changefreq: "weekly" },
        { loc: `${BASE}/shop/earrings`, priority: "0.8", changefreq: "weekly" },
        { loc: `${BASE}/journal`, priority: "0.7", changefreq: "daily" },
      ];

      let blogUrls: { loc: string; priority: string; changefreq: string; lastmod?: string }[] = [];
      if (db) {
        const posts = await db
          .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
          .from(blogPosts)
          .where(eq(blogPosts.status, "published"))
          .limit(200);
        blogUrls = posts.map(p => ({
          loc: `${BASE}/journal/${p.slug}`,
          priority: "0.6",
          changefreq: "monthly",
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : now,
        }));
      }

      const allUrls = [...staticUrls, ...blogUrls];
      const xml = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
        ...allUrls.map(u => [
          `  <url>`,
          `    <loc>${u.loc}</loc>`,
          `    <lastmod>${u.lastmod || now}</lastmod>`,
          `    <changefreq>${u.changefreq}</changefreq>`,
          `    <priority>${u.priority}</priority>`,
          `  </url>`,
        ].join("\n")),
        `</urlset>`,
      ].join("\n");

      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the automation scheduler after server is ready
    startScheduler();
  });
}

startServer().catch(console.error);
