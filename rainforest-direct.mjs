import axios from 'axios';

const apiKey = "7F4D9C23710F4304A980CD94CAD644E2";

// Try searching with simpler terms
const searchTerms = [
  "jewelry",
  "necklace",
  "bracelet",
  "ring",
  "earrings"
];

async function searchJewelry(searchTerm) {
  const params = {
    api_key: apiKey,
    amazon_domain: "amazon.com",
    search_term: searchTerm,
    type: "search",
    max_results: 10
  };

  try {
    console.log(`\n🔍 Searching: "${searchTerm}"`);
    const response = await axios.get('https://api.rainforestapi.com/request', { params });
    
    console.log(`Status: ${response.data.request_info?.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`Credits remaining: ${response.data.request_info?.credits_remaining}`);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log(`Found ${response.data.products.length} products:`);
      response.data.products.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.asin} - ${p.title?.substring(0, 50)}...`);
      });
      return response.data.products;
    } else {
      console.log("No products in response");
      return [];
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log("🎁 RAINFOREST API - SIMPLE JEWELRY SEARCH\n");
  
  for (const term of searchTerms) {
    await searchJewelry(term);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

main();
