import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Gem, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { useSEO } from "@/hooks/useSEO";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const trackView = trpc.analytics.trackEvent.useMutation();

  const { data: post, isLoading } = trpc.blog.bySlug.useQuery(
    { slug: params.slug || "" },
    { enabled: !!params.slug }
  );

  const { data: relatedProducts } = trpc.products.featured.useQuery({ limit: 4 });

  useSEO({
    title: post?.title,
    description: post?.excerpt || undefined,
    image: post?.heroImageUrl || undefined,
    url: `/journal/${params.slug}`,
    type: "article",
    jsonLd: post ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.heroImageUrl,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      author: { "@type": "Organization", name: "LYVARA JEWELS" },
      publisher: { "@type": "Organization", name: "LYVARA JEWELS" },
    } : undefined,
  });

  useEffect(() => {
    if (post) {
      trackView.mutate({ eventType: "blog_view", blogPostId: post.id, page: `/journal/${params.slug}` });
    }
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="container pt-32 pb-20 max-w-3xl mx-auto space-y-4">
          <div className="skeleton h-8 w-1/3 rounded" />
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-80 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-5 rounded" />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="container pt-32 pb-20 text-center">
          <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--gold-light)" }} />
          <h2 className="font-serif text-3xl mb-4" style={{ color: "var(--foreground)" }}>Article Not Found</h2>
          <Link href="/journal" className="btn-luxury">
            Back to Journal
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero Image */}
      {post.heroImageUrl && (
        <div className="relative h-64 md:h-96 overflow-hidden mt-16">
          <img
            src={post.heroImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-hero" />
        </div>
      )}

      <div className={`container pb-20 ${!post.heroImageUrl ? "pt-28" : "pt-12"}`}>
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase mb-8 transition-colors duration-200 hover:opacity-70"
            style={{ color: "var(--gold-dark)", fontSize: "0.6rem" }}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Journal
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge-gold capitalize">{post.category?.replace("_", " ")}</span>
              {post.isAiGenerated && (
                <span
                  className="font-sans text-xs px-2 py-0.5 rounded-sm"
                  style={{ background: "var(--blush)", color: "var(--rose-gold)", fontSize: "0.6rem", letterSpacing: "0.08em" }}
                >
                  AI CURATED
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight mb-4" style={{ color: "var(--foreground)" }}>
              {post.title}
            </h1>
            <p className="font-sans text-base font-light leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              {post.excerpt}
            </p>
            <div className="flex items-center gap-4 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {post.viewCount !== undefined && post.viewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                  <span className="font-sans text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                    {post.viewCount} readers
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Article Content */}
          <div className="prose-luxury mb-12">
            <Streamdown>{post.content || ""}</Streamdown>
          </div>

          {/* Tags */}
          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              {(post.tags as string[]).map((tag) => (
                <span
                  key={tag}
                  className="font-sans text-xs px-3 py-1 rounded-full"
                  style={{ background: "var(--champagne)", color: "var(--muted-foreground)", fontSize: "0.65rem" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="divider-gold w-8" />
              <h2 className="font-serif text-2xl font-light" style={{ color: "var(--foreground)" }}>
                Shop the Story
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} size="medium" />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
