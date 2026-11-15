import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PlacedOrder } from "../queries";
import { OrderTotals } from "./order-totals";

const order: Pick<
  PlacedOrder,
  | "items_total"
  | "discount"
  | "voucher_code"
  | "shipping_fee"
  | "cod_fee"
  | "total"
  | "payment_method"
> = {
  items_total: "200.00",
  discount: "0.00",
  voucher_code: null,
  shipping_fee: "30.00",
  cod_fee: "0.00",
  total: "230.00",
  payment_method: "bank_transfer",
};
const html = (over: Partial<typeof order> = {}) =>
  renderToString(<OrderTotals order={{ ...order, ...over }} />);

describe("OrderTotals", () => {
  it("shows the Voucher between the items and the shipping, so the figures add up", () => {
    const out = html({ discount: "20.00", voucher_code: "YAZ10", total: "210.00" });
    expect(out).toContain("Kupon (YAZ10)");
    expect(out).toContain("−₺20,00");
    expect(out.indexOf("Ürünler")).toBeLessThan(out.indexOf("Kupon (YAZ10)"));
    expect(out.indexOf("Kupon (YAZ10)")).toBeLessThan(out.indexOf("Kargo"));
    expect(out).toContain("₺210,00");
  });

  it("shows no Voucher row for an Order that used none", () => {
    const out = html();
    expect(out).not.toContain("Kupon");
    expect(out).not.toContain("−");
    expect(out).toContain("₺230,00");
  });
});
