import type { VariantOut } from "./queries";

/** Colours present in a Product's Variants, in first-seen order (the grid's rows). */
export function gridColours(variants: VariantOut[]) {
  const seen = new Map<number, VariantOut["colour"]>();
  for (const v of variants) if (!seen.has(v.colour.id)) seen.set(v.colour.id, v.colour);
  return [...seen.values()];
}

/** Sizes present in the Variants: scheme order first, then any size no longer in the scheme. */
export function gridSizes(variants: VariantOut[], scheme: string[]) {
  const present = new Set(variants.map((v) => v.size));
  const known = scheme.filter((s) => present.has(s));
  return [...known, ...[...present].filter((s) => !scheme.includes(s))];
}

/** The API's bounds for one stock change and for opening stock. */
export const MAX_DELTA = 100000;
const WHOLE = /^\d+$/;

export function isWhole(text: string) {
  return WHOLE.test(text.trim());
}

/** A price as the API takes it: digits with exactly two decimals. */
export function isPrice(text: string) {
  return /^\d+\.\d{2}$/.test(text.trim());
}

/** Cell lookup keyed by colour and size; a missing combination has no cell. */
export function cellKey(colourId: number, size: string) {
  return `${colourId}|${size}`;
}

/** What the grid holds while editing: the typed text per Variant id (absent = untouched). */
export type GridDraft = Record<number, string>;

/**
 * The changed cells as stock deltas. Untouched, blank, unparseable and unchanged cells
 * are left out, so saving an unedited grid sends nothing.
 */
export function gridChanges(variants: VariantOut[], draft: GridDraft) {
  const cells: { variant_id: number; delta: number }[] = [];
  for (const v of variants) {
    const text = draft[v.id]?.trim();
    if (text === undefined || !isWhole(text)) continue;
    const delta = Number(text) - v.stock.on_hand;
    if (delta !== 0) cells.push({ variant_id: v.id, delta });
  }
  return cells;
}

/** Cells that are not a whole number, or whose change is beyond what one save allows. */
export function invalidCells(variants: VariantOut[], draft: GridDraft) {
  const onHand = new Map(variants.map((v) => [v.id, v.stock.on_hand]));
  return Object.entries(draft)
    .filter(([id, t]) => {
      if (!isWhole(t)) return true;
      return Math.abs(Number(t) - (onHand.get(Number(id)) ?? 0)) > MAX_DELTA;
    })
    .map(([id]) => Number(id));
}

/** Toggle `value` in a selection list, keeping first-chosen order. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

/** How many new Variants a selection would make (the rest already exist). */
export function missingCount(variants: VariantOut[], colourIds: number[], sizes: string[]) {
  const have = new Set(variants.map((v) => cellKey(v.colour.id, v.size)));
  let n = 0;
  for (const c of colourIds) for (const s of sizes) if (!have.has(cellKey(c, s))) n++;
  return n;
}
