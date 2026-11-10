import { describe, expect, it } from "vitest";
import { checkoutSchema, emptyCheckout, toCheckoutBody } from "./schemas";

const address = {
  il: "İstanbul",
  ilce: "Kadıköy",
  mahalle: "Moda",
  street: "Bahariye Cd. 1",
  postal_code: "",
};
const valid = {
  ...emptyCheckout,
  full_name: "Ayşe Yılmaz",
  email: "ayse@example.com",
  phone: "0532 123 45 67",
  shipping_address: address,
  contract_acknowledged: true,
};

const messages = (v: unknown) => {
  const r = checkoutSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("checkoutSchema", () => {
  it("accepts a complete bank-transfer order", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("needs the contract box ticked", () => {
    expect(messages({ ...valid, contract_acknowledged: false })).toEqual(["contract_acknowledged"]);
  });
  it("needs the fee consent for COD only", () => {
    expect(messages({ ...valid, payment_method: "cod" })).toEqual(["cod_fee_consent"]);
    expect(
      checkoutSchema.safeParse({ ...valid, payment_method: "cod", cod_fee_consent: true }).success,
    ).toBe(true);
  });
  it("needs a full name and a street", () => {
    expect(messages({ ...valid, full_name: "Ayşe" })).toEqual(["full_name"]);
    expect(messages({ ...valid, shipping_address: { ...address, street: " " } })).toEqual([
      "shipping_address.street",
    ]);
  });
  it("checks billing only when a different address is ticked", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
    expect(messages({ ...valid, billing_different: true })).toContain("billing_address.il");
  });
});

describe("toCheckoutBody", () => {
  it("omits billing and COD consent when they do not apply", () => {
    const body = toCheckoutBody({ ...valid, cod_fee_consent: true }, { privacy_notice: "1" });
    expect(body.billing_address).toBeNull();
    expect(body.cod_fee_consent).toBe(false);
    expect(body.legal_versions).toEqual({ privacy_notice: "1" });
  });
  it("sends billing when ticked", () => {
    const body = toCheckoutBody(
      { ...valid, billing_different: true, billing_address: address },
      {},
    );
    expect(body.billing_address).toEqual(address);
  });
});
