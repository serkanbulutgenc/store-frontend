import { describe, expect, it } from "vitest";
import {
  addItem,
  categorySubtreeDepth,
  cutOffNote,
  type DropKind,
  indentTarget,
  isDimmed,
  isDirty,
  type MenuItemRow,
  moveItem,
  notShownText,
  outdentTarget,
  planMove,
  refusalText,
  removeItem,
  toBody,
  updateItem,
} from "./tree";

const row = (over: Partial<MenuItemRow> = {}): MenuItemRow => ({
  target_type: "group",
  category_id: null,
  product_id: null,
  brand_id: null,
  collection_id: null,
  campaign_page_id: null,
  include_subcategories: false,
  legal_page: null,
  builtin: null,
  url: null,
  label: "",
  is_hidden: false,
  target_label: "",
  link: null,
  not_shown_reason: null,
  children: [],
  ...over,
});

describe("toBody", () => {
  it("sends a Campaign page item's id", () => {
    const [body] = toBody([row({ target_type: "campaign_page", campaign_page_id: 7 })]);
    expect(body).toMatchObject({ target_type: "campaign_page", campaign_page_id: 7 });
  });

  it("sends a Collection item's id", () => {
    const [body] = toBody([row({ target_type: "collection", collection_id: 4 })]);
    expect(body).toMatchObject({ target_type: "collection", collection_id: 4 });
  });

  it("sends only what the API takes: no resolved label, link or reason, order and nesting kept", () => {
    const saved = [
      row({
        target_type: "category",
        category_id: 7,
        include_subcategories: true,
        label: "Mutfak",
        target_label: "Mutfak ve Yemek",
        link: "/kategori/mutfak",
        not_shown_reason: "hidden",
        is_hidden: true,
        children: [
          row({ target_type: "brand", brand_id: 3, target_label: "Acme", link: "/marka/acme" }),
        ],
      }),
      row({ target_type: "url", url: "https://example.com", label: "Blog" }),
    ];
    expect(toBody(saved)).toEqual([
      {
        target_type: "category",
        category_id: 7,
        product_id: null,
        brand_id: null,
        collection_id: null,
        campaign_page_id: null,
        include_subcategories: true,
        legal_page: null,
        builtin: null,
        url: null,
        label: "Mutfak",
        is_hidden: true,
        children: [
          {
            target_type: "brand",
            category_id: null,
            product_id: null,
            brand_id: 3,
            collection_id: null,
            campaign_page_id: null,
            include_subcategories: false,
            legal_page: null,
            builtin: null,
            url: null,
            label: "",
            is_hidden: false,
            children: [],
          },
        ],
      },
      {
        target_type: "url",
        category_id: null,
        product_id: null,
        brand_id: null,
        collection_id: null,
        campaign_page_id: null,
        include_subcategories: false,
        legal_page: null,
        builtin: null,
        url: "https://example.com",
        label: "Blog",
        is_hidden: false,
        children: [],
      },
    ]);
  });
});

describe("addItem", () => {
  const a = row({
    target_type: "brand",
    brand_id: 1,
    children: [row({ target_type: "brand", brand_id: 2 })],
  });
  const b = row({ target_type: "brand", brand_id: 3 });
  const fresh = row({ target_type: "product", product_id: 9 });

  it("appends at the top level when the parent path is empty, leaving the original untouched", () => {
    const before = [a, b];
    const after = addItem(before, [], fresh);
    expect(after.map((i) => i.product_id ?? i.brand_id)).toEqual([1, 3, 9]);
    expect(before).toHaveLength(2);
  });

  it("appends as the last child of the item at the parent path", () => {
    const after = addItem([a, b], [0], fresh);
    expect(after[0]?.children.map((i) => i.product_id ?? i.brand_id)).toEqual([2, 9]);
    expect(after[1]).toBe(b);
  });

  it("reaches a grandchild", () => {
    const after = addItem([a, b], [0, 0], fresh);
    expect(after[0]?.children[0]?.children.map((i) => i.product_id)).toEqual([9]);
  });
});

