import { expect, it } from "vitest";
import { afterDiscounts, hasDiscounts } from "./totals";

const off = { label: "100 ₺ üzeri 50 ₺ indirim", discount: "50.00", free_shipping: false };
const free = { label: "100 ₺ üzeri ücretsiz kargo", discount: "0.00", free_shipping: true };

it("has no discounts for a plain basket, or free shipping alone", () => {
  expect(hasDiscounts({ subtotal: "200.00" })).toBe(false);
  expect(hasDiscounts({ subtotal: "200.00", campaigns: [free] })).toBe(false);
  expect(afterDiscounts({ subtotal: "200.00", campaigns: [free] })).toBe("200.00");
});

it("takes the Basket Campaign off, then the Voucher's share of what is left", () => {
  const basket = { subtotal: "200.00", campaigns: [off, free], voucher: { discount: "15.00" } };
  expect(hasDiscounts(basket)).toBe(true);
  expect(afterDiscounts(basket)).toBe("135.00"); // 200 - 50 - 15
});

it("ignores a Voucher the basket refuses", () => {
  const basket = { subtotal: "200.00", voucher: { discount: "15.00", problem: "minimum" } };
  expect(hasDiscounts(basket)).toBe(false);
  expect(afterDiscounts(basket)).toBe("200.00");
});

it("never goes below zero", () => {
  expect(afterDiscounts({ subtotal: "10.00", campaigns: [off] })).toBe("0.00");
});
