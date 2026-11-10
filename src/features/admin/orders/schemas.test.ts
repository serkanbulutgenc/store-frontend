import { describe, expect, it } from "vitest";
import { cancelFormSchema, refundFormSchema, shipFormSchema } from "./schemas";

describe("order form schemas", () => {
  it("requires a cancel reason", () => {
    expect(cancelFormSchema.safeParse({ reason: "  " }).success).toBe(false);
    expect(cancelFormSchema.safeParse({ reason: "Stok yok" }).success).toBe(true);
  });
  it("requires carrier and tracking number", () => {
    expect(shipFormSchema.safeParse({ carrier: "Yurtiçi", tracking_number: "" }).success).toBe(
      false,
    );
  });
  it("requires an IBAN for bank transfer refunds only", () => {
    const base = { amount: "10.00", iban: "" };
    expect(refundFormSchema.safeParse({ ...base, method: "bank_transfer" }).success).toBe(false);
    expect(refundFormSchema.safeParse({ ...base, method: "cash" }).success).toBe(true);
  });
});