describe("removeItem and updateItem", () => {
  const tree = () => [
    row({
      target_type: "brand",
      brand_id: 1,
      children: [
        row({ target_type: "brand", brand_id: 2 }),
        row({ target_type: "brand", brand_id: 4 }),
      ],
    }),
    row({ target_type: "brand", brand_id: 3 }),
  ];

  it("removes an item together with everything under it", () => {
    expect(removeItem(tree(), [0]).map((i) => i.brand_id)).toEqual([3]);
  });

  it("removes a nested item and keeps its siblings in order", () => {
    const after = removeItem(tree(), [0, 0]);
    expect(after[0]?.children.map((i) => i.brand_id)).toEqual([4]);
    expect(after).toHaveLength(2);
  });

  it("edits an item's label without touching the rest, nor the original", () => {
    const before = tree();
    const after = updateItem(before, [0, 1], { label: "Yeni ad" });
    expect(after[0]?.children[1]).toMatchObject({ brand_id: 4, label: "Yeni ad" });
    expect(after[0]?.children[0]).toBe(before[0]?.children[0]);
    expect(before[0]?.children[1]?.label).toBe("");
  });

  it("hides and shows an item", () => {
    const hidden = updateItem(tree(), [1], { is_hidden: true });
    expect(hidden[1]?.is_hidden).toBe(true);
    expect(updateItem(hidden, [1], { is_hidden: false })[1]?.is_hidden).toBe(false);
  });
});

describe("isDimmed", () => {
  const tree = [
    row({
      label: "Grup",
      is_hidden: true,
      children: [
        row({
          target_type: "brand",
          brand_id: 1,
          children: [row({ target_type: "brand", brand_id: 2 })],
        }),
      ],
    }),
    row({
      target_type: "brand",
      brand_id: 3,
      children: [row({ target_type: "brand", brand_id: 4 })],
    }),
  ];

  it("dims an item that is hidden itself", () => {
    expect(isDimmed(tree, [0])).toBe(true);
  });

  it("dims everything under a hidden group heading, at any depth", () => {
    expect(isDimmed(tree, [0, 0])).toBe(true);
    expect(isDimmed(tree, [0, 0, 0])).toBe(true);
  });

  it("leaves items under a shown parent alone", () => {
    expect(isDimmed(tree, [1])).toBe(false);
    expect(isDimmed(tree, [1, 0])).toBe(false);
  });
});

describe("notShownText", () => {
  it("says nothing for an item that is shown", () => {
    expect(notShownText(null)).toBeNull();
  });

  it("gives each reason its own plain wording", () => {
    const reasons = ["hidden", "parent_not_shown", "target_not_public", "target_missing"] as const;
    const texts = reasons.map((r) => notShownText(r));
    expect(texts.every((t) => typeof t === "string" && t.length > 0)).toBe(true);
    expect(new Set(texts).size).toBe(4);
    expect(notShownText("target_not_public")).toBe(
      "Hedefi herkese açık değil (gizli, taslak, arşivde, yayında değil ya da görünür ürünü yok); mağazada görünmez.",
    );
  });
});

describe("isDirty", () => {
  const saved = [
    row({
      target_type: "brand",
      brand_id: 1,
      target_label: "Acme",
      children: [row({ label: "Alt" })],
    }),
  ];

  it("is clean when nothing the Owner can change differs, even if resolved labels do", () => {
    expect(isDirty(saved, saved)).toBe(false);
    expect(
      isDirty(
        saved,
        saved.map((i) => ({ ...i, target_label: "Acme Ltd", link: "/x" })),
      ),
    ).toBe(false);
  });

  it("is dirty after an edit, and clean again once it is put back", () => {
    const edited = updateItem(saved, [0], { is_hidden: true });
    expect(isDirty(saved, edited)).toBe(true);
    expect(isDirty(saved, updateItem(edited, [0], { is_hidden: false }))).toBe(false);
  });

  it("is dirty after adding, removing or reordering", () => {
    expect(isDirty(saved, addItem(saved, [], row()))).toBe(true);
    expect(isDirty(saved, removeItem(saved, [0, 0]))).toBe(true);
    const two = [...saved, row({ label: "B" })];
    expect(isDirty(two, [...two].reverse())).toBe(true);
  });
});

