import { describe, expect, it } from "vitest";
import { isExactCode } from "./labels";

const variants = [
  { sku: "TIS-BLK-M", barcode: "8690000000011" },
  { sku: "TIS-WHT-M", barcode: null },
];

describe("isExactCode", () => {
  it("matches a SKU case-insensitively and a barcode exactly", () => {
    expect(isExactCode(variants, "tis-blk-m")).toBe(true);
    expect(isExactCode(variants, "8690000000011")).toBe(true);
  });
  it("does not match a title fragment or a partial code", () => {
    expect(isExactCode(variants, "tişört")).toBe(false);
    expect(isExactCode(variants, "TIS-BLK")).toBe(false);
    expect(isExactCode(variants, "86900")).toBe(false);
  });
});
