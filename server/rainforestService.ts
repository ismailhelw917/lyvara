import { ENV } from "./_core/env";
const env = ENV;

interface RainforestProduct {
  asin: string;
  title: string;
  image: string;
  price: number;
  rating: number;
  review_count: number;
  brand?: string;
  description?: string;
}

interface RainforestResponse {
  products: Array<{
    asin: string;
    title: string;
    image: string;
    price: {
      value: number;
      currency: string;
    };
    rating: number;
    review_count: number;
    brand?: string;
    description?: string;
  }>;
}

export async function searchJewelryProducts(
  query: string = "luxury jewelry women",
  maxResults: number = 30
): Promise<RainforestProduct[]> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    throw new Error("RAINFOREST_API_KEY not configured");
  }

  try {
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("type", "search");
    url.searchParams.set("amazon_domain", "amazon.com");
    url.searchParams.set("search_term", query);
    url.searchParams.set("max_results", maxResults.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Rainforest API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as RainforestResponse;

    if (!data.products || !Array.isArray(data.products)) {
      console.warn("No products returned from Rainforest API");
      return [];
    }

    return data.products.map((p) => ({
      asin: p.asin,
      title: p.title,
      image: p.image,
      price: p.price?.value || 0,
      rating: p.rating || 0,
      review_count: p.review_count || 0,
      brand: p.brand,
      description: p.description,
    }));
  } catch (error) {
    console.error("Error fetching from Rainforest API:", error);
    throw error;
  }
}

export async function getProductDetails(
  asin: string
): Promise<RainforestProduct | null> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    throw new Error("RAINFOREST_API_KEY not configured");
  }

  try {
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("type", "product");
    url.searchParams.set("amazon_domain", "amazon.com");
    url.searchParams.set("asin", asin);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Rainforest API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      product: {
        asin: string;
        title: string;
        image: string;
        price: { value: number; currency: string };
        rating: number;
        review_count: number;
        brand?: string;
        description?: string;
      };
    };

    if (!data.product) {
      return null;
    }

    const p = data.product;
    return {
      asin: p.asin,
      title: p.title,
      image: p.image,
      price: p.price?.value || 0,
      rating: p.rating || 0,
      review_count: p.review_count || 0,
      brand: p.brand,
      description: p.description,
    };
  } catch (error) {
    console.error("Error fetching product details from Rainforest API:", error);
    return null;
  }
}
