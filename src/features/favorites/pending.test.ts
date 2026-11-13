import { describe, expect, it } from "vitest";
import { setPendingFavorite, takePendingFavorite } from "./pending";

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("pending favorite", () => {
  it("is returned once, then gone", () => {
    const store = memory();
    setPendingFavorite(7, 1000, store);
    expect(takePendingFavorite(2000, store)).toBe(7);
    expect(takePendingFavorite(2000, store)).toBeNull();
  });

  it("expires after half an hour", () => {
    const store = memory();
    setPendingFavorite(7, 0, store);
    expect(takePendingFavorite(31 * 60_000, store)).toBeNull();
  });

  it("ignores malformed entries", () => {
    const store = memory();
    store.setItem("favorites:pending", "{nope");
    expect(takePendingFavorite(0, store)).toBeNull();
    store.setItem("favorites:pending", JSON.stringify({ productId: "x", at: 0 }));
    expect(takePendingFavorite(0, store)).toBeNull();
  });

  it("copes with no storage", () => {
    expect(() => setPendingFavorite(1, 0, null)).not.toThrow();
    expect(takePendingFavorite(0, null)).toBeNull();
  });
});
