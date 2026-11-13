import { expect, it } from "vitest";
import { categoryGroups, isEffectivelyHidden, reorderedIds } from "./category-order";
import type { CategoryOut } from "./queries";

const c = (id: number, name: string, over: Partial<CategoryOut> = {}): CategoryOut =>
  ({
    id,
    name,
    slug: name.toLowerCase(),
    parent_id: null,
    sort_order: 0,
    is_hidden: false,
    description: "",
    seo_title: "",
    seo_description: "",
    image: null,
    ...over,
  }) as CategoryOut;

const all = [
  c(1, "Giyim", { sort_order: 2 }),
  c(2, "Ayakkabı", { sort_order: 1 }),
  c(3, "Elbise", { parent_id: 1, sort_order: 2 }),
  c(4, "Etek", { parent_id: 1, sort_order: 1 }),
  c(5, "Çanta", { sort_order: 1 }),
];

it("groups siblings by sort order, then name", () => {
  const groups = categoryGroups(all);
  expect(groups[0]?.items.map((x) => x.id)).toEqual([2, 5, 1]);
  expect(groups[1]?.parent?.id).toBe(1);
  expect(groups[1]?.items.map((x) => x.id)).toEqual([4, 3]);
  expect(groups).toHaveLength(2);
});

it("moves one id within the group", () => {
  const items = categoryGroups(all)[0]?.items ?? [];
  expect(reorderedIds(items, 0, 2)).toEqual([5, 1, 2]);
  expect(reorderedIds(items, 1, 1)).toEqual([2, 5, 1]);
  expect(reorderedIds(items, 0, 9)).toEqual([2, 5, 1]);
});

it("treats a child of a hidden parent as hidden", () => {
  const list = [c(1, "A", { is_hidden: true }), c(2, "B", { parent_id: 1 }), c(3, "C")];
  expect(isEffectivelyHidden(list[1] as CategoryOut, list)).toBe(true);
  expect(isEffectivelyHidden(list[2] as CategoryOut, list)).toBe(false);
});
