import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Gem, Sparkles, Star, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const { data: heroProducts } = trpc.products.hero.useQuery({ limit: 1 });
  const heroProduct = heroProducts?.[0];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, oklch(0.14 0.015 30) 0%, oklch(0.20 0.02 35) 40%, oklch(0.16 0.018 25) 100%)",
        }}
      />
      {/* Decorative gold lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 60px)",
        }}
      />
      {/* Hero product image */}
      {heroProduct?.imageUrl && (
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          <img
            src={heroProduct.imageUrl}
            alt={heroProduct.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.14 0.015 30) 0%, transparent 40%, transparent 100%)" }} />
        </div>
      )}
      {/* Fallback decorative image */}
      {!heroProduct?.imageUrl && (
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center opacity-20">
          <Gem className="w-64 h-64" style={{ color: "var(--gold)" }} />
        </div>
      )}

      <div className="container relative z-10 py-32">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <div className="divider-gold w-12" />
            <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-light)" }}>
              Curated Luxury
            </span>
          </div>
          <h1
            className="font-serif text-5xl md:text-7xl font-light leading-none mb-6 animate-fade-in-up"
            style={{ color: "white", animationDelay: "0.1s" }}
          >
            Wear Your
            <br />
            <span className="shimmer-text">Story in Gold</span>
          </h1>
          <p
            className="font-sans font-light text-lg leading-relaxed mb-10 animate-fade-in-up"
            style={{ color: "oklch(0.75 0.01 60)", maxWidth: "480px", animationDelay: "0.2s" }}
          >
            Discover the world's most exquisite gold and silver jewelry, 
            curated daily for the woman who knows her worth.
          </p>
          <div className="flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/shop" className="btn-luxury-filled flex items-center gap-2">
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/journal" className="btn-luxury flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
              Style Journal
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-8" style={{ background: "var(--gold)" }} />
        <span className="font-sans text-xs tracking-widest" style={{ color: "var(--gold)", fontSize: "0.55rem" }}>SCROLL</span>
      </div>
    </section>
  );
}

// ─── Category Strip ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Necklaces", href: "/shop/necklaces", icon: "✦", desc: "Delicate chains & pendants" },
  { label: "Bracelets", href: "/shop/bracelets", icon: "◈", desc: "Bangles, cuffs & tennis" },
  { label: "Rings", href: "/shop/rings", icon: "◯", desc: "Stacking, cocktail & bands" },
  { label: "Earrings", href: "/shop/earrings", icon: "◇", desc: "Studs, hoops & drops" },
];

