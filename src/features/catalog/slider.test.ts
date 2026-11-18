import { describe, expect, it } from "vitest";
import type { ProductCard } from "./queries";
import { sliderProducts } from "./slider";

const card = (id: number) => ({ id }) as unknown as ProductCard;
const latest = [card(1), card(2), card(3)];

describe("sliderProducts", () => {
  it("shows the Collection's Products, in its order", () => {
    expect(sliderProducts([card(9), card(8)], latest)).toEqual([card(9), card(8)]);
  });
  it("falls back to the newest when the Collection is missing, unpublished or empty", () => {
    expect(sliderProducts(null, latest)).toEqual(latest);
    expect(sliderProducts(undefined, latest)).toEqual(latest);
    expect(sliderProducts([], latest)).toEqual(latest);
  });
});
