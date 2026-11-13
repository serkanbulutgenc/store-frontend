import { expect, it } from "vitest";
import { facetLabels } from "./attribute-facets";
import { browseSearchSchema, toListQuery, withFilters } from "./browse-search";
import { isIndexableListing } from "./seo";

it("adds the class to a facet name only when two facets share it", () => {
  const labels = facetLabels([
    { id: 1, name: "Kumaş", product_class: "Giyim" },
    { id: 2, name: "Kumaş", product_class: "İç Giyim" },
    { id: 3, name: "Sezon", product_class: "Giyim" },
  ]);
  expect(labels.get(1)).toBe("Kumaş (Giyim)");
  expect(labels.get(2)).toBe("Kumaş (İç Giyim)");
  expect(labels.get(3)).toBe("Sezon");
});

it("keeps attribute options in the URL and the API query", () => {
  const search = browseSearchSchema.parse({ option: [4, 7] });
  expect(search.option).toEqual([4, 7]);
  expect(toListQuery(search, { page: 1 }).option).toEqual([4, 7]);
  expect(browseSearchSchema.parse({ option: "x" }).option).toBeUndefined();
  expect(withFilters(search, { option: [] })).toEqual({});
});

it("does not index a listing filtered by an attribute option", () => {
  expect(isIndexableListing({}, "category")).toBe(true);
  expect(isIndexableListing({ option: [4] }, "category")).toBe(false);
});
