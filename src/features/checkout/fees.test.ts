import { describe, expect, it } from "vitest";
import { type FeeSettings, feeSummary, previewFees } from "./fees";

const settings: FeeSettings = {
  shipping_fee: "49.90",
  free_shipping_threshold: "500.00",
  cod_fee: "19.90",
};

describe("previewFees", () => {
  it("adds shipping below the threshold", () => {
    expect(previewFees("349.90", settings, "bank_transfer")).toEqual({
      shipping: "49.90",
      cod: "0.00",
      total: "399.80",
      freeShipping: false,
    });
  });
  it("waives shipping at exactly the threshold", () => {
    const r = previewFees("500.00", settings, "bank_transfer");
    expect(r.shipping).toBe("0.00");
    expect(r.freeShipping).toBe(true);
    expect(r.total).toBe("500.00");
  });
  it("adds the COD fee only for cash on delivery", () => {
    expect(previewFees("100.10", settings, "cod").total).toBe("169.90");
    expect(previewFees("100.10", settings, "bank_transfer").total).toBe("150.00");
  });
  it("takes the Voucher off the items but decides free shipping before it", () => {
    // 349.90 - 20.00 + 49.90 shipping
    expect(previewFees("349.90", settings, "bank_transfer", "20.00").total).toBe("379.80");
    // 500.00 reaches the threshold, so shipping stays free although 50.00 comes off.
    const r = previewFees("500.00", settings, "bank_transfer", "50.00");
    expect(r).toMatchObject({ shipping: "0.00", freeShipping: true, total: "450.00" });
  });
  it("never waives shipping without a threshold", () => {
    const r = previewFees("9999.00", { ...settings, free_shipping_threshold: null }, "cod");
    expect(r.shipping).toBe("49.90");
  });
});

describe("feeSummary", () => {
  const quote = {
    items_total: "349.90",
    discount: "0.00",
    shipping_fee: "95.00",
    cod_fee: "0.00",
    total: "444.90",
    free_shipping: false,
  };

  it("shows the flat-fee preview until a quote arrives", () => {
    expect(feeSummary("349.90", settings, "bank_transfer", undefined)).toEqual({
      ...previewFees("349.90", settings, "bank_transfer"),
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
  it("uses the computed quote once it has arrived", () => {
    expect(feeSummary("349.90", settings, "bank_transfer", quote)).toEqual({
      shipping: "95.00",
      cod: "0.00",
      total: "444.90",
      freeShipping: false,
      discount: "0.00",
      voucherCode: null,
      voucherProblem: null,
      calculated: true,
    });
  });
  it("reports free shipping from the quote", () => {
    const free = { ...quote, shipping_fee: "0.00", total: "500.00", free_shipping: true };
    expect(feeSummary("500.00", settings, "bank_transfer", free).freeShipping).toBe(true);
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
