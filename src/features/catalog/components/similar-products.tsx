import type { ProductCard } from "../queries";
import { ProductRail } from "./product-rail";

const MAX_SIMILAR = 8;

/** The "Benzer ürünler" rail under the product tabs: the homepage rail, fed by the similar endpoint. */
export function SimilarProducts({ products }: { products: ProductCard[] }) {
  return <ProductRail title="Benzer ürünler" products={products.slice(0, MAX_SIMILAR)} />;
}
