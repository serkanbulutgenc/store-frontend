import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PlacedOrder } from "../queries";
import { OrderTotals } from "./order-totals";

const order: Pick<
  PlacedOrder,
  | "items_total"
  | "campaigns"
  | "discount"
  | "voucher_code"
  | "shipping_fee"
  | "cod_fee"
  | "total"
  | "payment_method"
> = {
  items_total: "200.00",
  campaigns: [],
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

  it("shows a Basket Campaign's discount before the Voucher and the shipping", () => {
    const out = html({
      campaigns: [{ label: "200 ₺ üzeri 20 ₺ indirim", discount: "20.00", free_shipping: false }],
      discount: "18.00",
      voucher_code: "YAZ10",
      total: "192.00",
    });
    expect(out).toContain("200 ₺ üzeri 20 ₺ indirim");
    expect(out).toContain("−₺20,00");
    expect(out.indexOf("Ürünler")).toBeLessThan(out.indexOf("200 ₺ üzeri 20 ₺ indirim"));
    expect(out.indexOf("200 ₺ üzeri 20 ₺ indirim")).toBeLessThan(out.indexOf("Kupon (YAZ10)"));
    expect(out.indexOf("Kupon (YAZ10)")).toBeLessThan(out.indexOf("Kargo"));
  });

  it("says shipping is free, and why, for a free-shipping Basket Campaign", () => {
    const out = html({
      campaigns: [{ label: "200 ₺ üzeri ücretsiz kargo", discount: "0.00", free_shipping: true }],
      shipping_fee: "0.00",
      total: "200.00",
    });
    expect(out).toContain("Ücretsiz");
    expect(out).toContain("200 ₺ üzeri ücretsiz kargo");
    expect(out).not.toContain("−");
  });

  it("lists a discount and free shipping together, the discount first", () => {
    const out = html({
      campaigns: [
        { label: "100 ₺ üzeri 50 ₺ indirim", discount: "50.00", free_shipping: false },
        { label: "100 ₺ üzeri ücretsiz kargo", discount: "0.00", free_shipping: true },
      ],
      shipping_fee: "0.00",
      total: "150.00",
    });
    expect(out).toContain("100 ₺ üzeri 50 ₺ indirim");
    expect(out).toContain("−₺50,00");
    expect(out).toContain("100 ₺ üzeri ücretsiz kargo");
    expect(out).toContain("Ücretsiz");
    expect(out.indexOf("100 ₺ üzeri 50 ₺ indirim")).toBeLessThan(out.indexOf("Kargo"));
  });
});
