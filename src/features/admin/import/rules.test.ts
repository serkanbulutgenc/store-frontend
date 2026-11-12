import { describe, expect, it } from "vitest";
import {
  changeCount,
  confirmBlocker,
  createdLists,
  describeCounts,
  type ImportPlan,
  MAX_BYTES,
  validateCsvFile,
} from "./rules";

const plan = (over: Partial<ImportPlan> = {}): ImportPlan => ({
  counts: {
    products_to_create: 1,
    products_to_update: 0,
    variants_to_create: 3,
    variants_to_update: 0,
    variants_unchanged: 0,
  },
  rows: [],
  errors: [],
  new_brands: [],
  new_suppliers: [],
  new_categories: [],
  ...over,
});

describe("validateCsvFile", () => {
  it("accepts a CSV within the limit", () => {
    expect(validateCsvFile({ name: "stok.csv", size: 1000 })).toBeNull();
    expect(validateCsvFile({ name: "STOK.CSV", size: MAX_BYTES })).toBeNull();
  });
  it("rejects other types, empty files and oversize files", () => {
    expect(validateCsvFile({ name: "stok.xlsx", size: 10 })).not.toBeNull();
    expect(validateCsvFile({ name: "stok.csv", size: 0 })).not.toBeNull();
    expect(validateCsvFile({ name: "stok.csv", size: MAX_BYTES + 1 })).not.toBeNull();
  });
});

describe("confirmBlocker", () => {
  it("lets a clean preview with changes through", () => {
    expect(confirmBlocker(plan())).toBeNull();
  });
  it("blocks a preview with any row error", () => {
    const withError = plan({ errors: [{ row: 3, column: "colour", message: "Bilinmeyen renk." }] });
    expect(confirmBlocker(withError)).toMatch(/hata/i);
  });
  it("blocks a preview that would change nothing", () => {
    const same = plan({
      counts: {
        products_to_create: 0,
        products_to_update: 0,
        variants_to_create: 0,
        variants_to_update: 0,
        variants_unchanged: 4,
      },
    });
    expect(changeCount(same.counts)).toBe(0);
    expect(confirmBlocker(same)).not.toBeNull();
  });
});

it("describes counts and lists only what will be created", () => {
  expect(describeCounts(plan().counts)).toContain("3 yeni varyant");
  const lists = createdLists(plan({ new_brands: ["Moda"], new_categories: [] }));
  expect(lists).toEqual([{ label: "Yeni markalar", items: ["Moda"] }]);
});
