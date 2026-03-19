# AURUM JEWELS — Luxury Jewelry Affiliate Website

## Database Schema
- [x] Products table (asin, title, brand, category, metalType, price, imageUrl, affiliateUrl, amazonRating, reviewCount, displayRank, isFeatured, isHero, imageSize, isActive, performanceScore, ctr, clickCount, conversionCount, estimatedRevenue, tags, priceDropPercent, createdAt, updatedAt, lastFetchedAt)
- [x] BlogPosts table (id, title, slug, content, excerpt, heroImageUrl, category, tags, status, publishedAt, viewCount, createdAt)
- [x] Analytics table (id, productId, eventType, sessionId, userAgent, referrer, page, metadata, timestamp)
- [x] AutomationLogs table (id, jobType, status, message, productsUpdated, postsGenerated, changes, duration, createdAt)
- [x] SiteSettings table (id, key, value, updatedAt)

## Backend API
- [x] Amazon PA-API product fetching (jewelry categories: necklaces, bracelets, rings, earrings) with mock fallback
- [x] AI content generation: blog posts with LLM integration (invokeLLM)
- [x] AI product description generation
- [x] Hero image generation for blog posts (generateImage)
- [x] Affiliate link generation and tracking
- [x] Product performance ranking algorithm (top 20% / bottom performers)
- [x] Analytics event tracking (clicks, conversions, page views, affiliate_clicks)
- [x] Owner email/notification alerts for performance thresholds and system errors
- [x] tRPC routers: products, blog, analytics, automation, settings

## Automation Engine
- [x] Daily product refresh scheduler (6 AM UTC — fetch new Amazon products)
- [x] Daily blog post generation (7 AM UTC — AI-written with hero images)
- [x] Weekly layout optimization (Sundays 2 AM UTC — promote top performers, replace bottom performers)
- [x] Automated performance scoring and ranking (midnight UTC)
- [x] Scheduler job logging and status tracking
- [x] Automation engine registered in server startup (startScheduler)

## Frontend — Luxury Design
- [x] Global CSS: rose gold / champagne / ivory color palette, Cormorant Garamond + Jost typography
- [x] Navigation: minimal transparent top nav (frosted glass on scroll), mobile hamburger menu
- [x] Hero section: full-width luxury dark background with gold accents and CTA buttons
- [x] Featured products grid (dynamically populated best sellers with performance-aware sizing)
- [x] Product grid with filtering (category, price range, metal type, sort)
- [x] Individual product cards with hover effects, star ratings, badges, and affiliate CTA
- [x] Blog section: editorial-style layout with hero images
- [x] Individual blog post page with AI-generated content and product recommendations
- [x] Mobile-first responsive design with smooth transitions and touch-friendly interface
- [x] Footer with newsletter signup, brand story, and navigation links

## Analytics Dashboard (Admin)
- [x] Overview: total clicks, conversions, revenue, CTR
- [x] Product performance table with sortable metrics
- [x] Best sellers vs underperformers visualization
- [x] Automation job history and status
- [x] Manual trigger controls for automation jobs
- [x] Real-time analytics charts (Recharts)

## Amazon Affiliate Integration
- [x] Amazon Associates API credentials setup (AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG)
- [x] Dynamic affiliate link generation with tracking tags
- [x] Click tracking with session attribution
- [x] Conversion estimation based on click patterns

## Testing
- [x] Unit tests for product ranking algorithm
- [x] Unit tests for analytics event recording (role-based access)
- [x] Unit tests for automation job logic (admin-only endpoints)
- [x] Integration tests for tRPC routers (21 tests, all passing)
- [x] Amazon credentials configuration test

## Bug Fixes
- [x] Fix product card images not fitting/appearing in their containers
- [x] Fix hero section product image display
- [x] Fix blog post hero images
- [x] Fix admin dashboard product image thumbnails
- [x] Ensure all image containers have proper aspect ratios and object-fit
- [x] Remove broken Unsplash URLs from fallback array and database (4 broken URLs replaced)
- [x] Add silent image failure detection (complete=true, naturalWidth=0) via useEffect+useRef
- [x] Fix priceDropPercent "0" rendering bug in ProductCard (JSX falsy number issue)

## Rebrand
- [x] Choose unique unregistered brand name: LYVARA JEWELS (coined word, no trademark, no active website)
- [x] Update all brand name references in codebase (Navbar, Footer, Home, App.tsx, index.html, routers, DB settings)
- [x] Update Manus site title and free subdomain to match new brand (user to set in Settings → General & Domains)

## Mobile & UX Fixes
- [x] Fix mobile navbar logo text overlap — added dark gradient behind transparent navbar, whitespace-nowrap on logo text, white nav links over dark hero

## Posts Automation Enhancement
- [x] Add daily posts automation with varied content types (trend reports, gift guides, styling tips, care guides)
- [x] Add post scheduling queue visible in admin dashboard
- [x] Add manual "Generate Now" trigger with content type selector in admin dashboard

