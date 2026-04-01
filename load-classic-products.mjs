import fs from 'fs';
import { execSync } from 'child_process';

const jsonFile = '/home/ubuntu/classic_products.json';
const associateId = '91791709-20';

// Read JSON
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
const products = data.category_results || [];

console.log(`📦 Loading ${products.length} classic products...`);

let inserted = 0;
let skipped = 0;
const seenASINs = new Set();

for (const product of products) {
  if (!product.asin || !product.title) {
    skipped++;
    continue;
  }

  if (seenASINs.has(product.asin)) {
    skipped++;
    continue;
  }
  seenASINs.add(product.asin);

  const price = parseFloat(product.price?.value || 0);
  if (price <= 0) {
    skipped++;
    continue;
  }

  const imageUrl = product.image || '';
  if (!imageUrl) {
    skipped++;
    continue;
  }

  const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
  const category = product.category || 'jewelry';
  const metalType = product.title.toLowerCase().includes('gold') ? 'gold' : 
                   product.title.toLowerCase().includes('silver') ? 'silver' : 'other';

  // Insert into database using environment variables
  const sql = `INSERT INTO products (asin, title, description, price, imageUrl, affiliateUrl, category, metalType, tab, isActive, isFeatured) 
              VALUES ('${product.asin}', '${product.title.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'")}', ${price}, '${imageUrl}', '${affiliateUrl}', '${category}', '${metalType}', 'classic', 1, 0)
              ON DUPLICATE KEY UPDATE isActive=1, tab='classic'`;

  try {
    execSync(`mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "${sql.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    inserted++;
  } catch (e) {
    skipped++;
  }
}

console.log(`✅ Inserted: ${inserted}`);
console.log(`⏭️  Skipped: ${skipped}`);
