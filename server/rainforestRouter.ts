import { router, publicProcedure } from "./_core/trpc";
import { fetchAndPopulateProducts } from "./rainforestProductFetcher";

export const rainforestRouter = router({
  triggerProductFetch: publicProcedure.mutation(async () => {
    try {
      const result = await fetchAndPopulateProducts();
      return {
        success: result.success,
        count: result.count,
        message: result.success
          ? `Successfully fetched and inserted ${result.count} products`
          : `Error: ${result.error}`,
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }),
});
