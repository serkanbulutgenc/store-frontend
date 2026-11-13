import { moveItem } from "../photos/rules";
import type { CategoryOut } from "./queries";

export type CategoryGroup = {
  parent: CategoryOut | null;
  /** Siblings in Storefront order: sort order, then name. */
  items: CategoryOut[];
};

const byOrderThenName = (a: CategoryOut, b: CategoryOut) =>
  a.sort_order - b.sort_order || a.name.localeCompare(b.name, "tr");

/** The top level, then each top-level Category's children, each in Storefront order. */
export function categoryGroups(categories: CategoryOut[]): CategoryGroup[] {
  const roots = categories.filter((c) => c.parent_id == null).sort(byOrderThenName);
  const groups: CategoryGroup[] = [{ parent: null, items: roots }];
  for (const root of roots) {
    const items = categories.filter((c) => c.parent_id === root.id).sort(byOrderThenName);
    if (items.length > 0) groups.push({ parent: root, items });
  }
  return groups;
}

/** The ids of a group after moving one item to a new position. */
export function reorderedIds(items: CategoryOut[], from: number, to: number): number[] {
  return moveItem(
    items.map((c) => c.id),
    from,
    to,
  );
}

/** Hidden on its own or through a hidden parent, as the Storefront sees it. */
export function isEffectivelyHidden(c: CategoryOut, all: CategoryOut[]): boolean {
  if (c.is_hidden) return true;
  const parent = c.parent_id == null ? undefined : all.find((p) => p.id === c.parent_id);
  return parent?.is_hidden ?? false;
}
