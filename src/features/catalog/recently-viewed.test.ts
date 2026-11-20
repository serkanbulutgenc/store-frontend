import { describe, expect, it } from "vitest";
import { clearViewed, readViewed, recordViewed } from "./recently-viewed";

/** An in-memory stand-in for localStorage. */
function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("recently viewed storage", () => {
  it("keeps the most recent slug first and each slug once", () => {
    const store = memory();

    recordViewed("a", store);
    recordViewed("b", store);
    recordViewed("c", store);
    recordViewed("a", store);

    expect(readViewed(store)).toEqual(["a", "c", "b"]);
  });

  it("keeps only the 12 most recent", () => {
    const store = memory();

    for (let n = 1; n <= 14; n++) recordViewed(`urun-${n}`, store);

    expect(readViewed(store)).toEqual(Array.from({ length: 12 }, (_, i) => `urun-${14 - i}`));
  });

  it("clears the list", () => {
    const store = memory();
    recordViewed("a", store);

    clearViewed(store);

    expect(readViewed(store)).toEqual([]);
  });

  it("reads an unreadable or malformed entry as an empty list", () => {
    for (const junk of ["{oops", '"a"', '{"a":1}', "null"])
      expect(readViewed(memory({ "recently-viewed": junk }))).toEqual([]);
  });

  it("keeps only the string slugs of a half-valid entry", () => {
    expect(readViewed(memory({ "recently-viewed": '["a",3,null,"b"]' }))).toEqual(["a", "b"]);
  });

  it("never throws when storage is blocked, as in private mode", () => {
    const blocked = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
      removeItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    };

    expect(readViewed(blocked)).toEqual([]);
    expect(() => recordViewed("a", blocked)).not.toThrow();
    expect(() => clearViewed(blocked)).not.toThrow();
  });
});
