import type { ProductCard } from "../queries";
import { ProductRail } from "./product-rail";

/** The "Son baktıklarınız" rail. The page's own Product never shows in it. */
export function RecentlyViewedRail({
  products,
  currentSlug,
  onClear,
}: {
  products: ProductCard[];
  currentSlug?: string;
  onClear: () => void;
}) {
  return (
    <ProductRail
      title="Son baktıklarınız"
      products={products.filter((p) => p.slug !== currentSlug)}
      action={
        <button type="button" onClick={onClear} className="text-sm underline underline-offset-4">
          Temizle
        </button>
      }
    />
  );
}
