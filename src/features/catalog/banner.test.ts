import { describe, expect, it } from "vitest";
import { bannerLink } from "./banner";

describe("bannerLink", () => {
  it("opens a path on this site in place", () => {
    expect(bannerLink("/kategori/elbise")).toEqual({ href: "/kategori/elbise", external: false });
  });
  it("opens a full address in a new tab", () => {
    expect(bannerLink("https://example.com/x")).toEqual({
      href: "https://example.com/x",
      external: true,
    });
    expect(bannerLink("http://example.com")?.external).toBe(true);
  });
  it("is not a link when empty, or for anything the API would not have accepted", () => {
    expect(bannerLink("")).toBeNull();
    expect(bannerLink("   ")).toBeNull();
    expect(bannerLink("//evil.example")).toBeNull();
    expect(bannerLink("javascript:alert(1)")).toBeNull();
  });
});
