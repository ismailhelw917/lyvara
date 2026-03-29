import fetch from 'node-fetch';

const apiKey = "7F4D9C23710F4304A980CD94CAD644E2";
const asins = [
  "B08KQMVXVL", // PANDORA
  "B08L7QXQZJ", // SWAROVSKI
  "B07YKZQ8ZV", // FOSSIL
  "B08QKXQVQZ", // MICHAEL KORS
  "B07Z5QXQXZ", // GUESS
  "B08RKXQZQZ", // TOMMY HILFIGER
  "B07YQXQZQZ", // SKAGEN
  "B08LKXQZQZ", // EMPORIO ARMANI
  "B07XQXQZQZ", // CALVIN KLEIN
  "B08MKXQZQZ", // CITIZEN
];

async function fetchImageFromRainforest(asin) {
  try {
    const url = new URL("https://api.rainforestapi.com/request");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("type", "product");
    url.searchParams.set("amazon_domain", "amazon.com");
    url.searchParams.set("asin", asin);

    console.log(`Fetching ${asin}...`);
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.product && data.product.image) {
      console.log(`✓ ${asin}: ${data.product.image}`);
      return data.product.image;
    } else {
      console.log(`✗ ${asin}: No image found`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${asin}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("Fetching images from Rainforest API...\n");
  
  for (const asin of asins) {
    await fetchImageFromRainforest(asin);
    // Wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main();
