/**
 * GA4 Event Tracking Service
 * Comprehensive tracking for products, affiliate links, conversions, and checkout funnel
 */

interface GA4Event {
  event: string;
  [key: string]: any;
}

/**
 * Send custom event to GA4
 */
export function trackGA4Event(eventName: string, eventData?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, eventData || {});
    console.log(`[GA4] Event tracked: ${eventName}`, eventData);
  }
}

/**
 * Track product view (view_item)
 */
export function trackProductView(product: {
  id: number;
  title: string;
  price: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
}) {
  trackGA4Event("view_item", {
    currency: "USD",
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.title,
        item_category: product.category || "jewelry",
        item_brand: product.brand || "LYVARA",
        price: product.price,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track product selection (select_item)
 */
export function trackProductSelect(product: {
  id: number;
  title: string;
  price: number;
  category?: string;
}) {
  trackGA4Event("select_item", {
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.title,
        item_category: product.category || "jewelry",
        price: product.price,
      },
    ],
  });
}

/**
 * Track product impression (view_item_list)
 */
export function trackProductImpression(products: Array<{
  id: number;
  title: string;
  price: number;
  category?: string;
  position: number;
}>) {
  trackGA4Event("view_item_list", {
    items: products.map((p) => ({
      item_id: p.id.toString(),
      item_name: p.title,
      item_category: p.category || "jewelry",
      price: p.price,
      index: p.position,
    })),
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
  id: number;
  title: string;
  price: number;
  quantity: number;
  category?: string;
}) {
  trackGA4Event("add_to_cart", {
    currency: "USD",
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.title,
        item_category: product.category || "jewelry",
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
}

/**
 * Track affiliate link click
 */
export function trackAffiliateClick(link: {
  productId: number;
  productTitle: string;
  affiliateProgram: "amazon" | "skimlinks" | "other";
  url: string;
}) {
  trackGA4Event("affiliate_click", {
    product_id: link.productId,
    product_title: link.productTitle,
    affiliate_program: link.affiliateProgram,
    affiliate_url: link.url,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(email?: string) {
  trackGA4Event("newsletter_signup", {
    email_provided: !!email,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track blog post view
 */
export function trackBlogView(post: {
  id: number;
  title: string;
  category?: string;
  author?: string;
}) {
  trackGA4Event("view_blog_post", {
    post_id: post.id.toString(),
    post_title: post.title,
    post_category: post.category || "jewelry",
    post_author: post.author || "LYVARA",
  });
}

/**
 * Track blog post engagement (scroll depth, time on page)
 */
export function trackBlogEngagement(post: {
  id: number;
  title: string;
  scrollDepth: number; // 0-100
  timeOnPage: number; // seconds
}) {
  trackGA4Event("blog_engagement", {
    post_id: post.id.toString(),
    post_title: post.title,
    scroll_depth: post.scrollDepth,
    time_on_page: post.timeOnPage,
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(items: Array<{
  id: number;
  title: string;
  price: number;
  quantity: number;
}>) {
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  trackGA4Event("begin_checkout", {
    currency: "USD",
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(items: Array<{
  id: number;
  title: string;
  price: number;
  quantity: number;
}>) {
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  trackGA4Event("add_payment_info", {
    currency: "USD",
    value: totalValue,
    payment_type: "credit_card",
    items: items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track purchase (conversion)
 */
export function trackPurchase(transaction: {
  transactionId: string;
  items: Array<{
    id: number;
    title: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  totalValue: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
}) {
  trackGA4Event("purchase", {
    currency: "USD",
    transaction_id: transaction.transactionId,
    value: transaction.totalValue,
    tax: transaction.tax || 0,
    shipping: transaction.shipping || 0,
    coupon: transaction.coupon || "",
    items: transaction.items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.title,
      item_category: item.category || "jewelry",
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount: number) {
  trackGA4Event("search", {
    search_term: query,
    results_count: resultsCount,
  });
}

/**
 * Track filter/category selection
 */
export function trackCategoryFilter(category: string, productsShown: number) {
  trackGA4Event("view_item_list", {
    item_list_name: category,
    items_count: productsShown,
  });
}

/**
 * Track page scroll depth
 */
export function trackScrollDepth(depth: number) {
  trackGA4Event("scroll", {
    scroll_depth: depth,
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(pageName: string, timeInSeconds: number) {
  trackGA4Event("page_engagement", {
    page_name: pageName,
    engagement_time_msec: timeInSeconds * 1000,
  });
}

/**
 * Track form submission
 */
export function trackFormSubmission(formName: string, formId?: string) {
  trackGA4Event("form_submit", {
    form_name: formName,
    form_id: formId || "",
  });
}

/**
 * Track error/exception
 */
export function trackException(description: string, fatal: boolean = false) {
  trackGA4Event("exception", {
    description,
    fatal,
  });
}
