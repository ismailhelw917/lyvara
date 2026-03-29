import axios from 'axios';

const apiKey = "7F4D9C23710F4304A980CD94CAD644E2";

// Popular jewelry search terms that should return results
const searchTerms = [
  "PANDORA bracelet",
  "Swarovski necklace",
  "Fossil watch",
  "Michael Kors jewelry",
  "Tiffany bracelet"
];

async function searchAndFetch(searchTerm) {
  const params = {
    api_key: apiKey,
    amazon_domain: "amazon.com",
    search_term: searchTerm,
    type: "search",
    max_results: 5
  };

  try {
    console.log(`\n🔍 Searching: "${searchTerm}"`);
    const response = await axios.get('https://api.rainforestapi.com/request', { params });
    
    if (response.data.products && response.data.products.length > 0) {
      console.log(`✓ Found ${response.data.products.length} products\n`);
      
      response.data.products.forEach((p, i) => {
        console.log(`${i+1}. ASIN: ${p.asin}`);
        console.log(`   Title: ${p.title?.substring(0, 60)}...`);
        console.log(`   Price: ${p.price}`);
        console.log(`   Rating: ${p.rating}`);
        console.log();
      });
      
      return response.data.products.map(p => p.asin);
    } else {
      console.log("No products found");
      return [];
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

async function fetchProductDetails(asin) {
  const params = {
    api_key: apiKey,
    amazon_domain: "amazon.com",
    asin: asin,
    type: "product"
  };

  try {
    const response = await axios.get('https://api.rainforestapi.com/request', { params });
    
    if (response.data.product) {
      const p = response.data.product;
      return {
        asin: p.asin,
        title: p.title,
        brand: p.brand,
        price: p.price?.value,
        rating: p.rating,
        reviews: p.ratings_total,
        image: p.main_image?.link || p.images?.[0]?.link,
        link: p.link
      };
    }
  } catch (error) {
    console.error(`Error fetching ${asin}: ${error.message}`);
  }
  return null;
}

async function main() {
  console.log("🎁 RAINFOREST API - POPULAR JEWELRY SEARCH\n");
  console.log("=========================================\n");
  
  let allAsins = [];
  
  for (const term of searchTerms) {
    const asins = await searchAndFetch(term);
    allAsins = allAsins.concat(asins);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const uniqueAsins = [...new Set(allAsins)];
  console.log(`\n📊 Found ${uniqueAsins.length} unique products\n`);
  
  if (uniqueAsins.length === 0) {
    console.log("❌ No products found");
    return;
  }
  
  console.log("📥 Fetching detailed information for top 10 products...\n");
  
  const detailedProducts = [];
  for (let i = 0; i < Math.min(10, uniqueAsins.length); i++) {
    const asin = uniqueAsins[i];
    console.log(`[${i+1}/10] Fetching ${asin}...`);
    
    const details = await fetchProductDetails(asin);
    if (details) {
      detailedProducts.push(details);
      console.log(`✓ ${details.title?.substring(0, 50)}...`);
      console.log(`  Brand: ${details.brand}, Price: $${details.price}, Rating: ${details.rating}⭐\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (detailedProducts.length > 0) {
    console.log("\n" + "=".repeat(100));
    console.log("📋 SQL INSERT STATEMENT:");
    console.log("=".repeat(100) + "\n");
    
    console.log("DELETE FROM products;\n");
    console.log("INSERT INTO products (asin, title, imageUrl, price, originalPrice, amazonRating, reviewCount, brand, affiliateUrl, metalType, category, isFeatured, isHero, isActive) VALUES");
    
    const sqlValues = detailedProducts.map((p, idx) => {
      const price = parseFloat(p.price) || 99.99;
      const originalPrice = (price * 1.3).toFixed(2);
      const metalType = p.title?.toLowerCase().includes('gold') ? 'gold' : 
                       p.title?.toLowerCase().includes('silver') ? 'silver' :
                       p.title?.toLowerCase().includes('rose') ? 'rose_gold' : 'white_gold';
      const category = p.title?.toLowerCase().includes('ring') ? 'rings' :
                      p.title?.toLowerCase().includes('necklace') ? 'necklaces' :
                      p.title?.toLowerCase().includes('bracelet') ? 'bracelets' :
                      p.title?.toLowerCase().includes('earring') ? 'earrings' : 'pendants';
      
      const image = p.image || 'https://m.media-amazon.com/images/I/71gHvnHvPGL._AC_SY879_.jpg';
      const isFeatured = idx < 5 ? 1 : 0;
      const isHero = idx < 3 ? 1 : 0;
      
      return `('${p.asin}', '${p.title?.replace(/'/g, "''")}', '${image}', '${price}', '${originalPrice}', ${p.rating || 4.5}, ${p.reviews || 1000}, '${p.brand || 'Unknown'}', '${p.link}', '${metalType}', '${category}', ${isFeatured}, ${isHero}, 1)`;
    });
    
    console.log(sqlValues.join(",\n") + ";");
  }
}

main();
