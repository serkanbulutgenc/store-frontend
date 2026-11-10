import { describe, expect, it } from "vitest";
import { checkoutPrefill, pickDefault } from "./prefill";
import type { SavedAddress } from "./schemas";

const addr = (id: number, is_default: boolean): SavedAddress => ({
  id,
  full_name: `Ad ${id} Soyad`,
  phone: `+9053200000${String(id).padStart(2, "0")}`,
  il: "Mersin",
  ilce: "Yenişehir",
  mahalle: "M",
  street: `Sokak ${id}`,
  postal_code: "",
  is_default,
});
const profile = { email: "a@b.com", name: "Profil Adı", phone: "+905300000000" };

describe("pickDefault", () => {
  it("prefers the default", () => expect(pickDefault([addr(1, false), addr(2, true)])?.id).toBe(2));
  it("falls back to the first", () => expect(pickDefault([addr(1, false)])?.id).toBe(1));
  it("is undefined for an empty book", () => expect(pickDefault([])).toBeUndefined());
});

describe("checkoutPrefill", () => {
  it("fills contact and shipping from the default address", () => {
    const v = checkoutPrefill(profile, [addr(1, false), addr(2, true)]);
    expect(v.email).toBe("a@b.com");
    expect(v.full_name).toBe("Ad 2 Soyad");
    expect(v.phone).toBe("+905320000002");
    expect(v.shipping_address?.street).toBe("Sokak 2");
  });
  it("uses the profile when there is no address, leaving shipping alone", () => {
    const v = checkoutPrefill(profile, []);
    expect(v.full_name).toBe("Profil Adı");
    expect(v.phone).toBe("+905300000000");
    expect("shipping_address" in v).toBe(false);
  });
});
