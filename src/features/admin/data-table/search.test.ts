import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  listSearchSchema,
  orderingToSorting,
  paginationToSearch,
  sortingToOrdering,
  toApiQuery,
} from "./search";

describe("listSearchSchema", () => {
  it("fills defaults", () => {
    expect(listSearchSchema.parse({})).toEqual({ page: 1, size: 25 });
  });

  it("coerces numeric strings from the URL", () => {
    expect(listSearchSchema.parse({ page: "3", size: "50" })).toMatchObject({ page: 3, size: 50 });
  });

  it("falls back instead of throwing on garbage", () => {
    expect(listSearchSchema.parse({ page: "-4", size: "7", ordering: 5 })).toEqual({
      page: 1,
      size: 25,
    });
  });

  it("keeps a numeric search term (the URL parser turns ?q=12345 into a number)", () => {
    expect(listSearchSchema.parse({ q: 12345 })).toMatchObject({ q: "12345" });
    expect(listSearchSchema.parse({ q: "abc" })).toMatchObject({ q: "abc" });
  });

  it("can be extended with screen filters", () => {
    const s = listSearchSchema.extend({ status: z.string().optional() });
    expect(s.parse({ status: "draft" })).toMatchObject({ status: "draft" });
  });
});

describe("toApiQuery", () => {
  it("maps size to page_size and drops empty values", () => {
    expect(toApiQuery({ page: 2, size: 50, q: "", ordering: "-created", status: "live" })).toEqual({
      page: 2,
      page_size: 50,
      ordering: "-created",
      status: "live",
    });
  });
});

describe("sorting <-> ordering", () => {
  it("round-trips", () => {
    expect(orderingToSorting("-price")).toEqual([{ id: "price", desc: true }]);
    expect(orderingToSorting("name")).toEqual([{ id: "name", desc: false }]);
    expect(orderingToSorting(undefined)).toEqual([]);
    expect(sortingToOrdering([{ id: "price", desc: true }])).toBe("-price");
    expect(sortingToOrdering([])).toBeUndefined();
  });
});

describe("paginationToSearch", () => {
  it("converts zero-based table state to one-based page", () => {
    expect(paginationToSearch({ pageIndex: 0, pageSize: 25 })).toEqual({ page: 1, size: 25 });
    expect(paginationToSearch({ pageIndex: 2, pageSize: 10 })).toEqual({ page: 3, size: 10 });
  });
});
