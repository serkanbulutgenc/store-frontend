import { describe, expect, it } from "vitest";
import type { ProductCard } from "../queries";
import { RecentlyViewedRail } from "./recently-viewed-rail";
import { renderInStorefront } from "./render-in-storefront";

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

const html = (products: ProductCard[], currentSlug?: string) =>
  renderInStorefront(
    <RecentlyViewedRail products={products} currentSlug={currentSlug} onClear={() => {}} />,
  );

describe("RecentlyViewedRail", () => {
  it("shows the 'Son baktıklarınız' rail in the given order, with a 'Temizle' button", () => {
    const out = html([card(3), card(1), card(2)]);

    expect(out).toContain("Son baktıklarınız");
    expect(out).toContain("Temizle");
    expect(out.match(/href="\/urun\/urun-\d"/g)).toEqual([
      'href="/urun/urun-3"',
      'href="/urun/urun-1"',
      'href="/urun/urun-2"',
    ]);
  });

  it("leaves out the Product the page is about", () => {
    const out = html([card(1), card(2)], "urun-1");

    expect(out).not.toContain('href="/urun/urun-1"');
    expect(out).toContain('href="/urun/urun-2"');
  });

  it("renders nothing when only the current Product is left", () => {
    expect(html([card(1)], "urun-1")).toBe("");
  });
});
