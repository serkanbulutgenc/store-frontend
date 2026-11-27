import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProductCard as Card } from "../queries";
import { Price, ProductCard } from "./product-card";
import { renderInStorefront } from "./render-in-storefront";

type Props = Parameters<typeof Price>[0];
const plain: Props = {
  price: "100.00",
  oldPrice: null,
  shelfPrice: null,
  campaignPercentage: null,
};
const html = (over: Partial<Props> = {}) => renderToString(<Price {...plain} {...over} />);
const STRUCK = /<s[ >]/; // the struck-through element, not <span>

describe("Price", () => {
  it("shows just the price when nothing is on sale", () => {
    const out = html();
    expect(out).toContain("₺100,00");
    expect(out).not.toMatch(STRUCK);
    expect(out).not.toContain("%");
  });

  it("keeps showing the Old price, without a badge, when there is no Campaign", () => {
    const out = html({ price: "80.00", oldPrice: "120.00" });
    expect(out).toContain("₺80,00");
    expect(out).toMatch(STRUCK);
    expect(out).toContain("₺120,00");
    expect(out).not.toContain("%");
  });

  it("shows the Campaign price, the Shelf price struck through and a -20% badge", () => {
    const out = html({ price: "80.00", shelfPrice: "100.00", campaignPercentage: "20.00" });
    expect(out).toContain("₺80,00");
    expect(out).toMatch(/<s[^>]*>.*₺100,00/);
    expect(out).toContain("-20%");
  });

  it("hides the Old price while a Campaign is active", () => {
    const out = html({
      price: "80.00",
      oldPrice: "250.00",
      shelfPrice: "100.00",
      campaignPercentage: "20.00",
    });
    expect(out).not.toContain("₺250,00");
    expect(out).toContain("₺100,00");
  });

  it("hides the Old price and shows the badge whenever a percentage is sent, even without a Shelf price", () => {
    const out = html({ price: "80.00", oldPrice: "250.00", campaignPercentage: "20.00" });
    expect(out).not.toContain("₺250,00");
    expect(out).not.toMatch(STRUCK);
    expect(out).toContain("-20%");
  });

  it("ignores the Shelf price when no Campaign runs: the Old price still shows, with no badge", () => {
    const out = html({ price: "100.00", oldPrice: "120.00", shelfPrice: "100.00" });
    expect(out).toContain("₺120,00");
    expect(out).not.toContain("%");
  });

  it("writes a fractional percentage without trailing zeros", () => {
    const out = html({ price: "87.50", shelfPrice: "100.00", campaignPercentage: "12.50" });
    expect(out).toContain("-12,5%");
  });
});

describe("ProductCard Colour dots", () => {
  const card = (colours: number, soldOut = false): Card => ({
    id: 1,
    slug: "elbise",
    title: "Keten Elbise",
    price: "100.00",
    old_price: null,
    shelf_price: null,
    campaign_percentage: null,
    rating_average: null,
    rating_count: 0,
    sold_out: soldOut,
    image: null,
    colours: Array.from({ length: colours }, (_, i) => ({
      id: i + 1,
      name: `Renk ${i + 1}`,
      hex_code: "#000000",
    })),
  });
  const render = (colours: number, soldOut?: boolean) =>
    renderInStorefront(<ProductCard product={card(colours, soldOut)} />);
  const dots = (out: string) => out.match(/title="Renk \d+"/g)?.length ?? 0;

  it("shows a dot per Colour, up to four, with no count badge", () => {
    for (const n of [2, 4]) {
      const out = render(n);
      expect(dots(out)).toBe(n);
      expect(out).not.toContain("renk daha");
    }
  });

  it("shows four dots and counts the rest in a badge", () => {
    const out = render(7);

    expect(dots(out)).toBe(4);
    expect(out).toContain("+3");
    expect(out).toContain("3 renk daha");
  });

  it("shows nothing when there is no choice of Colour", () => {
    expect(render(1)).not.toContain('aria-label="Renkler"');
  });

  it("shows nothing on a sold-out card", () => {
    expect(render(3, true)).not.toContain('aria-label="Renkler"');
  });
});
