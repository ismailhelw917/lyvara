import { useEffect, useRef } from "react";
import * as GA4 from "../lib/ga4Events";

/**
 * Hook for tracking scroll depth
 */
export function useScrollDepthTracking() {
  useEffect(() => {
    let maxScroll = 0;

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
        
        // Track at 25%, 50%, 75%, 100%
        if (maxScroll >= 25 && maxScroll < 50) {
          GA4.trackScrollDepth(25);
        } else if (maxScroll >= 50 && maxScroll < 75) {
          GA4.trackScrollDepth(50);
        } else if (maxScroll >= 75 && maxScroll < 100) {
          GA4.trackScrollDepth(75);
        } else if (maxScroll >= 100) {
          GA4.trackScrollDepth(100);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}

/**
 * Hook for tracking time on page
 */
export function useTimeOnPageTracking(pageName: string) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    return () => {
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000;
      if (timeOnPage > 1) {
        // Only track if user spent more than 1 second
        GA4.trackTimeOnPage(pageName, timeOnPage);
      }
    };
  }, [pageName]);
}

/**
 * Hook for tracking product views
 */
export function useProductViewTracking(product: {
  id: number;
  title: string;
  price: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
}) {
  useEffect(() => {
    GA4.trackProductView(product);
  }, [product.id]);
}

/**
 * Hook for tracking blog engagement
 */
export function useBlogEngagementTracking(post: {
  id: number;
  title: string;
  category?: string;
}) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  useEffect(() => {
    GA4.trackBlogView(post);

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > maxScrollRef.current) {
        maxScrollRef.current = scrollPercentage;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000;
      
      if (timeOnPage > 1) {
        GA4.trackBlogEngagement({
          id: post.id,
          title: post.title,
          scrollDepth: Math.round(maxScrollRef.current),
          timeOnPage: Math.round(timeOnPage),
        });
      }
    };
  }, [post.id]);
}

/**
 * Hook for tracking affiliate link clicks
 */
export function useAffiliateClickTracking() {
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[data-affiliate]") as HTMLAnchorElement | null;

      if (link) {
        const productId = link.dataset.productId;
        const productTitle = link.dataset.productTitle;
        const affiliateProgram = link.dataset.affiliateProgram as "amazon" | "skimlinks" | "other";
        const url = link.href;

        if (productId && productTitle && affiliateProgram) {
          GA4.trackAffiliateClick({
            productId: parseInt(productId),
            productTitle,
            affiliateProgram,
            url,
          });
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);
}

/**
 * Hook for tracking newsletter signups
 */
export function useNewsletterSignupTracking() {
  return (email?: string) => {
    GA4.trackNewsletterSignup(email);
  };
}
