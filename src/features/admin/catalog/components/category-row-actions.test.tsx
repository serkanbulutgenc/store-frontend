import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TreeRow } from "../category-order";
import type { CategoryOut } from "../queries";
import { CategoryRowActions } from "./category-row-actions";

const category = { id: 3, name: "Elbise", is_hidden: false } as CategoryOut;
const row = (over: Partial<TreeRow> = {}): TreeRow => ({
  category,
  depth: 2,
  parentId: 1,
  hasChildren: false,
  expanded: false,
  index: 1,
  siblings: 3,
  canAddChild: true,
  ...over,
});
const handlers = {
  onAddChild: vi.fn(),
  onEdit: vi.fn(),
  onToggleHidden: vi.fn(),
  onMove: vi.fn(),
  onDelete: vi.fn(),
  onUp: vi.fn(),
  onDown: vi.fn(),
};
const html = (props: { canManage: boolean; canRestructure: boolean; row?: TreeRow }) =>
  renderToString(
    <CategoryRowActions row={props.row ?? row()} busy={false} {...props} {...handlers} />,
  );

const DISABLED = 'disabled=""';

/** The opening tag of the button with this accessible name. */
const button = (markup: string, label: string) =>
  new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`).exec(markup)?.[0];

describe("who sees which row actions", () => {
  it("gives the Owner every action", () => {
    const out = html({ canManage: true, canRestructure: true });
    for (const label of [
      "Elbise alt kategori ekle",
      "Elbise düzenle",
      "Elbise gizle",
      "Elbise taşı",
      "Elbise sil",
      "Elbise yukarı taşı",
      "Elbise aşağı taşı",
    ])
      expect(button(out, label), label).toBeDefined();
  });

  it("keeps move and delete away from Staff, who can still edit, hide and reorder", () => {
    const out = html({ canManage: true, canRestructure: false });
    expect(button(out, "Elbise taşı")).toBeUndefined();
    expect(button(out, "Elbise sil")).toBeUndefined();
    for (const label of ["Elbise düzenle", "Elbise gizle", "Elbise yukarı taşı"])
      expect(button(out, label), label).toBeDefined();
  });

  it("only lets a viewer without manage rights look", () => {
    const out = html({ canManage: false, canRestructure: false });
    expect(button(out, "Elbise göster")).toBeDefined();
    for (const label of [
      "Elbise düzenle",
      "Elbise gizle",
      "Elbise alt kategori ekle",
      "Elbise yukarı taşı",
    ])
      expect(button(out, label), label).toBeUndefined();
  });
});

describe("row action limits", () => {
  it("disables add child at depth 5", () => {
    const out = html({
      canManage: true,
      canRestructure: true,
      row: row({ depth: 5, canAddChild: false }),
    });
    expect(button(out, "Elbise alt kategori ekle")).toContain(DISABLED);
  });

  it("disables up on the first sibling and down on the last", () => {
    const first = html({ canManage: true, canRestructure: true, row: row({ index: 0 }) });
    const last = html({ canManage: true, canRestructure: true, row: row({ index: 2 }) });
    expect(button(first, "Elbise yukarı taşı")).toContain(DISABLED);
    expect(button(first, "Elbise aşağı taşı")).not.toContain(DISABLED);
    expect(button(last, "Elbise aşağı taşı")).toContain(DISABLED);
  });

  it("offers no reorder buttons to an only child", () => {
    const out = html({
      canManage: true,
      canRestructure: true,
      row: row({ index: 0, siblings: 1 }),
    });
    expect(button(out, "Elbise yukarı taşı")).toBeUndefined();
  });

  it("offers to show a hidden Category again", () => {
    const hidden = { ...category, is_hidden: true } as CategoryOut;
    const out = html({ canManage: true, canRestructure: false, row: row({ category: hidden }) });
    expect(button(out, "Elbise göster")).toBeDefined();
    expect(button(out, "Elbise gizle")).toBeUndefined();
  });
});
