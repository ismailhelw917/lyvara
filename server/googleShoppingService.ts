import { getProducts } from "./db";

interface GoogleShoppingProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string | null;
  availability: string;
  price: string;
  currency: string;
  brand: string;
  product_type: string;
  condition: string;
  item_group_id?: string;
  rating?: string;
  rating_count?: string;
  mpn?: string;
}

export async function generateGoogleShoppingFeed(): Promise<GoogleShoppingProduct[]> {
  // Fetch all active products
  const products = await getProducts({
    limit: 10000,
    offset: 0,
  });

  return products.map((product) => ({
    id: product.asin,
    title: product.title,
    description: product.description || product.title,
    link: product.affiliateUrl,
    image_link: product.imageUrl || null,
    availability: "in stock",
    price: `${product.price} USD`,
    currency: "USD",
    brand: product.brand || "Unknown",
    product_type: product.category || "Jewelry",
    condition: "new",
    item_group_id: product.category || undefined,
    rating: product.amazonRating ? product.amazonRating.toString() : undefined,
    rating_count: product.reviewCount ? product.reviewCount.toString() : undefined,
  }));
}

export async function generateGoogleShoppingXML(): Promise<string> {
  const products = await generateGoogleShoppingFeed();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>LYVARA JEWELS - Luxury Jewelry</title>
    <link>https://www.lyvarajewels.shop</link>
    <description>Luxury Gold & Silver Jewelry for Women</description>
    ${products
      .map(
        (product) => `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(product.title)}</title>
      <description>${escapeXml(product.description)}</description>
      <link>${escapeXml(product.link)}</link>
      ${product.image_link ? `<g:image_link>${escapeXml(product.image_link)}</g:image_link>` : ""}
      <g:availability>${escapeXml(product.availability)}</g:availability>
      <g:price>${escapeXml(product.price)}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
      <g:product_type>${escapeXml(product.product_type)}</g:product_type>
      <g:condition>${escapeXml(product.condition)}</g:condition>
      ${product.item_group_id ? `<g:item_group_id>${escapeXml(product.item_group_id)}</g:item_group_id>` : ""}
      ${product.rating ? `<g:rating>${escapeXml(product.rating)}</g:rating>` : ""}
      ${product.rating_count ? `<g:rating_count>${escapeXml(product.rating_count)}</g:rating_count>` : ""}
    </item>
    `
      )
      .join("")}
  </channel>
</rss>`;

  return xml;
}

export async function generateGoogleShoppingJSON(): Promise<string> {
  const products = await generateGoogleShoppingFeed();
  return JSON.stringify(
    {
      title: "LYVARA JEWELS - Luxury Jewelry",
      link: "https://www.lyvarajewels.shop",
      description: "Luxury Gold & Silver Jewelry for Women",
      items: products,
    },
    null,
    2
  );
}

function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
