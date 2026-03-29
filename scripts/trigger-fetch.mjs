import { fetchAndPopulateProducts } from '../server/rainforestProductFetcher.js';

async function main() {
  console.log('Starting Rainforest product fetch...');
  const result = await fetchAndPopulateProducts();
  console.log('Fetch result:', result);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
