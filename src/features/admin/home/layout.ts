import { arrayMove } from "@dnd-kit/sortable";

/** Pure edits of an Ana sayfa layout: the ordered keys of the Widgets that are on, and which of
 * them are folded to their header. */

/** Turn a Widget on (added at the end) or off. A Widget already in its state is left alone. */
export function setWidget(layout: string[], key: string, on: boolean): string[] {
  const has = layout.includes(key);
  if (on) return has ? layout : [...layout, key];
  return has ? layout.filter((k) => k !== key) : layout;
}

/** Move a Widget one place up (-1) or down (1); at either end it stays put. */
export function moveWidget(layout: string[], key: string, by: -1 | 1): string[] {
  const from = layout.indexOf(key);
  const to = from + by;
  if (from < 0 || to < 0 || to >= layout.length) return layout;
  return arrayMove(layout, from, to);
}

/** Drop one Widget where another sits, as a drag does. Unknown keys leave the layout alone. */
export function dropWidget(layout: string[], key: string, onto: string): string[] {
  const from = layout.indexOf(key);
  const to = layout.indexOf(onto);
  if (from < 0 || to < 0 || from === to) return layout;
  return arrayMove(layout, from, to);
}

/** Fold a Widget down to its header, or open it again. */
export function setFolded(collapsed: string[], key: string, folded: boolean): string[] {
  const has = collapsed.includes(key);
  if (folded) return has ? collapsed : [...collapsed, key];
  return has ? collapsed.filter((k) => k !== key) : collapsed;
}

/** The edit list: Widgets that are on first, in order, then the rest, as `available` lists them. */
export function editOrder(layout: string[], available: string[]): string[] {
  return [...layout, ...available.filter((k) => !layout.includes(k))];
}
