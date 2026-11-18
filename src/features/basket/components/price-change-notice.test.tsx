import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PriceChangeNotice } from "./price-change-notice";

type Props = Parameters<typeof PriceChangeNotice>[0]["line"];
const line = (over: Partial<Props> = {}): Props => ({
  price_changed: false,
  previous_unit_price: null,
  unit_price: "80.00",
  ...over,
});
const html = (l: Props) => renderToString(<PriceChangeNotice line={l} />);

describe("PriceChangeNotice", () => {
  it("renders nothing for a line whose price is as the Shopper last saw it", () => {
    expect(html(line())).toBe("");
  });

  it("says the price dropped, with the old and the new price", () => {
    const out = html(line({ price_changed: true, previous_unit_price: "100.00" }));
    expect(out).toContain("Fiyatı düştü");
    expect(out).toContain("₺100,00");
    expect(out).toContain("₺80,00");
    expect(out).toContain('role="status"');
  });

  it("says the price rose when a Campaign ended", () => {
    const out = html(
      line({ price_changed: true, previous_unit_price: "80.00", unit_price: "100.00" }),
    );
    expect(out).toContain("Fiyatı arttı");
    expect(out).toContain("₺80,00");
    expect(out).toContain("₺100,00");
  });

  it("falls back to a plain notice when the previous price is unknown", () => {
    const out = html(line({ price_changed: true, previous_unit_price: null }));
    expect(out).toContain("Fiyatı değişti");
  });
});
