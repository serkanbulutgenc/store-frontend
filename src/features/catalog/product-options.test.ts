import { describe, expect, it } from "vitest";
import {
  canAddToBasket,
  defaultColourId,
  findVariant,
  type OptPhoto,
  type OptVariant,
  photosForColour,
  sizesForColour,
  stockLabel,
} from "./product-options";

const sw = (id: number) => ({ id, name: `c${id}`, hex_code: "#000000" });
const v = (
  id: number,
  colour: number,
  size: string,
  available: number,
  remaining: number | null = null,
): OptVariant => ({
  id,
  colour: sw(colour),
  size,
  available,
  in_stock: available > 0,
  remaining,
});
const p = (id: number, colour_id: number | null, is_primary = false): OptPhoto => ({
  id,
  colour_id,
  is_primary,
});

describe("photosForColour", () => {
  const photos = [p(1, null), p(2, 10), p(3, 20, true), p(4, 10, true)];

  it("shows only the selected colour's photos, primary first", () => {
    expect(photosForColour(photos, 10).map((x) => x.id)).toEqual([4, 2]);
  });
  it("falls back to shared photos when the colour has none", () => {
    expect(photosForColour(photos, 99).map((x) => x.id)).toEqual([1]);
  });
  it("falls back to every photo when there are no shared ones either", () => {
    expect(photosForColour([p(2, 10), p(3, 20)], 99).map((x) => x.id)).toEqual([2, 3]);
  });
  it("shows everything when no colour is selected", () => {
    expect(photosForColour(photos, null)).toHaveLength(4);
  });
});

describe("sizesForColour", () => {
  const variants = [v(1, 10, "M", 3), v(2, 10, "S", 0), v(3, 20, "S", 1)];
  it("lists that colour's sizes with their stock state", () => {
    expect(sizesForColour(variants, 10)).toEqual([
      { size: "M", variantId: 1, inStock: true },
      { size: "S", variantId: 2, inStock: false },
    ]);
  });
});

describe("findVariant", () => {
  const variants = [v(1, 10, "M", 3), v(2, 20, "M", 0)];
  it("finds by colour and size", () => {
    expect(findVariant(variants, 20, "M")?.id).toBe(2);
    expect(findVariant(variants, 20, "L")).toBeUndefined();
    expect(findVariant(variants, 10, null)).toBeUndefined();
  });
});

describe("defaultColourId", () => {
  it("prefers the first colour that has stock", () => {
    expect(defaultColourId([v(1, 10, "M", 0), v(2, 20, "M", 2)])).toBe(20);
  });
  it("falls back to the first colour when all are sold out", () => {
    expect(defaultColourId([v(1, 10, "M", 0), v(2, 20, "M", 0)])).toBe(10);
  });
  it("is null without variants", () => {
    expect(defaultColourId([])).toBeNull();
  });
});

describe("canAddToBasket", () => {
  it("needs a selected, in-stock variant", () => {
    expect(canAddToBasket(undefined)).toBe(false);
    expect(canAddToBasket(v(1, 10, "M", 0))).toBe(false);
    expect(canAddToBasket(v(1, 10, "M", 2))).toBe(true);
  });
});

describe("stockLabel", () => {
  it("says Tükendi when sold out, Son N adet when low, nothing otherwise", () => {
    expect(stockLabel(v(1, 10, "M", 0))).toBe("Tükendi");
    expect(stockLabel(v(1, 10, "M", 2, 2))).toBe("Son 2 adet");
    expect(stockLabel(v(1, 10, "M", 9))).toBeNull();
    expect(stockLabel(undefined)).toBeNull();
  });
});
