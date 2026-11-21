import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { linkProblem, subscribeProblem } from "./messages";

const err = (status: number, code: string, fields: Record<string, string[]> = {}) =>
  new ApiError(status, code, "sunucu mesajı", fields);

describe("subscribeProblem", () => {
  it("puts an email field error beside the field", () => {
    const p = subscribeProblem(
      err(422, "validation_error", { email: ["Geçerli bir e-posta girin."] }),
    );

    expect(p.email).toBe("Geçerli bir e-posta girin.");
  });

  it("says the Size is back when the Variant is in stock", () => {
    expect(subscribeProblem(err(409, "in_stock")).message).toContain("yeniden stokta");
  });

  it("explains the 5-per-email limit and the rate limit", () => {
    expect(subscribeProblem(err(409, "stock_alert_limit")).message).toContain("en fazla 5");
    expect(subscribeProblem(err(429, "rate_limited")).message).toContain("Çok fazla deneme");
  });

  it("falls back to a generic message for a network failure", () => {
    expect(subscribeProblem(new Error("boom")).message).toContain("kaydedilemedi");
  });
});

describe("linkProblem", () => {
  it("calls an unknown or expired link invalid, for both actions", () => {
    for (const action of ["confirm", "reject"] as const)
      expect(linkProblem(action, err(404, "not_found"))).toContain("geçersiz veya süresi dolmuş");
  });

  it("says the product is back in stock only when confirming", () => {
    expect(linkProblem("confirm", err(409, "in_stock"))).toContain("yeniden stoğa girdi");
    expect(linkProblem("reject", err(409, "in_stock"))).not.toContain("yeniden stoğa girdi");
  });
});
