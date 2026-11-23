import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { type ContactValues, contactErrors, MESSAGE_MAX, submitProblem } from "./rules";

const good: ContactValues = {
  categoryId: 1,
  name: "Ayşe Yılmaz",
  email: "ayse@example.com",
  orderNumber: "",
  message: "Siparişim ne zaman gelir?",
};

describe("contactErrors", () => {
  it("accepts a complete form, with the order number left out", () => {
    expect(contactErrors(good)).toEqual({});
  });

  it("names every missing or bad field", () => {
    const errors = contactErrors({
      categoryId: null,
      name: "  ",
      email: "ayse@",
      orderNumber: "x".repeat(51),
      message: "",
    });
    expect(Object.keys(errors).sort()).toEqual([
      "category",
      "email",
      "message",
      "name",
      "order_number",
    ]);
  });

  it("refuses a message over the limit", () => {
    expect(contactErrors({ ...good, message: "a".repeat(MESSAGE_MAX + 1) }).message).toBeDefined();
  });
});

describe("submitProblem", () => {
  it("says to wait on the rate limit", () => {
    const p = submitProblem(new ApiError(429, "rate_limited", "x"));
    expect(p.general).toContain("birkaç dakika");
    expect(p.fields).toEqual({});
  });

  it("puts the API's field messages next to their fields", () => {
    const p = submitProblem(
      new ApiError(422, "invalid", "x", {
        email: ["Geçerli bir e-posta adresi girin."],
        category_id: ["Geçerli bir konu seçin."],
      }),
    );
    expect(p.fields).toEqual({
      email: "Geçerli bir e-posta adresi girin.",
      category: "Geçerli bir konu seçin.",
    });
    expect(p.general).toBeNull();
  });

  it("falls back to one line for anything else", () => {
    expect(submitProblem(new Error("boom")).general).toContain("gönderilemedi");
    expect(submitProblem(new ApiError(500, "error", "x")).general).toContain("gönderilemedi");
  });
});
