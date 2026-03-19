import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/**
 * useTracking — fires analytics + CounterAPI events via the tRPC trackEvent mutation.
 *
 * Usage:
 *   const { trackProductClick, trackAffiliateClick, trackPageView, trackBlogView, trackSearch, trackFilter } = useTracking();
 *
 * All calls are fire-and-forget (non-blocking). Errors are silently swallowed to
 * avoid disrupting the user experience.
 */
export function useTracking() {
  const trackEvent = trpc.analytics.trackEvent.useMutation();

  const fire = (
    eventType: "product_click" | "affiliate_click" | "page_view" | "blog_view" | "search" | "filter",
    opts?: { productId?: number; blogPostId?: number; page?: string; metadata?: Record<string, unknown> }
  ) => {
    trackEvent.mutate(
      { eventType, ...opts },
      {
        onError: () => {
          // Silently swallow tracking errors — never block UX
        },
      }
    );
  };

  return {
    trackProductClick: (productId: number, page?: string) =>
      fire("product_click", { productId, page }),
    trackAffiliateClick: (productId: number, _productName?: string) =>
      fire("affiliate_click", { productId, page: window.location.pathname }),
    trackPageView: (page: string) =>
      fire("page_view", { page }),
    trackBlogView: (blogPostId: number, page?: string) =>
      fire("blog_view", { blogPostId, page }),
    trackSearch: (query: string) =>
      fire("search", { metadata: { query } }),
    trackFilter: (filterType: string, value: string) =>
      fire("filter", { metadata: { filterType, value } }),
  };
}

/**
 * usePageView — fires a page_view event once when the component mounts.
 * Use this at the top of every page component.
 */
export function usePageView(page: string) {
  const { trackPageView } = useTracking();
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      trackPageView(page);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
}
