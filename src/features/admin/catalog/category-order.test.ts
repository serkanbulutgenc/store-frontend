import { describe, expect, it } from "vitest";
import {
  buildTree,
  type CategoryNode,
  expandableIds,
  isEffectivelyHidden,
  moveTargets,
  reorderedIds,
  siblingReorder,
  visibleRows,
} from "./category-order";
import type { CategoryOut } from "./queries";

const c = (id: number, name: string, over: Partial<CategoryOut> = {}): CategoryOut =>
  ({
    id,
    name,
    slug: name.toLowerCase(),
    parent_id: null,
    depth: 1,
    child_count: 0,
    product_count: 0,
    sort_order: 0,
    is_hidden: false,
    description: "",
    seo_title: "",
    seo_description: "",
    image: null,
    ...over,
  }) as CategoryOut;

/** Giyim > Elbise > Midi > Yazlık > Keten (depth 5), plus siblings to test ordering. */
const all = [
  c(1, "Giyim", { sort_order: 2, child_count: 2 }),
  c(2, "Ayakkabı", { sort_order: 1 }),
  c(3, "Elbise", { parent_id: 1, depth: 2, sort_order: 2, child_count: 1 }),
  c(4, "Etek", { parent_id: 1, depth: 2, sort_order: 1 }),
  c(5, "Çanta", { sort_order: 1 }),
  c(6, "Midi", { parent_id: 3, depth: 3, child_count: 1 }),
  c(7, "Yazlık", { parent_id: 6, depth: 4, child_count: 1 }),
  c(8, "Keten", { parent_id: 7, depth: 5 }),
];

const ids = (nodes: CategoryNode[]) => nodes.map((n) => n.category.id);

it("builds a nested tree with siblings by sort order, then name", () => {
  const tree = buildTree(all);
  expect(ids(tree)).toEqual([2, 5, 1]);
  const giyim = tree[2] as CategoryNode;
  expect(ids(giyim.children)).toEqual([4, 3]);
  const keten = giyim.children[1]?.children[0]?.children[0]?.children[0];
  expect(keten?.category.id).toBe(8);
  expect(keten?.children).toEqual([]);
});

it("moves one id within the group", () => {
  const items = buildTree(all).map((n) => n.category);
  expect(reorderedIds(items, 0, 2)).toEqual([5, 1, 2]);
  expect(reorderedIds(items, 1, 1)).toEqual([2, 5, 1]);
  expect(reorderedIds(items, 0, 9)).toEqual([2, 5, 1]);
});

it("treats a Category under a hidden ancestor, at any depth, as hidden", () => {
  const list = [
    c(1, "A", { is_hidden: true }),
    c(2, "B", { parent_id: 1, depth: 2 }),
    c(3, "C", { parent_id: 2, depth: 3 }),
    c(4, "D"),
  ];
  expect(isEffectivelyHidden(list[1] as CategoryOut, list)).toBe(true);
  expect(isEffectivelyHidden(list[2] as CategoryOut, list)).toBe(true);
  expect(isEffectivelyHidden(list[3] as CategoryOut, list)).toBe(false);
});

const rowIds = (expanded: number[]) =>
  visibleRows(buildTree(all), new Set(expanded)).map((r) => r.category.id);

it("shows only the top level while everything is collapsed", () => {
  expect(rowIds([])).toEqual([2, 5, 1]);
});

it("shows a Category's children right under it once it is expanded", () => {
  expect(rowIds([1])).toEqual([2, 5, 1, 4, 3]);
  expect(rowIds([1, 3])).toEqual([2, 5, 1, 4, 3, 6]);
});

it("expand all opens every Category that has children, down to depth 5", () => {
  const open = expandableIds(all);
  expect([...open].sort()).toEqual([1, 3, 6, 7]);
  expect(rowIds([...open])).toEqual([2, 5, 1, 4, 3, 6, 7, 8]);
});

it("does not show the children of a collapsed Category even if a descendant is expanded", () => {
  expect(rowIds([3, 6])).toEqual([2, 5, 1]);
});

it("describes each row for its actions", () => {
  const rows = visibleRows(buildTree(all), new Set(expandableIds(all)));
  const row = (id: number) => rows.find((r) => r.category.id === id);
  expect(row(1)).toMatchObject({
    depth: 1,
    hasChildren: true,
    expanded: true,
    index: 2,
    siblings: 3,
  });
  expect(row(4)).toMatchObject({
    depth: 2,
    hasChildren: false,
    index: 0,
    siblings: 2,
    parentId: 1,
  });
  expect(row(8)).toMatchObject({ depth: 5, canAddChild: false });
  expect(row(7)).toMatchObject({ depth: 4, canAddChild: true });
});

const targets = (id: number) =>
  Object.fromEntries(moveTargets(all, id).map((t) => [t.category.id, t.blocked]));

it("lists every Category as a possible parent, in tree order, with its depth", () => {
  expect(moveTargets(all, 5).map((t) => [t.category.id, t.depth])).toEqual([
    [2, 1],
    [5, 1],
    [1, 1],
    [4, 2],
    [3, 2],
    [6, 3],
    [7, 4],
    [8, 5],
  ]);
});

it("blocks the Category itself and everything under it", () => {
  expect(targets(3)).toMatchObject({
    3: "self",
    6: "descendant",
    7: "descendant",
    8: "descendant",
  });
  expect(targets(3)[1]).toBeNull();
  expect(targets(3)[2]).toBeNull();
});

it("blocks parents that would push the moved subtree past depth 5", () => {
  // Elbise (3) carries a subtree three levels deep (Elbise, Midi, Yazlık, Keten = 4 levels):
  // it can only go under a depth-1 parent.
  const t = targets(3);
  expect(t[4]).toBe("too-deep"); // depth 2: 2 + 4 = 6
  expect(t[2]).toBeNull(); // depth 1: 1 + 4 = 5
  expect(t[1]).toBeNull();
});

it("allows a leaf under a depth-4 parent but not under a depth-5 one", () => {
  const t = targets(5);
  expect(t[7]).toBeNull(); // 4 + 1 = 5
  expect(t[8]).toBe("too-deep"); // 5 + 1 = 6
});

describe("moving a Category up or down among its siblings", () => {
  it("returns the new order of its sibling group, whatever the depth", () => {
    expect(siblingReorder(all, 3, -1)).toEqual({ parent_id: 1, ids: [3, 4] });
    expect(siblingReorder(all, 4, 1)).toEqual({ parent_id: 1, ids: [3, 4] });
    expect(siblingReorder(all, 1, -1)).toEqual({ parent_id: null, ids: [2, 1, 5] });
  });

  it("does nothing past either end or for an only child", () => {
    expect(siblingReorder(all, 4, -1)).toBeNull();
    expect(siblingReorder(all, 3, 1)).toBeNull();
    expect(siblingReorder(all, 8, 1)).toBeNull();
    expect(siblingReorder(all, 99, 1)).toBeNull();
  });
});
