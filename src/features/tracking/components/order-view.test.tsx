import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TrackedOrder } from "../queries";
import { OrderView } from "./tracking-page";

const order: TrackedOrder = {
  number: "AT-000123",
  placed_at: "2026-11-16T10:00:00+03:00",
  status: "new",
  payment_status: "unpaid",
  payment_method: "cod",
  lines: [
    {
      id: 1,
      sku: "SKU-1",
      title: "Elbise",
      colour: "Siyah",
      size: "M",
      quantity: 2,
      unit_price: "100.00",
      line_total: "200.00",
      returnable_quantity: 0,
    },
  ],
  items_total: "200.00",
  campaigns: [],
  discount: "0.00",
  voucher_code: null,
  shipping_fee: "30.00",
  cod_fee: "15.00",
  total: "245.00",
  carrier: null,
  tracking_number: null,
  can_cancel: true,
  return_deadline: null,
  returns: [],
};
const html = (over: Partial<TrackedOrder> = {}) =>
  renderToString(<OrderView order={{ ...order, ...over }} />);

describe("OrderView (the tracking page and the Customer's own order)", () => {
  it("shows the Voucher between the items and the shipping, so the figures add up", () => {
    const out = html({ discount: "20.00", voucher_code: "YAZ10", total: "225.00" });
    expect(out).toContain("Kupon (YAZ10)");
    expect(out).toContain("−₺20,00");
    expect(out.indexOf("Ürünler")).toBeLessThan(out.indexOf("Kupon (YAZ10)"));
    expect(out.indexOf("Kupon (YAZ10)")).toBeLessThan(out.indexOf("Kargo"));
    expect(out).toContain("₺225,00");
  });

  it("shows no Voucher row for an order that used none", () => {
    const out = html();
    expect(out).not.toContain("Kupon");
    expect(out).not.toContain("−");
    expect(out).toContain("₺245,00");
  });
});
