import { Star, ExternalLink, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTracking } from "@/hooks/useTracking";
import type { Product } from "../../../drizzle/schema";

interface ProductCardProps {
  product: Product;
  size?: "small" | "medium" | "large" | "hero";
  showBadge?: boolean;
}

// Curated fallback jewelry images from Unsplash (all verified working)
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",  // gold necklace
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",  // silver bracelet
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",  // diamond ring
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",  // earrings
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",  // jewelry set
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",  // gold ring
  "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",  // pearl necklace
  "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",  // rose gold
  "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",  // silver ring
  "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&q=80",  // gold bracelet
];

export default function ProductCard({ product, size, showBadge = true }: ProductCardProps) {
  const effectiveSize = size || product.imageSize || "medium";
  const { trackProductClick, trackAffiliateClick } = useTracking();
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Pick a deterministic fallback based on product id
  const fallbackSrc = FALLBACK_IMAGES[product.id % FALLBACK_IMAGES.length];
  const imageSrc = (!product.imageUrl || imgError) ? fallbackSrc : product.imageUrl;

  // Detect silent failures: image complete but naturalWidth is 0
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const checkLoaded = () => {
      if (img.complete && img.naturalWidth === 0) {
        setImgError(true);
      }
    };
    if (img.complete) {
      checkLoaded();
    } else {
      img.addEventListener('load', checkLoaded);
      return () => img.removeEventListener('load', checkLoaded);
    }
  }, [imageSrc]);

  const handleAffiliateClick = () => {
    trackAffiliateClick(product.id, product.title);
    window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = () => {
    trackProductClick(product.id, product.title);
  };

  const imageHeight =
    effectiveSize === "hero"
      ? "h-96 md:h-[480px]"
      : effectiveSize === "large"
      ? "h-72 md:h-80"
      : effectiveSize === "small"
      ? "h-56"
      : "h-64 md:h-72";

  const titleSize =
    effectiveSize === "hero" || effectiveSize === "large"
      ? "text-base md:text-lg"
      : "text-sm";

  return (
    <Link
      href={`/product/${product.id}`}
      onClick={handleCardClick}
      className="product-card bg-white rounded overflow-hidden cursor-pointer group block"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Image Container — enforces consistent aspect ratio */}
      <div className={`relative overflow-hidden ${imageHeight} w-full`} style={{ background: "var(--champagne)" }}>
        <img
          ref={imgRef}
          src={imageSrc}
          alt={product.title}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {/* Subtle gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />

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
            {!!product.priceDropPercent && product.priceDropPercent > 5 && (
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
              background: "rgba(255,255,255,0.88)",
              color: product.metalType === "gold" || product.metalType === "rose_gold" || product.metalType === "white_gold"
                ? "var(--gold-dark)"
                : "var(--silver)",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {product.metalType.replace(/_/g, " ")}
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
    </Link>
  );
}
