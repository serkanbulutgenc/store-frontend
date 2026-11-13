/** A guest who hearts a Product is sent to sign in; the heart is applied when they return. */
const KEY = "favorites:pending";
const MAX_AGE_MS = 30 * 60_000;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): Store | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function setPendingFavorite(
  productId: number,
  now = Date.now(),
  store: Store | null = defaultStore(),
): void {
  try {
    store?.setItem(KEY, JSON.stringify({ productId, at: now }));
  } catch {
    // Storage unavailable: the guest just has to tap the heart again after signing in.
  }
}

/** The remembered Product id, once: reading clears it. Stale or malformed entries give null. */
export function takePendingFavorite(
  now = Date.now(),
  store: Store | null = defaultStore(),
): number | null {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return null;
    store?.removeItem(KEY);
    const value = JSON.parse(raw) as { productId?: unknown; at?: unknown };
    if (typeof value.productId !== "number" || typeof value.at !== "number") return null;
    return now - value.at <= MAX_AGE_MS ? value.productId : null;
  } catch {
    return null;
  }
}
