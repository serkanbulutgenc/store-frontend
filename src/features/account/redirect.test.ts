import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("keeps a local path", () => expect(safeRedirect("/hesap/adresler")).toBe("/hesap/adresler"));
  it("falls back when empty", () => expect(safeRedirect(undefined)).toBe("/hesap"));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "hesap"])("rejects %s", (v) =>
    expect(safeRedirect(v)).toBe("/hesap"),
  );
});
