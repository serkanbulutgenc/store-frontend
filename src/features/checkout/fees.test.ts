import { describe, expect, it } from "vitest";
import { type FeeSettings, feeSummary, previewFees } from "./fees";

const settings: FeeSettings = {
  shipping_fee: "49.90",
  cod_fee: "19.90",
};

describe("previewFees", () => {
  it("adds the flat shipping fee", () => {
    expect(previewFees("349.90", settings, "bank_transfer")).toEqual({
      shipping: "49.90",
      cod: "0.00",
      total: "399.80",
    });
  });
  it("charges the same shipping however much the basket holds", () => {
    expect(previewFees("9999.00", settings, "bank_transfer").shipping).toBe("49.90");
  });
  it("adds the COD fee only for cash on delivery", () => {
    expect(previewFees("100.10", settings, "cod").total).toBe("169.90");
    expect(previewFees("100.10", settings, "bank_transfer").total).toBe("150.00");
  });
  it("takes the Voucher off the items only, never off shipping", () => {
    // 349.90 - 20.00 + 49.90 shipping
    expect(previewFees("349.90", settings, "bank_transfer", "20.00").total).toBe("379.80");
  });
});

describe("previewFees with a Basket Campaign", () => {
  const off = { label: "200 ₺ üzeri 20 ₺ indirim", discount: "20.00", free_shipping: false };
  const free = { label: "200 ₺ üzeri ücretsiz kargo", discount: "0.00", free_shipping: true };

  it("takes the campaign off the items before the Voucher and adds the shipping", () => {
    // 200 - 20 - 18 + 49.90
    expect(previewFees("200.00", settings, "bank_transfer", "18.00", [off]).total).toBe("211.90");
  });
  it("takes the discount off and waives the shipping when both apply", () => {
    // 200 - 20, no shipping
    expect(previewFees("200.00", settings, "bank_transfer", "0.00", [off, free])).toEqual({
      shipping: "0.00",
      cod: "0.00",
      total: "180.00",
    });
  });
  it("waives the shipping fee but not the COD fee for free shipping", () => {
    const r = previewFees("200.00", settings, "cod", "0.00", [free]);
    expect(r.shipping).toBe("0.00");
    expect(r.cod).toBe("19.90");
    expect(r.total).toBe("219.90");
  });
});

describe("feeSummary", () => {
  const quote = {
    items_total: "349.90",
    campaigns: [],
    discount: "0.00",
    shipping_fee: "95.00",
    cod_fee: "0.00",
    total: "444.90",
  };

  it("shows the flat-fee preview until a quote arrives", () => {
    expect(feeSummary("349.90", settings, "bank_transfer", undefined)).toEqual({
      ...previewFees("349.90", settings, "bank_transfer"),
      campaigns: [],
      discount: "0.00",
      voucherCode: null,
      voucherProblem: null,
      calculated: false,
    });
  });
  it("keeps the basket's Voucher discount in the preview until a quote arrives", () => {
    expect(feeSummary("349.90", settings, "bank_transfer", undefined, "20.00")).toMatchObject({
      discount: "20.00",
      total: "379.80",
      calculated: false,
    });
  });
  it("shows the basket's Basket Campaign in the preview and the quote's once it arrives", () => {
    const off = { label: "x", discount: "20.00", free_shipping: false };
    expect(feeSummary("200.00", settings, "bank_transfer", undefined, "0.00", [off])).toMatchObject(
      {
        campaigns: [off],
        total: "229.90",
      },
    );
    const quoted = { ...quote, campaigns: [{ label: "y", discount: "0.00", free_shipping: true }] };
    expect(feeSummary("200.00", settings, "bank_transfer", quoted).campaigns).toEqual(
      quoted.campaigns,
    );
  });
  it("uses the computed quote once it has arrived", () => {
    expect(feeSummary("349.90", settings, "bank_transfer", quote)).toEqual({
      shipping: "95.00",
      cod: "0.00",
      total: "444.90",
      campaigns: [],
      discount: "0.00",
      voucherCode: null,
      voucherProblem: null,
      calculated: true,
    });
  });
  it("carries the Voucher the quote was priced with", () => {
    const priced = {
      ...quote,
      discount: "20.00",
      voucher_code: "YAZ10",
      total: "424.90", // 349.90 - 20.00 + 95.00
    };
    expect(feeSummary("349.90", settings, "bank_transfer", priced)).toMatchObject({
      discount: "20.00",
      voucherCode: "YAZ10",
      voucherProblem: null,
      total: "424.90",
    });
  });
  it("carries why a Voucher on the basket is not applied", () => {
    const refused = { ...quote, voucher_code: "YAZ10", voucher_problem: "expired" };
    expect(feeSummary("349.90", settings, "bank_transfer", refused)).toMatchObject({
      discount: "0.00",
      voucherCode: "YAZ10",
      voucherProblem: "expired",
    });
  });
});
