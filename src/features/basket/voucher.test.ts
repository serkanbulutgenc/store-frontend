import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { voucherMessage, voucherReason } from "./voucher";

describe("voucherMessage", () => {
  it("says only that the code is invalid, whatever the reason behind it", () => {
    // A Shopper must not learn whether a code exists, is switched off, used up or used before.
    for (const reason of ["invalid", "inactive", "exhausted", "already_used"]) {
      expect(voucherMessage(reason, null)).toBe("Geçersiz kupon kodu.");
    }
  });

  it("tells the Shopper when the code has run out of time", () => {
    expect(voucherMessage("expired", null)).toBe("Bu kuponun süresi dolmuş.");
  });

  it("names the basket total a below-minimum code needs", () => {
    expect(voucherMessage("minimum", "250.00")).toBe(
      "Bu kupon için sepet tutarı en az ₺250,00 olmalı.",
    );
  });
});

describe("voucherReason", () => {
  it("reads the reason out of a refused code, from the cart or from checkout", () => {
    const fields = { voucher_code: ["expired"] };
    expect(voucherReason(new ApiError(422, "voucher_invalid", "x", fields))).toBe("expired");
    expect(voucherReason(new ApiError(409, "voucher_invalid", "x", fields))).toBe("expired");
  });

  it("is null for any other failure", () => {
    expect(voucherReason(new ApiError(409, "insufficient_stock", "x"))).toBeNull();
    expect(voucherReason(new ApiError(422, "validation", "x", { email: ["bad"] }))).toBeNull();
    expect(voucherReason(new Error("network"))).toBeNull();
    expect(voucherReason(null)).toBeNull();
  });
});
