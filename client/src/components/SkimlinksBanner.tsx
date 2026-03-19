/**
 * SkimlinksBanner — Curated promotional banners for jewelry brands.
 * Links are plain <a> tags so Skimlinks auto-converts them to tracked affiliate links.
 * Variants: "horizontal" (full-width strip), "sidebar" (vertical card), "inline" (between grid rows)
 */

import { useTracking } from "@/hooks/useTracking";

interface BannerDeal {
  id: string;
  brand: string;
  headline: string;
  subline: string;
  cta: string;
  url: string;
  badge?: string;
  accentColor: string;
  textColor: string;
}

// Curated jewelry brand deals — Skimlinks auto-converts these to tracked affiliate links
const JEWELRY_DEALS: BannerDeal[] = [
  {
    id: "pandora-1",
    brand: "Pandora",
    headline: "Up to 30% Off Charm Bracelets",
    subline: "Build your story with iconic Pandora charms. Limited time offer.",
    cta: "Shop Pandora",
    url: "https://www.pandora.net/en-us/",
    badge: "Sale",
    accentColor: "#1a1a2e",
    textColor: "#c9a96e",
  },
  {
    id: "mejuri-1",
    brand: "Mejuri",
    headline: "Fine Jewelry, Everyday Luxury",
    subline: "Solid gold and sterling silver pieces designed for real life.",
    cta: "Explore Mejuri",
    url: "https://mejuri.com/",
    badge: "New Arrivals",
    accentColor: "#f5f0e8",
    textColor: "#8b6914",
  },
  {
    id: "kendra-1",
    brand: "Kendra Scott",
    headline: "Color Your World in Gold",
    subline: "Signature stone jewelry with free personalization on select styles.",
    cta: "Shop Now",
    url: "https://www.kendrascott.com/",
    badge: "Free Personalization",
    accentColor: "#2c1810",
    textColor: "#d4af37",
  },
  {
    id: "gorjana-1",
    brand: "Gorjana",
    headline: "Demi-Fine Gold Jewelry",
    subline: "Effortlessly layerable 18k gold-plated pieces for every occasion.",
    cta: "Discover Gorjana",
    url: "https://gorjana.com/",
    badge: "Bestsellers",
    accentColor: "#f9f3ec",
    textColor: "#9b7940",
  },
  {
    id: "ana-luisa-1",
    brand: "Ana Luisa",
    headline: "Sustainable Fine Jewelry",
    subline: "Recycled gold and lab-grown diamonds. Beautiful and responsible.",
    cta: "Shop Sustainably",
    url: "https://www.analuisa.com/",
    badge: "Eco-Friendly",
    accentColor: "#1c2b1c",
    textColor: "#a8c090",
  },
  {
    id: "catbird-1",
    brand: "Catbird",
    headline: "Delicate Gold Stacking Rings",
    subline: "Handcrafted in Brooklyn. Ethically sourced. Endlessly stackable.",
    cta: "Explore Catbird",
    url: "https://www.catbirdnyc.com/",
    badge: "Handcrafted",
    accentColor: "#faf7f2",
    textColor: "#7a5c3a",
  },
];

// Pick a deterministic deal based on a seed (page position) to avoid hydration mismatches
function pickDeal(seed: number): BannerDeal {
  return JEWELRY_DEALS[seed % JEWELRY_DEALS.length];
}

// ─── Horizontal Banner (full-width strip between product rows) ────────────────
export function SkimlinksHorizontalBanner({ seed = 0 }: { seed?: number }) {
  const deal = pickDeal(seed);
  const { trackFilter } = useTracking();
  const trackBannerClick = (id: string) => trackFilter("skimlinks_banner", id);

  return (
    <div className="w-full my-8 overflow-hidden rounded-lg shadow-md border border-[#e8d9c0]/40">
      <a
        href={deal.url}
        target="_blank"
        rel="noopener"
        onClick={() => trackBannerClick(deal.id)}
        className="block group"
        aria-label={`${deal.brand} — ${deal.headline}`}
      >
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: deal.accentColor }}
        >
          {/* Left: brand + copy */}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {deal.badge && (
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border"
                  style={{ borderColor: deal.textColor, color: deal.textColor }}
                >
                  {deal.badge}
                </span>
              )}
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: deal.textColor, opacity: 0.7 }}
              >
                {deal.brand}
              </span>
            </div>
            <p
              className="font-['Cormorant_Garamond'] text-xl font-semibold leading-tight"
              style={{ color: deal.textColor }}
            >
              {deal.headline}
            </p>
            <p
              className="text-xs font-['Jost'] opacity-70 max-w-sm"
              style={{ color: deal.textColor }}
            >
              {deal.subline}
            </p>
          </div>

          {/* Right: CTA */}
          <div className="flex-shrink-0">
            <span
              className="inline-block px-6 py-2.5 text-xs font-semibold tracking-widest uppercase border rounded-full transition-all group-hover:scale-105"
              style={{ borderColor: deal.textColor, color: deal.textColor }}
            >
              {deal.cta} →
            </span>
          </div>
        </div>

        {/* Skimlinks attribution line */}
        <div className="text-center py-1 bg-black/5 text-[10px] text-gray-400 font-['Jost']">
          Sponsored · Affiliate Link
        </div>
      </a>
    </div>
  );
}

