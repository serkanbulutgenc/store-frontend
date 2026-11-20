import type { QueryClient } from "@tanstack/react-query";
import { type ProductCard, type ProductDetail, productQuery, similarQuery } from "./queries";

/** Everything the product route needs before it renders, so the server's HTML already holds it. */
export async function loadProductPage(
  queryClient: QueryClient,
  slug: string,
): Promise<{ product: ProductDetail; similar: ProductCard[] }> {
  const [product, similar] = await Promise.all([
    queryClient.query(productQuery(slug)),
    // The rail is optional: a failed request hides it and leaves the page intact.
    queryClient.query(similarQuery(slug)).catch((): ProductCard[] => []),
  ]);
  return { product, similar };
}
