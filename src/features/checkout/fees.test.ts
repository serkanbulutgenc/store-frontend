import { describe, expect, it } from "vitest";
import { type FeeSettings, previewFees } from "./fees";

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
  it("never waives shipping without a threshold", () => {
    const r = previewFees("9999.00", { ...settings, free_shipping_threshold: null }, "cod");
    expect(r.shipping).toBe("49.90");
  });
});
