import { describe, expect, it } from "vitest";
import { checkoutQuoteKey } from "./quote-key";

const basket = {
  subtotal: "200.00",
  lines: [{ id: 7, quantity: 2 }],
  voucher: null as { code: string; problem?: string | null } | null,
};
const key = (b = basket) => JSON.stringify(checkoutQuoteKey(b, "Mersin", "bank_transfer"));

describe("checkoutQuoteKey", () => {
  it("is the same while nothing that changes the price has changed", () => {
    expect(key()).toBe(key({ ...basket }));
  });

  it("changes when a Voucher is applied, swapped or removed, so the quote is asked again", () => {
    const applied = { ...basket, voucher: { code: "YAZ10" } };
    expect(key(applied)).not.toBe(key());
    expect(key({ ...basket, voucher: { code: "FIX50" } })).not.toBe(key(applied));
    expect(key({ ...applied, voucher: null })).toBe(key());
  });

  it("changes when the Voucher stops applying, though the code stays", () => {
    const applied = { ...basket, voucher: { code: "YAZ10", problem: null } };
    const stale = { ...basket, voucher: { code: "YAZ10", problem: "expired" } };
    expect(key(stale)).not.toBe(key(applied));
  });

  it("still follows the lines, the province and the payment method", () => {
    expect(key({ ...basket, lines: [{ id: 7, quantity: 3 }] })).not.toBe(key());
    expect(JSON.stringify(checkoutQuoteKey(basket, "Trabzon", "bank_transfer"))).not.toBe(key());
    expect(JSON.stringify(checkoutQuoteKey(basket, "Mersin", "cod"))).not.toBe(key());
  });
});