// ─── Sidebar Banner (vertical card for blog/product sidebars) ─────────────────
export function SkimlinksSidebarBanner({ seed = 1 }: { seed?: number }) {
  const deal = pickDeal(seed);
  const { trackFilter } = useTracking();
  const trackBannerClick = (id: string) => trackFilter("skimlinks_sidebar", id);

  return (
    <div className="overflow-hidden rounded-lg shadow-md border border-[#e8d9c0]/40">
      <a
        href={deal.url}
        target="_blank"
        rel="noopener"
        onClick={() => trackBannerClick(deal.id)}
        className="block group"
        aria-label={`${deal.brand} — ${deal.headline}`}
      >
        <div
          className="flex flex-col gap-3 p-5 transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: deal.accentColor }}
        >
          {deal.badge && (
            <span
              className="self-start text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border"
              style={{ borderColor: deal.textColor, color: deal.textColor }}
            >
              {deal.badge}
            </span>
          )}
          <span
            className="text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ color: deal.textColor, opacity: 0.7 }}
          >
            {deal.brand}
          </span>
          <p
            className="font-['Cormorant_Garamond'] text-lg font-semibold leading-snug"
            style={{ color: deal.textColor }}
          >
            {deal.headline}
          </p>
          <p
            className="text-xs font-['Jost'] opacity-70 leading-relaxed"
            style={{ color: deal.textColor }}
          >
            {deal.subline}
          </p>
          <span
            className="mt-1 inline-block text-center px-4 py-2 text-xs font-semibold tracking-widest uppercase border rounded-full transition-all group-hover:scale-105"
            style={{ borderColor: deal.textColor, color: deal.textColor }}
          >
            {deal.cta} →
          </span>
        </div>
        <div className="text-center py-1 bg-black/5 text-[10px] text-gray-400 font-['Jost']">
          Sponsored · Affiliate Link
        </div>
      </a>
    </div>
  );
}

// ─── Inline Mini Banner (compact, between blog paragraphs) ────────────────────
export function SkimlinksInlineBanner({ seed = 2 }: { seed?: number }) {
  const deal = pickDeal(seed);
  const { trackFilter } = useTracking();
  const trackBannerClick = (id: string) => trackFilter("skimlinks_inline", id);

  return (
    <div className="my-6 overflow-hidden rounded-md border border-[#e8d9c0]/40 shadow-sm">
      <a
        href={deal.url}
        target="_blank"
        rel="noopener"
        onClick={() => trackBannerClick(deal.id)}
        className="flex items-center gap-4 px-4 py-3 group transition-opacity hover:opacity-90"
        style={{ backgroundColor: deal.accentColor }}
        aria-label={`${deal.brand} — ${deal.headline}`}
      >
        {/* Decorative gem icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
          style={{ backgroundColor: deal.textColor + "22", color: deal.textColor }}
        >
          💎
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: deal.textColor, opacity: 0.7 }}
          >
            {deal.brand}
          </p>
          <p
            className="font-['Cormorant_Garamond'] text-base font-semibold truncate"
            style={{ color: deal.textColor }}
          >
            {deal.headline}
          </p>
        </div>
        <span
          className="flex-shrink-0 text-xs font-semibold tracking-wider uppercase px-3 py-1.5 border rounded-full group-hover:scale-105 transition-transform"
          style={{ borderColor: deal.textColor, color: deal.textColor }}
        >
          {deal.cta}
        </span>
      </a>
      <div className="text-center py-0.5 bg-black/5 text-[10px] text-gray-400 font-['Jost']">
        Sponsored · Affiliate Link
      </div>
    </div>
  );
}
