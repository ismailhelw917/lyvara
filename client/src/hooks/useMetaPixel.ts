/**
 * useMetaPixel — Client-side Meta (Facebook/Instagram) Pixel event tracking.
 *
 * Fires standard Pixel events (ViewContent, Search, AddToCart, Purchase)
 * that power Dynamic Product Ads and retargeting audiences.
 *
 * Gracefully no-ops when the Pixel is not initialized (no credentials).
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __META_PIXEL_ID__?: string;
  }
}

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export function useMetaPixel() {
  /**
   * Track a product page view (ViewContent).
   * Fire this when a user views a product detail page.
   */
  const trackViewContent = (product: {
    id: number | string;
    title: string;
    price: number;
    category?: string;
    brand?: string;
  }) => {
    fbq("track", "ViewContent", {
      content_ids: [String(product.id)],
      content_name: product.title,
      content_type: "product",
      content_category: product.category || "jewelry",
      value: product.price,
      currency: "USD",
    });
  };

  /**
   * Track a search event (Search).
   * Fire this when a user searches or filters products.
   */
  const trackSearch = (searchString: string) => {
    fbq("track", "Search", {
      search_string: searchString,
      content_type: "product",
    });
  };

  /**
   * Track an affiliate link click as AddToCart proxy.
   * Since we redirect to Amazon, we use AddToCart as a purchase intent signal.
   */
  const trackAddToCart = (product: {
    id: number | string;
    title: string;
    price: number;
    category?: string;
  }) => {
    fbq("track", "AddToCart", {
      content_ids: [String(product.id)],
      content_name: product.title,
      content_type: "product",
      content_category: product.category || "jewelry",
      value: product.price,
      currency: "USD",
    });
  };

  /**
   * Track a Lead event (newsletter signup).
   */
  const trackLead = () => {
    fbq("track", "Lead", {
      content_name: "Newsletter Signup",
      content_category: "email_capture",
    });
  };

  /**
   * Track a custom event (e.g., blog read, filter use).
   */
  const trackCustom = (eventName: string, params?: Record<string, any>) => {
    fbq("trackCustom", eventName, params);
  };

  return {
    trackViewContent,
    trackSearch,
    trackAddToCart,
    trackLead,
    trackCustom,
  };
}
