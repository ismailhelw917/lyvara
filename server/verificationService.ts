import { products } from '../drizzle/schema';
import { getDb } from './db';

interface VerificationResult {
  productId: string | number;
  title: string;
  affiliateLinkStatus: string;
  imageLinkStatus: string;
  issues: string[];
}

export async function verifyAllProducts(): Promise<VerificationResult[]> {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return [];
  }

  const allProducts = await dbInstance.select().from(products);
  const results: VerificationResult[] = [];

  for (const product of allProducts) {
    const issues: string[] = [];
    let affiliateLinkStatus: string = 'error';
    let imageLinkStatus: string = 'error';

    // Verify affiliate link
    if (product.affiliateUrl) {
      try {
        const response = await fetch(product.affiliateUrl, { method: 'HEAD', redirect: 'follow' });
        affiliateLinkStatus = String(response.status);
        if (response.status !== 200) {
          issues.push(`Affiliate link returned ${response.status}`);
        }
      } catch (error) {
        issues.push(`Affiliate link error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      issues.push('No affiliate URL');
    }

    // Verify image link
    if (product.imageUrl) {
      try {
        const response = await fetch(product.imageUrl, { method: 'HEAD' });
        imageLinkStatus = String(response.status);
        if (response.status !== 200) {
          issues.push(`Image link returned ${response.status}`);
        }
      } catch (error) {
        issues.push(`Image link error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      issues.push('No image URL');
    }

    // Validate product data
    if (!product.title || product.title.length < 5) {
      issues.push('Invalid title');
    }
    if (!product.description || product.description.length < 10) {
      issues.push('Invalid description');
    }
    if (!product.price || parseFloat(String(product.price)) <= 0) {
      issues.push('Invalid price');
    }

    results.push({
      productId: String(product.id),
      title: product.title || 'Unknown',
      affiliateLinkStatus: String(affiliateLinkStatus),
      imageLinkStatus: String(imageLinkStatus),
      issues
    });
  }

  return results;
}

export async function getVerificationReport() {
  const results = await verifyAllProducts();
  const totalProducts = results.length;
  const productsWithIssues = results.filter(r => r.issues.length > 0).length;
  const healthScore = totalProducts > 0 ? ((totalProducts - productsWithIssues) / totalProducts * 100).toFixed(1) : '0';

  return {
    timestamp: new Date().toISOString(),
    totalProducts,
    productsWithIssues,
    healthScore: `${healthScore}%`,
    details: results
  };
}
