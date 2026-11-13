import { expect, it } from "vitest";
import { classFormSchema, classLocks, kdvError } from "./product-class-form";

const valid = {
  name: "Çanta",
  size_scheme: "one_size",
  default_kdv_rate: "20,5",
  is_hygiene: "false",
  default_desi: "3",
};

it("accepts a valid class and normalises a decimal comma", () => {
  expect(classFormSchema.parse(valid).default_kdv_rate).toBe("20.5");
});

it("rejects a blank name, an unknown scheme, a bad KDV rate and a bad desi", () => {
  for (const bad of [
    { name: "  " },
    { size_scheme: "custom" },
    { default_kdv_rate: "101" },
    { default_kdv_rate: "abc" },
    { default_desi: "0" },
    { default_desi: "1.5" },
  ]) {
    expect(classFormSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
  }
});

it("checks the KDV rate range and precision", () => {
  expect(kdvError("10")).toBeNull();
  expect(kdvError("7.5")).toBeNull();
  expect(kdvError("100")).toBeNull();
  expect(kdvError("100.5")).not.toBeNull();
  expect(kdvError("1.234")).not.toBeNull();
  expect(kdvError("")).not.toBeNull();
});

it("locks the size scheme only when the class has products", () => {
  const row = { product_count: 2 } as Parameters<typeof classLocks>[0];
  expect(Object.keys(classLocks(row))).toEqual(["size_scheme"]);
  expect(classLocks({ product_count: 0 } as typeof row)).toEqual({});
  expect(classLocks({ product_count: null } as typeof row)).toEqual({});
});
