import { useState, useEffect, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Star, ThumbsUp, ThumbsDown, ChevronLeft, ShoppingBag, Shield, Truck, Award, ChevronDown } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { nanoid } from "nanoid";
import { SkimlinksHorizontalBanner } from "@/components/SkimlinksBanner";
import { useMetaPixel } from "@/hooks/useMetaPixel";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  "https://images.unsplash.com/photo-1573408301185-9519f94815b1?w=800&q=80",
  "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
];

function getSessionId(): string {
  let sid = sessionStorage.getItem("lyvara_sid");
  if (!sid) {
    sid = nanoid(24);
    sessionStorage.setItem("lyvara_sid", sid);
  }
  return sid;
}

// ─── Star Display ─────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Interactive Star Picker ──────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
          aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              s <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200 hover:fill-amber-200 hover:text-amber-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-stone-600 w-8 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-stone-400 w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, sessionId }: { review: any; sessionId: string }) {
  const utils = trpc.useUtils();
  const voteMutation = trpc.reviews.vote.useMutation({
    onSuccess: () => utils.reviews.list.invalidate(),
    onError: () => toast.error("Could not record your vote. Please try again."),
  });

  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <div className="py-6 border-b border-stone-100 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-amber-700">
              {review.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-800 text-sm">{review.authorName}</span>
              {review.isVerified && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0">
                  <Shield className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <span className="text-xs text-stone-400">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
        <StarDisplay rating={review.rating} />
      </div>

      {review.title && (
        <h4 className="font-semibold text-stone-800 mb-1 text-sm">{review.title}</h4>
      )}
      <p className="text-stone-600 text-sm leading-relaxed mb-4">{review.body}</p>

      <div className="flex items-center gap-4">
        <span className="text-xs text-stone-400">Was this helpful?</span>
        <button
          onClick={() => voteMutation.mutate({ reviewId: review.id, sessionId, voteType: "helpful" })}
          disabled={voteMutation.isPending}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-600 transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Yes ({review.helpfulCount})</span>
        </button>
        <button
          onClick={() => voteMutation.mutate({ reviewId: review.id, sessionId, voteType: "unhelpful" })}
          disabled={voteMutation.isPending}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-500 transition-colors"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>No ({review.unhelpfulCount})</span>
        </button>
      </div>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({ productId, onSuccess }: { productId: number; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onSuccess();
      toast.success("Thank you! Your review has been published.");
    },
    onError: (err) => toast.error(err.message || "Could not submit review. Please try again."),
  });

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
        </div>
        <h3 className="font-serif text-xl text-stone-800 mb-2">Thank You!</h3>
        <p className="text-stone-500 text-sm">Your review has been published and will help other women make their choice.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating === 0) { toast.error("Please select a star rating."); return; }
        if (body.length < 10) { toast.error("Review must be at least 10 characters."); return; }
        createMutation.mutate({ productId, authorName: name, authorEmail: email || undefined, rating, title: title || undefined, body });
      }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Your Rating *</label>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Sarah M."
            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Review Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Summarise your experience"
          className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Your Review *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Share your experience — quality, packaging, how it looks when worn..."
          className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white resize-none"
        />
        <p className="text-xs text-stone-400 mt-1 text-right">{body.length}/2000</p>
      </div>

      <Button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg"
      >
        {createMutation.isPending ? "Publishing..." : "Publish Review"}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = parseInt(params?.id ?? "0", 10);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "highest" | "lowest">("recent");
  const [showForm, setShowForm] = useState(false);
  const [imgError, setImgError] = useState(false);
  const sessionId = useMemo(() => getSessionId(), []);

  const { data: products } = trpc.products.list.useQuery({ limit: 100 });
  const product = products?.find((p) => p.id === productId);

  const { data: reviews, refetch: refetchReviews } = trpc.reviews.list.useQuery(
    { productId, sortBy, limit: 50 },
    { enabled: productId > 0 }
  );
  const { data: aggregate, refetch: refetchAggregate } = trpc.reviews.aggregate.useQuery(
    { productId },
    { enabled: productId > 0 }
  );

  const trackClick = trpc.analytics.trackEvent.useMutation();
  const { trackViewContent, trackAddToCart } = useMetaPixel();

  // Fire Meta Pixel ViewContent when product loads
  useEffect(() => {
    if (product) {
      trackViewContent({
        id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        category: product.category ?? undefined,
        brand: product.brand ?? undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useSEO({
    title: product ? `${product.title} | LYVARA JEWELS` : "Product | LYVARA JEWELS",
    description: product?.description ?? `Shop ${product?.title} — luxury gold and silver jewelry curated for women.`,
  });

  const imageUrl = imgError
    ? FALLBACK_IMAGES[productId % FALLBACK_IMAGES.length]
    : product?.imageUrl
    ? `${product.imageUrl}${product.imageUrl.includes("?") ? "&" : "?"}w=800&q=85`
    : FALLBACK_IMAGES[productId % FALLBACK_IMAGES.length];

  const handleAffiliateClick = () => {
    if (product) {
      trackClick.mutate({ eventType: "affiliate_click", productId: product.id, page: `/product/${product.id}` });
      // Fire Meta Pixel AddToCart (purchase intent signal)
      trackAddToCart({
        id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        category: product.category ?? undefined,
      });
      window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-400 font-light">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const avgRating = aggregate?.averageRating ?? 0;
  const totalReviews = aggregate?.totalCount ?? 0;
  const dist = aggregate?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-stone-100 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-stone-400">
          <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-amber-600 transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-stone-600 truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 lg:py-16">
        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-50 shadow-sm">
              <img
                src={imageUrl}
                alt={product.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
            {product.isFeatured && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-amber-500 text-white border-0 text-xs px-3 py-1">
                  <Award className="w-3 h-3 mr-1" /> BEST SELLER
                </Badge>
              </div>
            )}
            {(product.priceDropPercent ?? 0) > 0 && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-rose-500 text-white border-0 text-xs px-3 py-1">
                  -{Math.round(product.priceDropPercent ?? 0)}% OFF
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <Link href="/shop" className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-600 transition-colors mb-4 w-fit">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Shop
            </Link>

            {product.brand && (
              <p className="text-xs tracking-widest text-amber-600 uppercase font-medium mb-2">{product.brand}</p>
            )}

            <h1 className="font-serif text-2xl lg:text-3xl text-stone-900 leading-snug mb-4">
              {product.title}
            </h1>

            {/* Rating summary */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <StarDisplay rating={avgRating} size="md" />
                <span className="text-sm font-medium text-stone-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-stone-400">({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>
              </div>
            )}

            {/* Amazon rating */}
            {product.amazonRating && (
              <div className="flex items-center gap-2 mb-4">
                <StarDisplay rating={product.amazonRating} size="sm" />
                <span className="text-xs text-stone-400">{product.amazonRating.toFixed(1)} on Amazon ({product.reviewCount?.toLocaleString()} ratings)</span>
              </div>
            )}

            <Separator className="my-4" />

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {product.price && (
                <span className="text-3xl font-light text-stone-900">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
              )}
              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price ?? "0") && (
                <span className="text-lg text-stone-400 line-through">
                  ${parseFloat(product.originalPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 capitalize">
                {product.metalType?.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs border-stone-200 text-stone-600 capitalize">
                {product.category}
              </Badge>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-stone-600 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Shield, label: "Secure Payment" },
                { icon: Truck, label: "Fast Delivery" },
                { icon: Award, label: "Quality Assured" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-stone-50 rounded-xl text-center">
                  <Icon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-stone-500">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={handleAffiliateClick}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-100"
            >
              <ShoppingBag className="w-5 h-5" />
              View on Amazon
            </Button>
            <p className="text-xs text-stone-400 text-center mt-2">
              You'll be redirected to Amazon to complete your purchase
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-stone-100 pt-12">
          <h2 className="font-serif text-2xl text-stone-900 mb-8">Customer Reviews</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
            {/* Aggregate */}
            <div className="lg:col-span-1">
              <div className="bg-stone-50 rounded-2xl p-6 text-center mb-6">
                <div className="text-6xl font-light text-stone-900 mb-2">
                  {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <StarDisplay rating={avgRating} size="md" />
                <p className="text-sm text-stone-400 mt-2">
                  {totalReviews > 0 ? `Based on ${totalReviews} review${totalReviews !== 1 ? "s" : ""}` : "No reviews yet"}
                </p>
              </div>

              {totalReviews > 0 && (
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar
                      key={star}
                      label={`${star}★`}
                      count={dist[star] ?? 0}
                      total={totalReviews}
                    />
                  ))}
                </div>
              )}

              <Button
                onClick={() => setShowForm(!showForm)}
                variant="outline"
                className="w-full mt-6 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {showForm ? "Cancel Review" : "Write a Review"}
              </Button>
            </div>

            {/* Reviews list + form */}
            <div className="lg:col-span-2">
              {showForm && (
                <div className="bg-stone-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-serif text-lg text-stone-800 mb-5">Share Your Experience</h3>
                  <ReviewForm
                    productId={productId}
                    onSuccess={() => {
                      refetchReviews();
                      refetchAggregate();
                      setShowForm(false);
                    }}
                  />
                </div>
              )}

              {/* Sort controls */}
              {(reviews?.length ?? 0) > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-stone-500">{reviews?.length} review{reviews?.length !== 1 ? "s" : ""}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="helpful">Most Helpful</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviews && reviews.length > 0 ? (
                <div>
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} sessionId={sessionId} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-2xl">
                  <Star className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-500 font-medium mb-1">No reviews yet</p>
                  <p className="text-stone-400 text-sm mb-4">Be the first to share your experience with this piece.</p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Write the First Review
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8">
        <SkimlinksHorizontalBanner seed={5} />
      </div>

      <Footer />
    </div>
  );
}
