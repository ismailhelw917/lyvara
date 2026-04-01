import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { SlidersHorizontal, X, ChevronDown, Gem } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import { useTracking } from "@/hooks/useTracking";


const CATEGORIES = [
  { value: "", label: "All Jewelry" },
  { value: "anklets", label: "Anklets" },
  { value: "body-jewelry", label: "Body Jewelry" },
  { value: "bracelets", label: "Bracelets" },
  { value: "brooches-pins", label: "Brooches & Pins" },
  { value: "earrings", label: "Earrings" },
  { value: "jewelry-sets", label: "Jewelry Sets" },
  { value: "necklaces", label: "Necklaces" },
  { value: "rings", label: "Rings" },
];

const METALS = [
  { value: "", label: "All Metals" },
  { value: "gold", label: "Yellow Gold" },
  { value: "white_gold", label: "White Gold" },
  { value: "rose_gold", label: "Rose Gold" },
  { value: "platinum", label: "Platinum" },
];

const SORT_OPTIONS = [
  { value: "rank", label: "Featured" },
  { value: "performance", label: "Best Selling" },
  { value: "newest", label: "New Arrivals" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const PRICE_RANGES = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under $50", min: undefined, max: 50 },
  { label: "$50 – $150", min: 50, max: 150 },
  { label: "$150 – $500", min: 150, max: 500 },
  { label: "$500 – $1,000", min: 500, max: 1000 },
  { label: "Over $1,000", min: 1000, max: undefined },
];

export default function Products() {
  const params = useParams<{ category?: string }>();
  const [location] = useLocation();
  const search = useSearch();
  const { trackPageView, trackFilter: trackFilterEvent } = useTracking();

  // Detect if we're on Bargains tab (sort=price_asc in URL)
  const isBargainsTab = search.includes('sort=price_asc');
  
  const [category, setCategory] = useState(params.category || "");
  const [metalType, setMetalType] = useState("");
  const [priceRange, setPriceRange] = useState(0);

  const categoryLabel = isBargainsTab ? "Bargains" : (category
    ? CATEGORIES.find((c) => c.value === category)?.label || "Jewelry"
    : "All Jewelry");
  useSEO({
    title: isBargainsTab ? `Bargain Gold Jewelry — Luxury at Low Prices` : `Shop ${categoryLabel} — Gold Jewelry`,
    description: isBargainsTab ? `Discover premium gold jewelry at unbeatable prices. Limited-time bargains on luxury pieces.` : `Browse our curated collection of luxury ${categoryLabel.toLowerCase()} in gold and rose gold. New arrivals added daily.`,
    keywords: isBargainsTab ? `gold jewelry bargains, discount luxury jewelry, affordable gold jewelry` : `${categoryLabel.toLowerCase()} jewelry, gold ${categoryLabel.toLowerCase()}, luxury jewelry women`,
    url: location,
  });
  const [sortBy, setSortBy] = useState<"rank" | "price_asc" | "price_desc" | "rating" | "newest" | "performance">(isBargainsTab ? "price_asc" : "rank");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 24;

  // Sync category from URL param and bargains tab
  useEffect(() => {
    setCategory(params.category || "");
    if (isBargainsTab) {
      setSortBy("price_asc");
    }
    setPage(0);
  }, [params.category, isBargainsTab]);

  useEffect(() => {
    trackPageView(location);
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPriceRange = PRICE_RANGES[priceRange];

  const queryInput = useMemo(() => ({
    category: category || undefined,
    metalType: metalType || undefined,
    minPrice: selectedPriceRange.min,
    maxPrice: selectedPriceRange.max,
    tab: isBargainsTab ? 'bargains' : 'classic',
    orderBy: sortBy,
    limit: LIMIT,
    offset: page * LIMIT,
  } as const), [category, metalType, priceRange, sortBy, page, isBargainsTab]);

  const { data: products, isLoading } = trpc.products.list.useQuery(queryInput);
  const { data: totalCount } = trpc.products.count.useQuery();

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(0);
    trackFilterEvent("category", val);
  };

  const handleMetalChange = (val: string) => {
    setMetalType(val);
    setPage(0);
    trackFilterEvent("metalType", val);
  };

  const pageTitle = category
    ? CATEGORIES.find((c) => c.value === category)?.label || "Jewelry"
    : "All Jewelry";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Page Header */}
      <div
        className="pt-24 pb-12"
        style={{ background: "linear-gradient(180deg, var(--champagne) 0%, var(--background) 100%)" }}
      >
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold w-8" />
            <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
              Collection
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light" style={{ color: "var(--foreground)" }}>
            {isBargainsTab ? "Bargains" : pageTitle}
          </h1>
          {totalCount !== undefined && (
            <p className="font-sans text-sm font-light mt-2" style={{ color: "var(--muted-foreground)" }}>
              {isBargainsTab ? "Premium jewelry at unbeatable prices" : `${totalCount} curated pieces`}
            </p>
          )}
        </div>
      </div>

      <div className="container pb-20">
        {/* Filter Bar - Hide on Bargains tab */}
        {!isBargainsTab && (
        <div className="flex flex-wrap items-center gap-3 mb-8 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className="font-sans text-xs px-4 py-2 rounded-full transition-all duration-200"
                style={{
                  background: category === cat.value ? "var(--gold)" : "transparent",
                  color: category === cat.value ? "white" : "var(--muted-foreground)",
                  border: `1px solid ${category === cat.value ? "var(--gold)" : "var(--border)"}`,
                  letterSpacing: "0.05em",
                  fontSize: "0.65rem",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 font-sans text-xs px-4 py-2 border transition-colors duration-200"
              style={{
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
              }}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="font-sans text-xs px-4 py-2 border appearance-none pr-8 cursor-pointer"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  background: "white",
                  fontSize: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            </div>
          </div>
        </div>
        )}

        {/* Expanded Filters */}
        {filtersOpen && (
          <div
            className="mb-8 p-6 rounded border animate-scale-in"
            style={{ background: "var(--champagne)", borderColor: "var(--border)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Metal Type */}
              <div>
                <h4 className="font-sans text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: "var(--gold-dark)" }}>
                  Metal Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {METALS.map((metal) => (
                    <button
                      key={metal.value}
                      onClick={() => handleMetalChange(metal.value)}
                      className="font-sans text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                      style={{
                        background: metalType === metal.value ? "var(--gold)" : "white",
                        color: metalType === metal.value ? "white" : "var(--foreground)",
                        border: `1px solid ${metalType === metal.value ? "var(--gold)" : "var(--border)"}`,
                        fontSize: "0.65rem",
                      }}
                    >
                      {metal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-sans text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: "var(--gold-dark)" }}>
                  Price Range
                </h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range, i) => (
                    <button
                      key={range.label}
                      onClick={() => { setPriceRange(i); setPage(0); }}
                      className="font-sans text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                      style={{
                        background: priceRange === i ? "var(--gold)" : "white",
                        color: priceRange === i ? "white" : "var(--foreground)",
                        border: `1px solid ${priceRange === i ? "var(--gold)" : "var(--border)"}`,
                        fontSize: "0.65rem",
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filters */}
            {(metalType || priceRange > 0) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>Active:</span>
                {metalType && (
                  <button
                    onClick={() => setMetalType("")}
                    className="flex items-center gap-1 font-sans text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--gold-light)", color: "var(--gold-dark)", fontSize: "0.6rem" }}
                  >
                    {METALS.find((m) => m.value === metalType)?.label}
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {priceRange > 0 && (
                  <button
                    onClick={() => setPriceRange(0)}
                    className="flex items-center gap-1 font-sans text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--gold-light)", color: "var(--gold-dark)", fontSize: "0.6rem" }}
                  >
                    {PRICE_RANGES[priceRange].label}
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Grid — Masonry Layout */}
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded break-inside-avoid" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-scale-in break-inside-avoid"
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                >
                  <ProductCard product={product as any} />
                </div>
              ))}
            </div>



            {/* Featured Affiliate Products Carousel */}
            {products && products.length > 0 && (
              <div className="my-12 py-8 px-6 rounded" style={{ background: "var(--champagne)" }}>
                <div className="text-center mb-6">
                  <p className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
                    Curated for You
                  </p>
                  <h3 className="font-serif text-2xl font-light mt-2" style={{ color: "var(--foreground)" }}>
                    Premium Picks
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} size="small" />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {products.length === LIMIT && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-luxury flex items-center gap-2"
                >
                  Load More
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold-light)" }} />
            <h3 className="font-serif text-2xl mb-2" style={{ color: "var(--foreground)" }}>
              No pieces found
            </h3>
            <p className="font-sans text-sm font-light mb-6" style={{ color: "var(--muted-foreground)" }}>
              Try adjusting your filters or explore our full collection.
            </p>
            <button
              onClick={() => { setCategory(""); setMetalType(""); setPriceRange(0); }}
              className="btn-luxury"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
