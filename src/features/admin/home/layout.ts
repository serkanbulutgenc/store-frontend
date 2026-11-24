/** Pure edits of an Ana sayfa layout: the ordered keys of the Widgets that are on. */

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
  const next = [...layout];
  next.splice(from, 1);
  next.splice(to, 0, key);
  return next;
}

/** The edit list: Widgets that are on in order, then the ones that are off, as `available` lists them. */
export function editOrder(layout: string[], available: string[]): string[] {
  return [...layout, ...available.filter((k) => !layout.includes(k))];
}
