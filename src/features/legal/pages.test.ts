import { describe, expect, it } from "vitest";
import { LEGAL_PAGES, legalBySlug } from "./pages";

describe("legal pages", () => {
  it("covers the seven backend identifiers with unique slugs", () => {
    expect(LEGAL_PAGES.map((p) => p.key).sort()).toEqual([
      "about_contact",
      "delivery_shipping",
      "distance_sales_contract",
      "payment_methods",
      "pre_information_form",
      "privacy_notice",
      "returns_withdrawal",
    ]);
    expect(new Set(LEGAL_PAGES.map((p) => p.slug)).size).toBe(7);
  });
  it("has text and a version for each page", () => {
    for (const p of LEGAL_PAGES) {
      expect(p.body.length).toBeGreaterThan(20);
      expect(p.version).not.toBe("");
    }
    expect(legalBySlug("gizlilik-ve-kvkk")?.key).toBe("privacy_notice");
    expect(legalBySlug("nope")).toBeUndefined();
  });
});
