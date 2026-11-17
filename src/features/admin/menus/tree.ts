import type { components } from "../../../../api/specs/openapi-admin";

export type MenuItemRow = components["schemas"]["MenuItemOut"];
export type MenuItemBody = components["schemas"]["MenuItemIn"];

/** A saved item as the save request wants it: the Owner's own fields only. */
export function toBody(items: MenuItemRow[]): MenuItemBody[] {
  return items.map((i) => ({
    target_type: i.target_type,
    category_id: i.category_id,
    product_id: i.product_id,
    brand_id: i.brand_id,
    collection_id: i.collection_id,
    include_subcategories: i.include_subcategories,
    legal_page: i.legal_page,
    builtin: i.builtin,
    url: i.url,
    label: i.label,
    is_hidden: i.is_hidden,
    children: toBody(i.children),
  }));
}

/** Where an item sits: the index at each level, from the top. `[]` is the Menu itself. */
export type ItemPath = number[];

/** Rewrite the list of items at `parent`, copying the way down so the original stays as it was. */
function atParent(
  items: MenuItemRow[],
  parent: ItemPath,
  change: (siblings: MenuItemRow[]) => MenuItemRow[],
): MenuItemRow[] {
  const [head, ...rest] = parent;
  if (head === undefined) return change(items);
  return items.map((item, i) =>
    i === head ? { ...item, children: atParent(item.children, rest, change) } : item,
  );
}

/** Add `item` as the last child of the item at `parent` (the Menu's top level for `[]`). */
export function addItem(items: MenuItemRow[], parent: ItemPath, item: MenuItemRow): MenuItemRow[] {
  return atParent(items, parent, (siblings) => [...siblings, item]);
}

/** Remove the item at `path` with its children. */
export function removeItem(items: MenuItemRow[], path: ItemPath): MenuItemRow[] {
  const parent = path.slice(0, -1);
  const index = path[path.length - 1];
  return atParent(items, parent, (siblings) => siblings.filter((_, i) => i !== index));
}

/** Change fields of the item at `path`; its children stay as they are. */
export function updateItem(
  items: MenuItemRow[],
  path: ItemPath,
  patch: Partial<Omit<MenuItemRow, "children">>,
): MenuItemRow[] {
  const parent = path.slice(0, -1);
  const index = path[path.length - 1];
  return atParent(items, parent, (siblings) =>
    siblings.map((item, i) => (i === index ? { ...item, ...patch } : item)),
  );
}

/** Hidden itself, or under a hidden parent: the Storefront leaves it out either way. */
export function isDimmed(items: MenuItemRow[], path: ItemPath): boolean {
  let level = items;
  for (const index of path) {
    const item = level[index];
    if (!item) return false;
    if (item.is_hidden) return true;
    level = item.children;
  }
  return false;
}

export type NotShownReason = NonNullable<MenuItemRow["not_shown_reason"]>;

const NOT_SHOWN_TEXT: Record<NotShownReason, string> = {
  hidden: "Gizlendi; mağazada görünmez.",
  parent_not_shown: "Üstündeki öğe görünmediği için mağazada görünmez.",
  target_not_public:
    "Hedefi herkese açık değil (gizli, taslak, arşivde, yayında değil ya da görünür ürünü yok); mağazada görünmez.",
  target_missing: "Hedefi bulunamadı; mağazada görünmez.",
};

/** Why the Storefront leaves an item out, in words for the Owner; null when it shows. */
export function notShownText(reason: MenuItemRow["not_shown_reason"] | undefined): string | null {
  return reason ? NOT_SHOWN_TEXT[reason] : null;
}

/** Whether the Owner has changed anything: compares what a save would send. */
export function isDirty(saved: MenuItemRow[], draft: MenuItemRow[]): boolean {
  return JSON.stringify(toBody(saved)) !== JSON.stringify(toBody(draft));
}

/**
 * The note for a Category item that includes its subcategories: those stop at the Menu's depth
 * limit. `depth` is the item's level (1 is the top), `subtreeDepth` how many levels of
 * subcategories the Category has. Null when none are cut off.
 */
export function cutOffNote(args: {
  depth: number;
  limit: number;
  subtreeDepth: number;
}): string | null {
  const room = args.limit - args.depth;
  if (args.subtreeDepth <= room) return null;
  if (room <= 0) return "Bu seviye menü sınırında; alt kategoriler gösterilmez.";
  return `Alt kategorilerin yalnızca ${room} seviyesi gösterilir; daha derin kategoriler menü sınırı nedeniyle dışarıda kalır.`;
}

/** How many levels of subcategories lie below a Category (0 for a leaf or an unknown id). */
export function categorySubtreeDepth(
  categories: { id: number; parent_id: number | null }[],
  id: number,
): number {
  const below = categories.filter((c) => c.parent_id === id);
  return below.length === 0
    ? 0
    : 1 + Math.max(...below.map((c) => categorySubtreeDepth(categories, c.id)));
}

/** Move the item at `path` one place up or down among its siblings; the ends stay put. */
export function moveItem(
  items: MenuItemRow[],
  path: ItemPath,
  direction: "up" | "down",
): MenuItemRow[] {
  const index = path[path.length - 1] ?? 0;
  const target = direction === "up" ? index - 1 : index + 1;
  return atParent(items, path.slice(0, -1), (siblings) => {
    if (target < 0 || target >= siblings.length) return siblings;
    const next = [...siblings];
    [next[index], next[target]] = [next[target] as MenuItemRow, next[index] as MenuItemRow];
    return next;
  });
}