function CategoryStrip() {
  return (
    <section className="py-16 bg-champagne" style={{ background: "var(--champagne)" }}>
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group flex flex-col items-center text-center p-6 rounded transition-all duration-300 hover:shadow-luxury"
              style={{ background: "white" }}
            >
              <span
                className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-125"
                style={{ color: "var(--gold)" }}
              >
                {cat.icon}
              </span>
              <h3 className="font-serif text-base mb-1" style={{ color: "var(--foreground)" }}>
                {cat.label}
              </h3>
              <p className="font-sans text-xs font-light" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                {cat.desc}
              </p>
              <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="font-sans text-xs" style={{ color: "var(--gold-dark)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>SHOP NOW</span>
                <ChevronRight className="w-3 h-3" style={{ color: "var(--gold-dark)" }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedProducts() {
  const { data: products, isLoading } = trpc.products.featured.useQuery({ limit: 8 });

  return (
    <section className="py-20">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="divider-gold w-8" />
              <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
                Curated For You
              </span>
            </div>
            <h2 className="font-serif text-4xl font-light" style={{ color: "var(--foreground)" }}>
              Best Sellers
            </h2>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase transition-colors duration-200 hover:text-foreground"
            style={{ color: "var(--gold-dark)" }}
          >
            View All Jewelry
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-80 rounded" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <div key={product.id} className="animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={product as any} size={i === 0 ? "large" : "medium"} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold-light)" }} />
            <p className="font-serif text-xl mb-2" style={{ color: "var(--muted-foreground)" }}>
              Curating your collection...
            </p>
            <p className="font-sans text-sm font-light" style={{ color: "var(--muted-foreground)" }}>
              Our automated system is fetching the finest jewelry for you.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Brand Story Banner ───────────────────────────────────────────────────────
function BrandBanner() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, oklch(0.14 0.015 30) 0%, oklch(0.22 0.025 35) 100%)" }}
    >
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 50% 50%, var(--gold) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="container relative z-10 text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-6" style={{ color: "var(--gold)" }} />
        <h2 className="font-serif text-4xl md:text-5xl font-light mb-6" style={{ color: "white" }}>
          Every Piece Tells a Story
        </h2>
        <p className="font-sans font-light text-base leading-relaxed mx-auto mb-10" style={{ color: "oklch(0.75 0.01 60)", maxWidth: "560px" }}>
          We curate only the finest gold and silver jewelry from trusted artisans and brands, 
          updated daily so you always discover something extraordinary.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { number: "500+", label: "Curated Pieces" },
            { number: "Daily", label: "New Arrivals" },
            { number: "100%", label: "Authenticated" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-serif text-3xl mb-1" style={{ color: "var(--gold)" }}>{stat.number}</div>
              <div className="font-sans text-xs tracking-widest uppercase" style={{ color: "oklch(0.65 0.01 60)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Metal Type Showcase ──────────────────────────────────────────────────────
function MetalShowcase() {
  const metals = [
    { type: "gold", label: "Yellow Gold", desc: "Timeless warmth", color: "var(--gold)", href: "/shop?metal=gold" },
    { type: "white_gold", label: "White Gold", desc: "Modern elegance", color: "var(--silver)", href: "/shop?metal=white_gold" },
    { type: "rose_gold", label: "Rose Gold", desc: "Romantic blush", color: "var(--rose-gold)", href: "/shop?metal=rose_gold" },
    { type: "silver", label: "Sterling Silver", desc: "Classic brilliance", color: "oklch(0.70 0.01 250)", href: "/shop?metal=silver" },
  ];

  return (
    <section className="py-20" style={{ background: "var(--ivory)" }}>
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="divider-gold w-8" />
            <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
              Shop by Metal
            </span>
            <div className="divider-gold w-8" />
          </div>
          <h2 className="font-serif text-4xl font-light" style={{ color: "var(--foreground)" }}>
            Find Your Signature Metal
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metals.map((metal) => (
            <Link
              key={metal.type}
              href={metal.href}
              className="group flex flex-col items-center text-center p-8 rounded transition-all duration-300 hover:shadow-luxury"
              style={{ background: "white" }}
            >
              <div
                className="w-16 h-16 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 35% 35%, white 0%, ${metal.color} 60%)`,
                  boxShadow: `0 4px 16px ${metal.color}40`,
                }}
              />
              <h3 className="font-serif text-base mb-1" style={{ color: "var(--foreground)" }}>{metal.label}</h3>
              <p className="font-sans text-xs font-light" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>{metal.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Blog Preview ─────────────────────────────────────────────────────────────
function BlogPreview() {
  const { data: posts, isLoading } = trpc.blog.list.useQuery({ limit: 3 });

  return (
    <section className="py-20">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="divider-gold w-8" />
              <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
                Style Journal
              </span>
            </div>
            <h2 className="font-serif text-4xl font-light" style={{ color: "var(--foreground)" }}>
              From Our Editors
            </h2>
          </div>
          <Link
            href="/journal"
            className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase"
            style={{ color: "var(--gold-dark)" }}
          >
            All Articles
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/journal/${post.slug}`}
                className="group block rounded overflow-hidden transition-all duration-300 hover:shadow-luxury"
                style={{ background: "white", boxShadow: "var(--shadow-card)" }}
              >
                <div className="h-48 overflow-hidden bg-secondary relative">
                  {post.heroImageUrl ? (
                    <img
                      src={post.heroImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full gradient-luxury flex items-center justify-center">
                      <span className="font-serif text-4xl" style={{ color: "var(--gold-light)" }}>✦</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge-gold capitalize">{post.category?.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="font-serif text-lg font-light leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-gold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {post.title}
                  </h3>
                  <p className="font-sans text-xs font-light line-clamp-2 mb-3" style={{ color: "var(--muted-foreground)" }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-1" style={{ color: "var(--gold-dark)" }}>
                    <span className="font-sans text-xs tracking-widest uppercase" style={{ fontSize: "0.6rem" }}>Read More</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="font-serif text-xl" style={{ color: "var(--muted-foreground)" }}>
              Our editors are crafting your first articles...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Newsletter Section ───────────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-20" style={{ background: "var(--blush)" }}>
      <div className="container max-w-2xl text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="divider-gold w-8" />
          <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
            Stay Inspired
          </span>
          <div className="divider-gold w-8" />
        </div>
        <h2 className="font-serif text-4xl font-light mb-4" style={{ color: "var(--foreground)" }}>
          Jewelry Discoveries, Daily
        </h2>
        <p className="font-sans font-light text-sm leading-relaxed mb-8" style={{ color: "var(--muted-foreground)" }}>
          Be the first to discover new arrivals, exclusive deals, and style inspiration 
          curated for the discerning woman.
        </p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Star className="w-5 h-5" style={{ color: "var(--gold)" }} />
            <p className="font-serif text-lg" style={{ color: "var(--foreground)" }}>
              Thank you for joining our circle.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-4 py-3 font-sans text-sm font-light border outline-none focus:border-gold transition-colors duration-200"
              style={{
                borderColor: "var(--border)",
                background: "white",
                color: "var(--foreground)",
              }}
            />
            <button type="submit" className="btn-luxury-filled whitespace-nowrap">
              Join Now
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  useSEO({
    title: "Luxury Gold & Silver Jewelry for Women",
    description: "Discover exquisite gold and silver jewelry curated daily for the discerning woman. Shop necklaces, bracelets, rings, and earrings from top luxury brands.",
    keywords: "luxury gold jewelry, silver jewelry women, gold necklaces, diamond bracelets, fine jewelry, jewelry gifts for women",
    url: "/",
  });
  const trackView = trpc.analytics.trackEvent.useMutation();
  useEffect(() => {
    trackView.mutate({ eventType: "page_view", page: "/" });
  }, []);;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <HeroSection />
      <CategoryStrip />
      <FeaturedProducts />
      <BrandBanner />
      <MetalShowcase />
      <BlogPreview />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
