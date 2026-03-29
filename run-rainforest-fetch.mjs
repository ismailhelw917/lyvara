import { fetchAndPopulateProducts } from "./server/rainforestProductFetcher.ts";

console.log("Starting Rainforest product fetch...");
const result = await fetchAndPopulateProducts();
console.log("\nResult:", result);
