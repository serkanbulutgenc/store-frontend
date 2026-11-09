import { expect, it } from "vitest";
import { keys } from "./queries";

/** A mutation invalidates `keys.products`; the open product's detail must be under it. */
it("product detail and list queries share the invalidation prefix", () => {
  const detail = keys.product(7);
  expect(detail.slice(0, keys.products.length)).toEqual([...keys.products]);
});
