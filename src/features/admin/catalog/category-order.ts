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

export type DropTarget = { kind: "before" | "after" | "inside"; id: number };

export type DropPlan = {
  /** Sent first when the Category changes parent. */
  move: { id: number; parent_id: number | null } | null;
  /** Sent last: the new order of the parent's children. */
  reorder: { parent_id: number | null; ids: number[] };
};

/** The requests a drop stands for, or null when it is not allowed. */
export function planDrop(
  categories: CategoryOut[],
  activeId: number,
  target: DropTarget,
): DropPlan | null {
  const active = categories.find((c) => c.id === activeId);
  const over = categories.find((c) => c.id === target.id);
  if (!active || !over || over.id === activeId) return null;
  const parentId = target.kind === "inside" ? over.id : over.parent_id;
  if (parentId !== null && parentId !== active.parent_id) {
    const parent = moveTargets(categories, activeId).find((t) => t.category.id === parentId);
    if (!parent || parent.blocked) return null;
  }
  const group = categories
    .filter((c) => c.parent_id === parentId && c.id !== activeId)
    .sort(byOrderThenName);
  const at =
    target.kind === "inside"
      ? group.length
      : group.findIndex((c) => c.id === over.id) + (target.kind === "after" ? 1 : 0);
  const ids = group.map((c) => c.id);
  ids.splice(at, 0, activeId);
  const move = parentId === active.parent_id ? null : { id: activeId, parent_id: parentId };
  return { move, reorder: { parent_id: parentId, ids } };
}

/** Whether the row `overId` accepts the dragged Category in any position. */
export function isDroppable(categories: CategoryOut[], activeId: number, overId: number): boolean {
  return (["before", "after", "inside"] as const).some(
    (kind) => planDrop(categories, activeId, { kind, id: overId }) !== null,
  );
}
