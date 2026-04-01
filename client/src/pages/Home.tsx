import { ArrowRight, Gem, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";


// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="divider-gold w-8" />
              <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
                Curated Luxury
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-tight" style={{ color: "var(--foreground)" }}>
              Wear Your <span style={{ color: "var(--gold)" }}>Story in Gold</span>
            </h1>
            <p className="font-sans text-lg leading-relaxed font-light" style={{ color: "oklch(0.75 0.01 60)" }}>
              Discover the world's most exquisite gold jewelry, curated daily for the woman who knows her worth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/shop"
                className="btn-luxury-filled px-8 py-3 text-center font-semibold transition-all duration-200 hover:shadow-lg"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
              <Link
                href="/journal"
                className="btn-luxury-outline px-8 py-3 text-center font-semibold transition-all duration-200"
              >
                Style Journal
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div
              className="w-64 h-64 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--gold) 0%, var(--rose-gold) 100%)",
                opacity: 0.15,
              }}
            >
              <Gem className="w-32 h-32" style={{ color: "var(--gold)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Category Navigation ──────────────────────────────────────────────────────
function CategoryStrip() {
  return (
    <section className="py-8 border-y" style={{ borderColor: "var(--border)", background: "var(--ivory)" }}>
      <div className="container">
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { label: "Necklaces", href: "/shop?category=necklaces" },
            { label: "Bracelets", href: "/shop?category=bracelets" },
            { label: "Rings", href: "/shop?category=rings" },
            { label: "Earrings", href: "/shop?category=earrings" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-sans text-sm tracking-widest uppercase transition-colors duration-200 hover:text-foreground"
              style={{ color: "var(--muted-foreground)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedProducts() {
  const { data: products, isLoading } = trpc.products.list.useQuery({ limit: 4, tab: 'classic' });

  return (
    <section className="py-20" style={{ background: "var(--background)", minHeight: '400px' }}>
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
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-80 rounded" />
            ))}
          </div>
        )}
        
        {!isLoading && products && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <div key={product.id} className="animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={product as any} size={i === 0 ? "large" : "medium"} />
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && (!products || products.length === 0) && (
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

// ─── Amazon Native Shopping Ads ───────────────────────────────────────────────
function AmazonNativeAds() {
  const { data: recommendedProducts } = trpc.products.featured.useQuery({ limit: 8, tab: 'classic' });

  return (
    <section className="py-16" style={{ background: "var(--champagne)" }}>
      <div className="container">
        <div className="text-center mb-8">
          <p className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
            Recommended for You
          </p>
          <h2 className="font-serif text-3xl font-light mt-2" style={{ color: "var(--foreground)" }}></h2>
        </div>
      </div>
    </section>
  );
}

// ─── Brand Banner ─────────────────────────────────────────────────────────────
function BrandBanner() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-8">
          <p className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
            Trusted by Thousands
          </p>
          <h2 className="font-serif text-4xl font-light" style={{ color: "var(--foreground)" }}>
            Best Sellers
          </h2>
        </div>
        <div className="text-center py-16">
          <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold-light)" }} />
          <p className="font-serif text-xl mb-2" style={{ color: "var(--muted-foreground)" }}>
            Curating your collection...
          </p>
          <p className="font-sans text-sm font-light" style={{ color: "var(--muted-foreground)" }}>
            Our automated system is fetching the finest jewelry for you.
          </p>
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
              className="group block p-6 rounded text-center transition-all duration-300 hover:shadow-luxury"
              style={{ background: "white", boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ background: metal.color, opacity: 0.2 }}
              />
              <h3 className="font-serif text-lg font-light mb-1" style={{ color: "var(--foreground)" }}>
                {metal.label}
              </h3>
              <p className="font-sans text-sm" style={{ color: "var(--muted-foreground)" }}>
                {metal.desc}
              </p>
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--champagne)" }}>
                      <Gem className="w-12 h-12" style={{ color: "var(--gold-light)" }} />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="font-sans text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold-dark)" }}>
                    {post.category}
                  </p>
                  <h3 className="font-serif text-lg font-light mb-2 line-clamp-2" style={{ color: "var(--foreground)" }}>
                    {post.title}
                  </h3>
                  <p className="font-sans text-sm font-light line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── Newsletter Section ───────────────────────────────────────────────────────
function NewsletterSection() {
  return (
    <section className="py-20" style={{ background: "var(--ivory)" }}>
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl font-light mb-4" style={{ color: "var(--foreground)" }}>
            Stay Updated
          </h2>
          <p className="font-sans text-lg font-light" style={{ color: "oklch(0.75 0.01 60)" }}>
            Get exclusive access to new arrivals, styling tips, and special offers delivered to your inbox.
          </p>
        </div>
        <form className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded border"
            style={{ borderColor: "var(--border)", background: "white" }}
          />
          <button
            type="submit"
            className="btn-luxury-filled px-6 py-3 font-semibold transition-all duration-200 hover:shadow-lg"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "var(--foreground)", color: "white" }}>
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="font-serif text-lg font-light mb-4">About</h3>
            <p className="font-sans text-sm font-light opacity-75">
              Lyvarajewels curates the world's finest gold and silver jewelry for the discerning woman.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg font-light mb-4">Shop</h3>
            <ul className="space-y-2 font-sans text-sm font-light">
              <li><Link href="/shop">All Jewelry</Link></li>
              <li><Link href="/shop?metal=gold">Gold</Link></li>
              <li><Link href="/shop?metal=silver">Silver</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg font-light mb-4">Company</h3>
            <ul className="space-y-2 font-sans text-sm font-light">
              <li><Link href="/journal">Journal</Link></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg font-light mb-4">Contact</h3>
            <ul className="space-y-3 font-sans text-sm font-light">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@lyvarajewels.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                New York, NY
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-center font-sans text-sm font-light opacity-75">
            © 2026 Lyvarajewels. All rights reserved. | Affiliate links may earn us a commission.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <HeroSection />
      <CategoryStrip />
      <FeaturedProducts />
      <AmazonNativeAds />
      <BrandBanner />
      <MetalShowcase />
      <BlogPreview />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