describe("cutOffNote", () => {
  it("says nothing when the Category's subtree fits under the Menu's depth limit", () => {
    // Header limit 3; item at level 1 leaves 2 levels for subcategories.
    expect(cutOffNote({ depth: 1, limit: 3, subtreeDepth: 2 })).toBeNull();
    expect(cutOffNote({ depth: 3, limit: 3, subtreeDepth: 0 })).toBeNull();
  });

  it("names how many levels are shown when the subtree is deeper", () => {
    expect(cutOffNote({ depth: 1, limit: 3, subtreeDepth: 3 })).toBe(
      "Alt kategorilerin yalnızca 2 seviyesi gösterilir; daha derin kategoriler menü sınırı nedeniyle dışarıda kalır.",
    );
  });

  it("says no subcategory shows when the item is already at the limit", () => {
    expect(cutOffNote({ depth: 3, limit: 3, subtreeDepth: 1 })).toBe(
      "Bu seviye menü sınırında; alt kategoriler gösterilmez.",
    );
  });
});

describe("categorySubtreeDepth", () => {
  // 1 > 2 > 3 > 4, and 1 > 5; 6 is alone.
  const categories = [
    { id: 1, parent_id: null },
    { id: 2, parent_id: 1 },
    { id: 3, parent_id: 2 },
    { id: 4, parent_id: 3 },
    { id: 5, parent_id: 1 },
    { id: 6, parent_id: null },
  ];

  it("counts the levels of subcategories below a Category", () => {
    expect(categorySubtreeDepth(categories, 1)).toBe(3);
    expect(categorySubtreeDepth(categories, 2)).toBe(2);
    expect(categorySubtreeDepth(categories, 5)).toBe(0);
    expect(categorySubtreeDepth(categories, 6)).toBe(0);
  });

  it("is 0 for a Category that is not in the list", () => {
    expect(categorySubtreeDepth(categories, 99)).toBe(0);
  });
});

describe("moveItem", () => {
  const brands = (items: MenuItemRow[]) => items.map((i) => i.brand_id);
  const tree = () => [
    row({
      target_type: "brand",
      brand_id: 1,
      children: [
        row({ target_type: "brand", brand_id: 2 }),
        row({ target_type: "brand", brand_id: 3 }),
        row({ target_type: "brand", brand_id: 4 }),
      ],
    }),
    row({ target_type: "brand", brand_id: 5 }),
  ];

  it("moves an item one place up or down among its siblings", () => {
    expect(brands(moveItem(tree(), [1], "up"))).toEqual([5, 1]);
    expect(brands(moveItem(tree(), [0], "down"))).toEqual([5, 1]);
    expect(brands(moveItem(tree(), [0, 1], "up")[0]?.children ?? [])).toEqual([3, 2, 4]);
    expect(brands(moveItem(tree(), [0, 1], "down")[0]?.children ?? [])).toEqual([2, 4, 3]);
  });

  it("takes the item's children along", () => {
    const after = moveItem(tree(), [0], "down");
    expect(brands(after[1]?.children ?? [])).toEqual([2, 3, 4]);
  });

  it("does nothing at the first or last place", () => {
    const before = tree();
    expect(moveItem(before, [0], "up")).toEqual(before);
    expect(moveItem(before, [1], "down")).toEqual(before);
    expect(moveItem(before, [0, 2], "down")).toEqual(before);
  });

  it("leaves the original alone and counts as a change", () => {
    const before = tree();
    const after = moveItem(before, [0], "down");
    expect(brands(before)).toEqual([1, 5]);
    expect(isDirty(before, after)).toBe(true);
  });
});

