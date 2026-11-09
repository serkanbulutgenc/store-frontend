import { describe, expect, it } from "vitest";
import {
  browseSearchSchema,
  effectiveSort,
  MAX_PAGES,
  pageNumbers,
  toggleValue,
  toListQuery,
  withFilters,
} from "./browse-search";

describe("browseSearchSchema", () => {
  it("leaves an empty URL empty so the address stays clean", () => {
    expect(browseSearchSchema.parse({})).toEqual({});
  });

  it("keeps valid filters", () => {
    expect(
      browseSearchSchema.parse({
        q: "elbise",
        colour: [1, 2],
        size: ["M"],
        brand: [3],
        price_min: 100,
        price_max: 500,
        in_stock: false,
        sort: "price_asc",
        page: 2,
      }),
    ).toMatchObject({ q: "elbise", colour: [1, 2], in_stock: false, sort: "price_asc", page: 2 });
  });

  it("turns a numeric ?q= (the URL parser yields a number) into a string", () => {
    expect(browseSearchSchema.parse({ q: 123 })).toEqual({ q: "123" });
  });

  it("drops garbage instead of throwing", () => {
    expect(
      browseSearchSchema.parse({
        colour: "x",
        sort: "cheapest",
        page: -3,
        price_min: "abc",
        in_stock: "maybe",
      }),
    ).toEqual({});
  });

  it("wraps a single value into an array", () => {
    expect(browseSearchSchema.parse({ size: "M", colour: 4 })).toEqual({
      size: ["M"],
      colour: [4],
    });
  });
});

describe("effectiveSort", () => {
  it("defaults to relevance when searching and newest otherwise", () => {
    expect(effectiveSort({ q: "elbise" })).toBe("relevance");
    expect(effectiveSort({})).toBe("newest");
  });
  it("honours an explicit sort", () => {
    expect(effectiveSort({ q: "x", sort: "price_desc" })).toBe("price_desc");
  });
  it("never offers relevance without a search term", () => {
    expect(effectiveSort({ sort: "relevance" })).toBe("newest");
  });
});

describe("toListQuery", () => {
  it("sends in_stock=true by default and the category slug", () => {
    expect(toListQuery({}, { category: "elbise", page: 1 })).toEqual({
      category: "elbise",
      in_stock: true,
      sort: "newest",
      page: 1,
    });
  });

  it("passes filters through and omits empty ones", () => {
    expect(
      toListQuery(
        { q: "a", colour: [1], size: [], price_min: 10, in_stock: false, sort: "price_asc" },
        { page: 3 },
      ),
    ).toEqual({ q: "a", colour: [1], price_min: 10, in_stock: false, sort: "price_asc", page: 3 });
  });
});

describe("pageNumbers", () => {
  it("shows pages 1..page so a reload restores what 'daha fazla' revealed", () => {
    expect(pageNumbers(undefined)).toEqual([1]);
    expect(pageNumbers(3)).toEqual([1, 2, 3]);
  });
  it("caps the number of pages fetched for one URL", () => {
    expect(pageNumbers(500)).toHaveLength(MAX_PAGES);
  });
});

describe("withFilters", () => {
  it("resets the page when a filter changes", () => {
    expect(withFilters({ page: 4, q: "a" }, { size: ["M"] })).toEqual({ q: "a", size: ["M"] });
  });
  it("removes a filter set to undefined or an empty list", () => {
    expect(withFilters({ colour: [1], size: ["M"] }, { colour: [], size: undefined })).toEqual({});
  });
  it("omits in_stock when it is back to the default", () => {
    expect(withFilters({ in_stock: false }, { in_stock: true })).toEqual({});
    expect(withFilters({}, { in_stock: false })).toEqual({ in_stock: false });
  });
});

describe("toggleValue", () => {
  it("adds and removes", () => {
    expect(toggleValue([1], 2)).toEqual([1, 2]);
    expect(toggleValue([1, 2], 1)).toEqual([2]);
    expect(toggleValue(undefined, "M")).toEqual(["M"]);
  });
});
