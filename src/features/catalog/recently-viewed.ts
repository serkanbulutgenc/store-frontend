/**
 * Recently viewed: the Product slugs a Shopper last opened, kept only in this browser's
 * local storage. No server log, no sync between devices. Storage can be missing or blocked
 * (private mode), so every path degrades to "no history" and never throws.
 */
const KEY = "recently-viewed";
export const MAX_VIEWED = 12;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readViewed(store: Store | null = defaultStore()): string[] {
  try {
    const value: unknown = JSON.parse(store?.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Puts `slug` first, drops an earlier copy of it and keeps the 12 most recent. */
export function recordViewed(slug: string, store: Store | null = defaultStore()): void {
  try {
    const rest = readViewed(store).filter((s) => s !== slug);
    store?.setItem(KEY, JSON.stringify([slug, ...rest].slice(0, MAX_VIEWED)));
  } catch {
    // Storage unavailable: the list simply stays empty.
  }
}

export function clearViewed(store: Store | null = defaultStore()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Nothing was stored, so there is nothing to clear.
  }
}
