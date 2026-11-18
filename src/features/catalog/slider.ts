import type { ProductCard } from "./queries";

/** The Collection that feeds the home slider. The Owner manages it in the Dashboard like any other
 * Collection: its Products, their order, and publishing. */
export const HOME_SLIDER_SLUG = "ana-sayfa";

/** What the slider shows: the Collection's Products when it has any, otherwise the newest. */
export function sliderProducts(
  featured: readonly ProductCard[] | null | undefined,
  latest: readonly ProductCard[],
): ProductCard[] {
  return featured && featured.length > 0 ? [...featured] : [...latest];
}
