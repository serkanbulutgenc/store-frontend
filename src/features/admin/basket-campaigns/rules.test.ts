import { expect, it } from "vitest";
import { ruleLabel, tl } from "./rules";

it("writes whole amounts without cents and groups thousands with dots", () => {
  expect(tl("500.00")).toBe("500");
  expect(tl("1250.50")).toBe("1.250,50");
  expect(tl("1000000.00")).toBe("1.000.000");
  expect(tl("12.5")).toBe("12,50");
});

it("builds the line the Shopper reads, as the server does", () => {
  expect(ruleLabel("fixed", "500.00", "50.00")).toBe("500 ₺ üzeri 50 ₺ indirim");
  expect(ruleLabel("percentage", "1250.50", "10.00")).toBe("1.250,50 ₺ üzeri %10 indirim");
  expect(ruleLabel("percentage", "300", "12.50")).toBe("300 ₺ üzeri %12,50 indirim");
  expect(ruleLabel("free_shipping", "750.00", null)).toBe("750 ₺ üzeri ücretsiz kargo");
});
