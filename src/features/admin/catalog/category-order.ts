import { moveItem } from "../photos/rules";
import type { CategoryOut } from "./queries";

const byOrderThenName = (a: CategoryOut, b: CategoryOut) =>
  a.sort_order - b.sort_order || a.name.localeCompare(b.name, "tr");

export type CategoryNode = { category: CategoryOut; children: CategoryNode[] };

/** The nested tree, every group of siblings in Storefront order. */
export function buildTree(categories: CategoryOut[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>(
    categories.map((category) => [category.id, { category, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.category.parent_id == null ? undefined : nodes.get(node.category.parent_id);
    (parent ? parent.children : roots).push(node);
  }
  const sort = (group: CategoryNode[]) => {
    group.sort((a, b) => byOrderThenName(a.category, b.category));
    for (const node of group) sort(node.children);
  };
  sort(roots);
  return roots;
}

/** Deepest level of the Category tree (CONTEXT.md). */
export const MAX_DEPTH = 5;

export type TreeRow = {
  category: CategoryOut;
  depth: number;
  parentId: number | null;
  hasChildren: boolean;
  expanded: boolean;
  /** Position among its siblings, for the up and down buttons. */
  index: number;
  siblings: number;
  canAddChild: boolean;
};

/** The rows to draw: a Category's children follow it only while it is expanded. */
export function visibleRows(tree: CategoryNode[], expanded: ReadonlySet<number>): TreeRow[] {
  const rows: TreeRow[] = [];
  const walk = (group: CategoryNode[], depth: number) => {
    group.forEach((node, index) => {
      const open = node.children.length > 0 && expanded.has(node.category.id);
      rows.push({
        category: node.category,
        depth,
        parentId: node.category.parent_id,
        hasChildren: node.children.length > 0,
        expanded: open,
        index,
        siblings: group.length,
        canAddChild: depth < MAX_DEPTH,
      });
      if (open) walk(node.children, depth + 1);
    });
  };
  walk(tree, 1);
  return rows;
}

/** Every Category that has children: what "expand all" opens. */
export function expandableIds(categories: CategoryOut[]): Set<number> {
  return new Set(categories.flatMap((c) => (c.parent_id == null ? [] : [c.parent_id])));
}

export type MoveBlock = "self" | "descendant" | "too-deep";

export type MoveTarget = {
  category: CategoryOut;
  depth: number;
  /** Why this parent cannot be chosen, or null when it can. */
  blocked: MoveBlock | null;
};

/** Every Category as a possible new parent for `id`, in tree order. Moving carries the
 * whole subtree, so a parent is blocked when the Category itself, one of its
 * descendants, or one that would put the subtree past `MAX_DEPTH`. "Top level" is
 * always a valid target and is not listed. */
export function moveTargets(categories: CategoryOut[], id: number): MoveTarget[] {
  const tree = buildTree(categories);
  const subtreeHeight = (node: CategoryNode): number =>
    1 + Math.max(0, ...node.children.map(subtreeHeight));
  const moving = findNode(tree, id);
  const height = moving ? subtreeHeight(moving) : 1;
  const inside = new Set<number>();
  const collect = (node: CategoryNode) => {
    for (const child of node.children) {
      inside.add(child.category.id);
      collect(child);
    }
  };
  if (moving) collect(moving);
  const out: MoveTarget[] = [];
  const walk = (group: CategoryNode[], depth: number) => {
    for (const node of group) {
      const cid = node.category.id;
      const blocked: MoveBlock | null =
        cid === id
          ? "self"
          : inside.has(cid)
            ? "descendant"
            : depth + height > MAX_DEPTH
              ? "too-deep"
              : null;
      out.push({ category: node.category, depth, blocked });
      walk(node.children, depth + 1);
    }
  };
  walk(tree, 1);
  return out;
}

function findNode(group: CategoryNode[], id: number): CategoryNode | undefined {
  for (const node of group) {
    if (node.category.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

/** The ids of a group after moving one item to a new position. */
export function reorderedIds(items: CategoryOut[], from: number, to: number): number[] {
  return moveItem(
    items.map((c) => c.id),
    from,
    to,
  );
}

/** The reorder request for moving `id` one place (-1 up, +1 down) among its siblings, or
 * null when it is already at that end. */
export function siblingReorder(
  categories: CategoryOut[],
  id: number,
  delta: -1 | 1,
): { parent_id: number | null; ids: number[] } | null {
  const moving = categories.find((c) => c.id === id);
  if (!moving) return null;
  const group = categories.filter((c) => c.parent_id === moving.parent_id).sort(byOrderThenName);
  const from = group.findIndex((c) => c.id === id);
  const to = from + delta;
  if (to < 0 || to >= group.length) return null;
  return { parent_id: moving.parent_id, ids: reorderedIds(group, from, to) };
}

/** Hidden on its own or through any ancestor, as the Storefront sees it. */
export function isEffectivelyHidden(c: CategoryOut, all: CategoryOut[]): boolean {
  const byId = new Map(all.map((x) => [x.id, x]));
  for (let node: CategoryOut | undefined = c; node; node = byId.get(node.parent_id ?? -1)) {
    if (node.is_hidden) return true;
  }
  return false;
}