## SEO Configuration
- [x] Add meta title, description, keywords to all pages
- [x] Add Open Graph tags (og:title, og:description, og:image, og:url)
- [x] Add Twitter Card meta tags
- [x] Add JSON-LD structured data (WebSite, ItemList, BlogPosting schemas)
- [x] Add sitemap.xml endpoint (/sitemap.xml)
- [x] Add robots.txt (/robots.txt)
- [x] Add canonical URL tags
- [x] Add per-page dynamic SEO via useSEO hook (Home, Shop, Journal, BlogPost)

## Customer Reviews & Ratings
- [ ] Add reviews table to database schema (id, productId, authorName, authorEmail, rating, title, body, isVerified, helpfulCount, unhelpfulCount, status, createdAt)
- [ ] Add review_votes table (id, reviewId, sessionId, voteType)
- [ ] Backend tRPC procedures: reviews.list, reviews.create, reviews.vote, reviews.aggregate
- [ ] Product detail page (/product/:id) with full review section
- [ ] Star rating widget (interactive 1-5 stars for submission)
- [ ] Aggregate rating breakdown bar chart (5★ to 1★ distribution)
- [ ] Review submission form with name, email, title, body, rating
- [ ] Helpful / Not Helpful vote buttons on each review
- [ ] Review sorting (most recent, most helpful, highest rated, lowest rated)
- [ ] Update ProductCard to link to /product/:id instead of direct Amazon link
- [ ] Add "View Details" button alongside "View on Amazon" on product cards
- [ ] Seed sample reviews for demo products
- [ ] Write vitest tests for review procedures

## Demo Data
- [x] 12 luxury jewelry products seeded (necklaces, bracelets, rings, earrings)
- [x] Site settings seeded (automation flags, thresholds, tags)

## CounterAPI Integration
- [x] Research CounterAPI endpoints and usage
- [x] Build server-side counterService.ts helper (hit, get, getMultiple)
- [x] Build client-side useTracking hook for frontend events
- [x] Server: count product fetches per run, total products fetched all-time
- [x] Server: count blog posts generated (total, per content type)
- [x] Server: count automation job runs (product refresh, optimization, scoring)
- [x] Server: count affiliate link clicks per product
- [x] Server: count review submissions per product
- [x] Client: count page views (home, shop, blog, product detail)
- [x] Client: count product card clicks per product
- [x] Client: count search/filter usage events
- [x] Client: count blog post reads (per post)
- [x] Client: count helpful/not-helpful review votes
- [x] Admin dashboard: Live Counters tab with CounterAPI stats counts alongside internal analytics
- [x] Product detail page: show live view count from CounterAPI
- [x] Write vitest tests for CounterAPI service

## Skimlinks Affiliate Integration
- [x] Add Skimlinks standard JS script to index.html (Publisher ID: 300231X1788063)
- [x] Add AMP Skimlinks script to index.html
- [x] Add Skimlinks promotional banner components (homepage, product pages, blog)
- [x] Track Skimlinks click events via CounterAPI (via trackFilter)

## Blog Post Generation (5 Posts)
- [x] Generate blog post 1: style_guide — "The Art of Adornment: Mastering the Elegant Layer and Stack"
- [x] Generate blog post 2: trend_report — "The Luminous Allure: Gold and Silver's Reign in This Season's Collections"
- [x] Generate blog post 3: gift_ideas — "The Luminous Language of Gold and Silver: A Curated Gift Guide"
- [x] Generate blog post 4: care_tips — "The Enduring Radiance: A Connoisseur's Guide to Fine Jewelry Care"
- [x] Generate blog post 5: seasonal — "The Art of Adornment: Harmonizing Gold and Silver for the Season"

## Meta (Facebook/Instagram) Ads Integration
- [x] Add Meta Pixel script to index.html (ViewContent, PageView events)
- [x] Add client-side Pixel event tracking hook (ViewContent on product pages, PageView on all pages)
- [x] Build server-side Meta Conversions API service (server/metaService.ts)
- [x] Add product catalog feed endpoint (/api/meta/catalog.xml and /api/meta/catalog.json)
- [x] Build Meta Marketing API automation (campaign creation, ad sets, dynamic product ads)
- [x] Add automated budget rules (pause underperformers, scale high-ROAS)
- [x] Add Meta Ads tab to Admin Dashboard (Meta & Pinterest tab)
- [ ] Request META_PIXEL_ID, META_ACCESS_TOKEN, META_AD_ACCOUNT_ID secrets (user action required)

## Pinterest Auto-Poster
- [x] Build Pinterest API service (server/pinterestService.ts)
- [x] Auto-post new products to Pinterest board on product fetch
- [x] Auto-post new blog posts to Pinterest on generation
- [x] Add Pinterest auto-poster to automation engine (fires on each blog generation)
- [x] Add Pinterest stats to Admin Dashboard (Meta & Pinterest tab)
- [ ] Request PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID secrets (user action required)

## UI/UX Fixes
- [x] Fix product card image sizing — enforce consistent height (h-64/h-72 medium, h-56 small) with object-cover centering
