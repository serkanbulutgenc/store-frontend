import { describe, expect, it } from "vitest";
import { loadProductPage } from "./product-page-data";
import type { ProductCard, ProductDetail } from "./queries";

type Opts = { queryKey: readonly unknown[] };

const product = { id: 1, slug: "gomlek" } as ProductDetail;
const similar = [{ id: 2, slug: "bluz" }] as ProductCard[];

/** Loads the page through a query client that answers each query by its key. */
function load(answer: (kind: string) => unknown) {
  const queryClient = {
    query: async (opts: Opts) => answer(String(opts.queryKey.at(-2))),
  };
  return loadProductPage(queryClient as never, "gomlek");
}

describe("loadProductPage", () => {
  it("loads the similar products with the product, so the server renders their links", async () => {
    const out = await load((kind) => (kind === "similar" ? similar : product));

    expect(out.product).toBe(product);
    expect(out.similar).toBe(similar);
  });

  it("hides the rail, instead of failing the page, when the similar request fails", async () => {
    const out = await load((kind) => {
      if (kind === "similar") throw new Error("503");
      return product;
    });

    expect(out.product).toBe(product);
    expect(out.similar).toEqual([]);
  });
});
