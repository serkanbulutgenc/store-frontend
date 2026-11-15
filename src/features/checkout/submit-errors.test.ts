import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { checkoutSubmitErrors } from "./submit-errors";

describe("checkoutSubmitErrors", () => {
  it("keeps a refused Voucher out of the form, because the Voucher field shows it", () => {
    // The checkout form has no `voucher_code` input, so a field error stored under that name
    // could never be cleared and would stop the Shopper placing the order without the code.
    const refused = new ApiError(409, "voucher_invalid", "Kupon kodu artık kullanılamıyor.", {
      voucher_code: ["exhausted"],
    });
    expect(checkoutSubmitErrors(refused)).toBeUndefined();
  });

  it("puts every other refusal on the form and its fields", () => {
    const refused = new ApiError(422, "invalid", "Geçersiz değer.", {
      phone: ["Geçersiz telefon."],
    });
    expect(checkoutSubmitErrors(refused)).toEqual({
      form: "Geçersiz değer.",
      fields: { phone: "Geçersiz telefon." },
    });
    expect(checkoutSubmitErrors(new Error("boom"))).toEqual({
      form: "Beklenmeyen bir hata oluştu.",
      fields: {},
    });
  });
});
