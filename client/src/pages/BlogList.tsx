import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Gem } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

const BLOG_CATEGORIES = [
  { value: "", label: "All" },
  { value: "style_guide", label: "Style Guides" },
  { value: "trend_report", label: "Trend Reports" },
  { value: "gift_ideas", label: "Gift Ideas" },
  { value: "care_tips", label: "Care Tips" },
  { value: "seasonal", label: "Seasonal" },
  { value: "promotional", label: "Spotlights" },
];

export default function BlogList() {
  const [location] = useLocation();
  const [category, setCategory] = useState("");
  const trackView = trpc.analytics.trackEvent.useMutation();

  useEffect(() => {
    trackView.mutate({ eventType: "page_view", page: location });
  }, []);

  const queryInput = useMemo(() => ({
    category: category || undefined,
    limit: 12,
    offset: 0,
  }), [category]);

  const { data: posts, isLoading } = trpc.blog.list.useQuery(queryInput);

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Header */}
      <div
        className="pt-24 pb-12"
        style={{ background: "linear-gradient(180deg, var(--champagne) 0%, var(--background) 100%)" }}
      >
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold w-8" />
            <span className="font-sans text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
              Editorial
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light mb-2" style={{ color: "var(--foreground)" }}>
            The Aurum Journal
          </h1>
          <p className="font-sans font-light text-sm" style={{ color: "var(--muted-foreground)" }}>
            Style guides, trend reports, and jewelry wisdom — curated daily by AI
          </p>
        </div>
      </div>

      <div className="container pb-20">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="font-sans text-xs px-4 py-2 rounded-full transition-all duration-200"
              style={{
                background: category === cat.value ? "var(--gold)" : "transparent",
                color: category === cat.value ? "white" : "var(--muted-foreground)",
                border: `1px solid ${category === cat.value ? "var(--gold)" : "var(--border)"}`,
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="skeleton h-80 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded" />
              ))}
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link
                href={`/journal/${featuredPost.slug}`}
                className="group block mb-12 rounded overflow-hidden transition-all duration-300 hover:shadow-hover"
                style={{ background: "white", boxShadow: "var(--shadow-card)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="h-64 md:h-80 overflow-hidden relative">
                    {featuredPost.heroImageUrl ? (
                      <img
                        src={featuredPost.heroImageUrl}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full gradient-luxury flex items-center justify-center">
                        <span className="font-serif text-6xl" style={{ color: "var(--gold-light)" }}>✦</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="badge-gold">Featured</span>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="badge-gold capitalize">{featuredPost.category?.replace("_", " ")}</span>
                    </div>
                    <h2
                      className="font-serif text-2xl md:text-3xl font-light leading-snug mb-4 transition-colors duration-200 group-hover:text-gold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {featuredPost.title}
                    </h2>
                    <p className="font-sans text-sm font-light leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-2" style={{ color: "var(--gold-dark)" }}>
                      <span className="font-sans text-xs tracking-widest uppercase" style={{ fontSize: "0.6rem" }}>Read Article</span>
                      <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Remaining Posts Grid */}
            {remainingPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/journal/${post.slug}`}
                    className="group block rounded overflow-hidden transition-all duration-300 hover:shadow-luxury"
                    style={{ background: "white", boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="h-48 overflow-hidden relative">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1" style={{ color: "var(--gold-dark)" }}>
                          <span className="font-sans text-xs tracking-widest uppercase" style={{ fontSize: "0.6rem" }}>Read More</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        {post.viewCount !== undefined && post.viewCount > 0 && (
                          <span className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
                            {post.viewCount} views
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold-light)" }} />
            <h3 className="font-serif text-2xl mb-2" style={{ color: "var(--foreground)" }}>
              Articles coming soon
            </h3>
            <p className="font-sans text-sm font-light" style={{ color: "var(--muted-foreground)" }}>
              Our AI editorial team is crafting your first articles. Check back shortly.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