describe("planMove", () => {
  const leaf = (label: string, children: MenuItemRow[] = []) => row({ label, children });
  const labels = (items: MenuItemRow[]): unknown[] =>
    items.map((i) => (i.children.length ? [i.label, labels(i.children)] : i.label));
  const tree = () => [
    leaf("a"),
    leaf("b", [leaf("b1"), leaf("b2")]),
    leaf("c", [leaf("c1", [leaf("c11")])]),
    leaf("d"),
  ];
  const moved = (from: number[], kind: DropKind, path: number[], limit = 4) => {
    const r = planMove(tree(), from, { kind, path }, limit);
    return r.ok ? labels(r.items) : r.reason;
  };

  it("reorders within a level, before and after", () => {
    expect(moved([3], "before", [0])).toEqual([
      "d",
      "a",
      ["b", ["b1", "b2"]],
      ["c", [["c1", ["c11"]]]],
    ]);
    expect(moved([0], "after", [1])).toEqual([
      ["b", ["b1", "b2"]],
      "a",
      ["c", [["c1", ["c11"]]]],
      "d",
    ]);
  });

  it("allows for the removal shifting later siblings, also under a parent", () => {
    // a is before b: moving a inside b's second child's place must hit the right item.
    expect(moved([0], "inside", [1])).toEqual([
      ["b", ["b1", "b2", "a"]],
      ["c", [["c1", ["c11"]]]],
      "d",
    ]);
    expect(moved([1, 0], "after", [1, 1])).toEqual([
      "a",
      ["b", ["b2", "b1"]],
      ["c", [["c1", ["c11"]]]],
      "d",
    ]);
  });

  it("re-parents into and out of a group, carrying children", () => {
    expect(moved([2], "inside", [1])).toEqual([
      "a",
      ["b", ["b1", "b2", ["c", [["c1", ["c11"]]]]]],
      "d",
    ]);
    expect(moved([1, 1], "before", [0])).toEqual([
      "b2",
      "a",
      ["b", ["b1"]],
      ["c", [["c1", ["c11"]]]],
      "d",
    ]);
  });

  it("refuses a move onto itself or into its own subtree", () => {
    expect(moved([1], "inside", [1])).toBe("self");
    expect(moved([2], "inside", [2, 0])).toBe("descendant");
    expect(moved([2], "after", [2, 0, 0])).toBe("descendant");
  });

  it("refuses a move past the depth limit, counting the item's own children", () => {
    // c has two levels below it (c, c1, c11 = height 3): inside b (level 1) needs 4 levels.
    expect(moved([2], "inside", [1], 3)).toBe("too-deep");
    expect(moved([2], "inside", [1], 4)).not.toBe("too-deep");
    // A leaf fits at level 3 under a level-2 parent, but not inside a level-3 item.
    expect(moved([0], "inside", [2, 0], 3)).not.toBe("too-deep");
    expect(moved([0], "inside", [2, 0, 0], 3)).toBe("too-deep");
    expect(moved([0], "inside", [1], 1)).toBe("too-deep");
  });

  it("leaves the original tree untouched", () => {
    const t = tree();
    planMove(t, [0], { kind: "inside", path: [1] }, 3);
    expect(labels(t)).toEqual(labels(tree()));
  });
});

describe("indent and outdent", () => {
  it("indent goes into the sibling above, nothing for the first", () => {
    expect(indentTarget([2])).toEqual({ kind: "inside", path: [1] });
    expect(indentTarget([1, 3])).toEqual({ kind: "inside", path: [1, 2] });
    expect(indentTarget([0])).toBeNull();
  });
  it("outdent goes right after the parent, nothing at the top", () => {
    expect(outdentTarget([1, 2])).toEqual({ kind: "after", path: [1] });
    expect(outdentTarget([1])).toBeNull();
  });
});

describe("refusalText", () => {
  it("names the limit for a too-deep move", () => {
    expect(refusalText("too-deep", 2)).toContain("2 seviye");
  });
});
