import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  jsonLd?: object;
}

const SITE_NAME = "LYVARA JEWELS";
const BASE_URL = "https://lyvara-jewels.manus.space";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200&h=630&fit=crop&q=80";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeJsonLd() {
  const existing = document.querySelector('script[data-page-jsonld="true"]');
  if (existing) existing.remove();
}

function injectJsonLd(data: object) {
  removeJsonLd();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-page-jsonld", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  noIndex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Exquisite Gold Jewelry for Women`;
    const fullDescription = description || "Discover exquisite gold jewelry curated daily for the discerning woman.";
    const fullImage = image || DEFAULT_IMAGE;
    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    // Primary
    document.title = fullTitle;
    setMeta("description", fullDescription);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", fullDescription, true);
    setMeta("og:image", fullImage, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);

    // Twitter
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDescription);
    setMeta("twitter:image", fullImage);
    setMeta("twitter:card", "summary_large_image");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // JSON-LD
    if (jsonLd) {
      injectJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }

    return () => {
      // Reset to defaults on unmount
      document.title = `${SITE_NAME} — Exquisite Gold Jewelry for Women`;
      removeJsonLd();
    };
  }, [title, description, keywords, image, url, type, noIndex, jsonLd]);
}
