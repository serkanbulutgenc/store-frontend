import { describe, expect, it } from "vitest";
import type { ProductCard, ProductDetail } from "../../queries";
import { renderInStorefront } from "../render-in-storefront";
import { CardAddButton } from "./card-add-button";
import { VariantPickerContent } from "./variant-picker-dialog";

const card: ProductCard = {
  id: 1,
  slug: "elbise",
  title: "Keten Elbise",
  price: "100.00",
  old_price: null,
  shelf_price: null,
  campaign_percentage: null,
  rating_average: null,
  rating_count: 0,
  sold_out: false,
  colours: [],
  image: null,
};

const red = { id: 10, name: "Kırmızı", hex_code: "#cc0000" };
const blue = { id: 20, name: "Mavi", hex_code: "#0000cc" };
const variant = (id: number, colour: typeof red, size: string, available: number) => ({
  id,
  colour,
  size,
  available,
  in_stock: available > 0,
  remaining: null,
  price: "100.00",
  shelf_price: "100.00",
  sku: `SKU-${id}`,
});

const product: ProductDetail = {
  ...card,
  attributes: [],
  brand: { id: 1, name: "Markam", logo_url: null },
  breadcrumbs: [],
  colours: [red, blue],
  description: "Uzun açıklama metni",
  fit_note: "Dar kalıp, bir beden büyük alın.",
  has_size_guide: true,
  is_hygiene: false,
  photos: [],
  variants: [variant(1, red, "S", 5), variant(2, red, "M", 0), variant(3, blue, "S", 5)],
};

describe("CardAddButton", () => {
  it("is one labelled button", () => {
    const out = renderInStorefront(<CardAddButton product={card} />);

    expect(out.match(/<button/g)).toHaveLength(1);
    expect(out).toContain('aria-label="Keten Elbise sepete ekle"');
    expect(out).not.toContain("Hızlı bakış");
  });

  it("is absent from a sold-out card", () => {
    expect(renderInStorefront(<CardAddButton product={{ ...card, sold_out: true }} />)).toBe("");
  });
});

describe("VariantPickerContent", () => {
  const html = (over: Partial<ProductDetail> = {}) =>
    renderInStorefront(
      <VariantPickerContent product={{ ...product, ...over }} onClose={() => {}} />,
    );

  it("shows the title, price, Colour, Sizes, guide, Fit note, quantity and product link", () => {
    const out = html();

    for (const text of [
      "Keten Elbise",
      "₺100,00",
      "Renk: Kırmızı",
      "Beden tablosu",
      "Dar kalıp, bir beden büyük alın.",
      'aria-label="Adedi artır"',
      'href="/urun/elbise"',
      "Ürün detayları",
    ])
      expect(out).toContain(text);
  });

  it("asks for a Size and lets a sold-out one be selected", () => {
    const out = html();

    expect(out).toContain("Beden seçin");
    const soldOut = out.match(/<button[^>]*>M<span class="sr-only"> \(tükendi\)/)?.[0];
    expect(soldOut).toBeDefined();
    expect(soldOut).not.toContain("disabled");
  });

  it("leaves out the brand and the description", () => {
    const out = html();

    expect(out).not.toContain("Markam");
    expect(out).not.toContain("Uzun açıklama metni");
  });

  it("warns about returns for a hygiene Product only", () => {
    expect(html()).not.toContain("Hijyen nedeniyle");
    expect(html({ is_hygiene: true })).toContain("Hijyen nedeniyle");
  });
});
