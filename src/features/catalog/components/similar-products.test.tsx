import { describe, expect, it } from "vitest";
import type { ProductCard } from "../queries";
import { renderInStorefront } from "./render-in-storefront";
import { SimilarProducts } from "./similar-products";

const card = (n: number): ProductCard => ({
  id: n,
  slug: `urun-${n}`,
  title: `Ürün ${n}`,
  price: "100.00",
  old_price: null,
  shelf_price: null,
  campaign_percentage: null,
  rating_average: null,
  rating_count: 0,
  sold_out: false,
  colours: [],
  image: null,
});

const html = (products: ProductCard[]) =>
  renderInStorefront(<SimilarProducts products={products} />);

describe("SimilarProducts", () => {
  it("renders the 'Benzer ürünler' rail with a plain link to each product", () => {
    const out = html([card(1), card(2)]);

    expect(out).toContain("Benzer ürünler");
    expect(out).toContain('href="/urun/urun-1"');
    expect(out).toContain('href="/urun/urun-2"');
  });

  it("renders nothing, not even the heading, when there are no similar products", () => {
    expect(html([])).toBe("");
  });

  it("shows at most 8 products, in the order the API ranked them", () => {
    const out = html(Array.from({ length: 10 }, (_, i) => card(i + 1)));

    expect(out.match(/href="\/urun\/urun-\d+"/g)).toEqual(
      Array.from({ length: 8 }, (_, i) => `href="/urun/urun-${i + 1}"`),
    );
  });
});
