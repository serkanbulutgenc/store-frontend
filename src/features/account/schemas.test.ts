import { describe, expect, it } from "vitest";
import {
  addressSchema,
  emptyAddress,
  offerSchema,
  passwordChangeSchema,
  profileSchema,
  signUpSchema,
} from "./schemas";

const paths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.success ? [] : (r.error?.issues.map((i) => i.path.join(".")) ?? []);

describe("signUpSchema", () => {
  const ok = { email: "a@b.com", password: "longenough", confirm: "longenough" };
  it("accepts matching passwords", () => expect(signUpSchema.safeParse(ok).success).toBe(true));
  it("rejects a short password", () =>
    expect(paths(signUpSchema.safeParse({ ...ok, password: "short", confirm: "short" }))).toEqual([
      "password",
    ]));
  it("rejects mismatched passwords", () =>
    expect(paths(signUpSchema.safeParse({ ...ok, confirm: "different1" }))).toEqual(["confirm"]));
  it("rejects a bad email", () =>
    expect(paths(signUpSchema.safeParse({ ...ok, email: "nope" }))).toEqual(["email"]));
});

describe("offerSchema", () => {
  it("asks for a password only", () =>
    expect(offerSchema.safeParse({ password: "longenough", confirm: "longenough" }).success).toBe(
      true,
    ));
});

describe("passwordChangeSchema", () => {
  it("needs the current password", () =>
    expect(
      paths(
        passwordChangeSchema.safeParse({
          current: "",
          password: "longenough",
          confirm: "longenough",
        }),
      ),
    ).toEqual(["current"]));
});

describe("profileSchema", () => {
  it("allows an empty phone", () =>
    expect(profileSchema.safeParse({ name: "", phone: "", marketing_consent: false }).success).toBe(
      true,
    ));
  it("rejects a malformed phone", () =>
    expect(
      paths(profileSchema.safeParse({ name: "", phone: "12", marketing_consent: false })),
    ).toEqual(["phone"]));
});

describe("addressSchema", () => {
  const ok = {
    ...emptyAddress,
    full_name: "Ayşe Yılmaz",
    phone: "0532 123 45 67",
    il: "Mersin",
    ilce: "Yenişehir",
    mahalle: "Çiftlikköy",
    street: "Gül Sok. 5",
  };
  it("accepts a full address", () => expect(addressSchema.safeParse(ok).success).toBe(true));
  it("needs a surname", () =>
    expect(paths(addressSchema.safeParse({ ...ok, full_name: "Ayşe" }))).toEqual(["full_name"]));
  it("needs every address part", () =>
    expect(paths(addressSchema.safeParse({ ...ok, mahalle: " " }))).toEqual(["mahalle"]));
});
