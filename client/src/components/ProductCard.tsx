import { Star, ExternalLink, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Product } from "../../../drizzle/schema";

interface ProductCardProps {
  product: Product;
  size?: "small" | "medium" | "large" | "hero";
  showBadge?: boolean;
}

export default function ProductCard({ product, size, showBadge = true }: ProductCardProps) {
  const effectiveSize = size || product.imageSize || "medium";
  const trackClick = trpc.analytics.trackEvent.useMutation();

  const handleAffiliateClick = () => {
    trackClick.mutate({
      productId: product.id,
      eventType: "affiliate_click",
      page: window.location.pathname,
    });
    window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = () => {
    trackClick.mutate({
      productId: product.id,
      eventType: "product_click",
      page: window.location.pathname,
    });
  };

  const imageHeight =
    effectiveSize === "hero"
      ? "h-96 md:h-[480px]"
      : effectiveSize === "large"
      ? "h-72 md:h-80"
      : effectiveSize === "small"
      ? "h-48"
      : "h-60 md:h-64";

  const titleSize =
    effectiveSize === "hero" || effectiveSize === "large"
      ? "text-base md:text-lg"
      : "text-sm";

  return (
    <div
      className="product-card bg-white rounded overflow-hidden cursor-pointer group"
      style={{ boxShadow: "var(--shadow-card)" }}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden bg-secondary ${imageHeight}`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-luxury">
            <span className="font-serif text-4xl" style={{ color: "var(--gold-light)" }}>✦</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

        {/* Badges */}
        {showBadge && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.isFeatured && (
              <span className="badge-gold flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                Best Seller
              </span>
            )}
            {product.isHero && (
              <span className="badge-new">Editor's Pick</span>
            )}
            {product.priceDropPercent && product.priceDropPercent > 5 && (
              <span
                className="font-sans text-xs font-medium px-2 py-0.5 rounded-sm"
                style={{ background: "var(--rose-gold)", color: "white", fontSize: "0.6rem", letterSpacing: "0.08em" }}
              >
                -{Math.round(product.priceDropPercent)}% OFF
              </span>
            )}
          </div>
        )}

        {/* Metal type badge */}
        <div className="absolute top-3 right-3">
          <span
            className="font-sans text-xs px-2 py-0.5 rounded-sm backdrop-blur-sm"
            style={{
              background: "rgba(255,255,255,0.85)",
              color: product.metalType === "gold" || product.metalType === "rose_gold" || product.metalType === "white_gold"
                ? "var(--gold-dark)"
                : "var(--silver)",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {product.metalType.replace("_", " ")}
          </span>
        </div>

        {/* Quick shop button */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAffiliateClick();
            }}
            className="btn-luxury-filled text-xs px-5 py-2 flex items-center gap-2"
          >
            View on Amazon
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {product.brand && (
          <p className="font-sans text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>
            {product.brand}
          </p>
        )}
        <h3
          className={`font-serif font-light leading-snug mb-2 line-clamp-2 ${titleSize}`}
          style={{ color: "var(--foreground)" }}
        >
          {product.title}
        </h3>

        {/* Rating */}
        {product.amazonRating && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3"
                style={{
                  color: i < Math.round(product.amazonRating!) ? "var(--gold)" : "var(--border)",
                  fill: i < Math.round(product.amazonRating!) ? "var(--gold)" : "transparent",
                }}
              />
            ))}
            {product.reviewCount && product.reviewCount > 0 && (
              <span className="font-sans text-xs ml-1" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                ({product.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            {product.price && (
              <span className="font-serif text-base font-medium" style={{ color: "var(--foreground)" }}>
                ${Number(product.price).toFixed(2)}
              </span>
            )}
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="font-sans text-xs ml-2 line-through" style={{ color: "var(--muted-foreground)" }}>
                ${Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAffiliateClick();
            }}
            className="btn-luxury text-xs px-3 py-1.5"
            style={{ fontSize: "0.6rem" }}
          >
            Shop
          </button>
        </div>
      </div>
    </div>
  );
}
