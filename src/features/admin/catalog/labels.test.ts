import { expect, it } from "vitest";
import { categoryLabels, statusLabel } from "./labels";

const cats = [
  { id: 1, name: "Giyim", parent_id: null, slug: "giyim" },
  { id: 2, name: "Tişört", parent_id: 1, slug: "tisort" },
  { id: 3, name: "Ayakkabı", parent_id: null, slug: "ayakkabi" },
];

it("labels two-level categories as 'Parent › Child', sorted so each parent precedes its children", () => {
  expect(categoryLabels(cats)).toEqual([
    { id: 3, label: "Ayakkabı" },
    { id: 1, label: "Giyim" },
    { id: 2, label: "Giyim › Tişört" },
  ]);
});

it("keeps a child whose parent is missing", () => {
  expect(categoryLabels([{ id: 9, name: "Yetim", parent_id: 99, slug: "y" }])).toEqual([
    { id: 9, label: "Yetim" },
  ]);
});

it("translates statuses", () => {
  expect(statusLabel("draft")).toBe("Taslak");
  expect(statusLabel("published")).toBe("Yayında");
  expect(statusLabel("archived")).toBe("Arşivlenmiş");
});
