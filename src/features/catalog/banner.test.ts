import { describe, expect, it } from "vitest";
import { bannerLink, shownBanner } from "./banner";

const banner = (over: Partial<{ alt: string; image_url: string; link: string }> = {}) => ({
  alt: "Sonbahar",
  image_url: "https://cdn.example/banner.jpg",
  link: "",
  ...over,
});

describe("shownBanner", () => {
  it("shows a banner that has an image", () => {
    expect(shownBanner(banner())).toEqual(banner());
  });
  it("shows nothing when the setting is unset or has no image", () => {
    expect(shownBanner(null)).toBeNull();
    expect(shownBanner(undefined)).toBeNull();
    expect(shownBanner(banner({ image_url: "  " }))).toBeNull();
  });
});

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
