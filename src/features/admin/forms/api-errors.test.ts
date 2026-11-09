import { expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { apiErrorToFormErrors } from "./api-errors";

it("maps envelope fields to the first message per field and keeps the message as form error", () => {
  const e = new ApiError(422, "validation_error", "Girilen bilgiler geçersiz.", {
    name: ["Gerekli", "Çok kısa"],
    "price.amount": ["Negatif"],
  });
  expect(apiErrorToFormErrors(e)).toEqual({
    form: "Girilen bilgiler geçersiz.",
    fields: { name: "Gerekli", "price.amount": "Negatif" },
  });
});

it("returns a form-level error for non-ApiError values", () => {
  expect(apiErrorToFormErrors(new Error("boom"))).toEqual({
    form: "Beklenmeyen bir hata oluştu.",
    fields: {},
  });
});
