const apiKey = "7F4D9C23710F4304A980CD94CAD644E2";
const asin = "B08KQMVXVL"; // PANDORA ring

const url = new URL("https://api.rainforestapi.com/request");
url.searchParams.set("api_key", apiKey);
url.searchParams.set("type", "product");
url.searchParams.set("amazon_domain", "amazon.com");
url.searchParams.set("asin", asin);

console.log("Fetching from Rainforest API...");
console.log("URL:", url.toString());

const response = await fetch(url.toString());
const data = await response.json();

console.log("\nResponse:");
console.log(JSON.stringify(data, null, 2));

if (data.product && data.product.image) {
  console.log("\nImage URL:", data.product.image);
}
