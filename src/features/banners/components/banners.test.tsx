import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Announcement, PictureBanner } from "../queries";
import { AnnouncementBar } from "./announcement-bar";
import { BannerHero } from "./banner-hero";
import { BannerStrip } from "./picture-banner";

const banner = (id: number, over: Partial<PictureBanner> = {}): PictureBanner => ({
  id,
  alt: `Afiş ${id}`,
  link: "/kategori/yaz",
  image: [
    { width: 800, url: `/media/b${id}-800.webp` },
    { width: 1600, url: `/media/b${id}-1600.webp` },
  ],
  mobile_image: null,
  ...over,
});

const note = (id: number, over: Partial<Announcement> = {}): Announcement => ({
  id,
  message: `Mesaj ${id}`,
  link: "",
  ...over,
});

describe("AnnouncementBar", () => {
  it("renders nothing for an empty slot", () => {
    expect(renderToStaticMarkup(<AnnouncementBar messages={[]} />)).toBe("");
  });

  it("shows one message at a time, with controls only when several rotate", () => {
    const one = renderToStaticMarkup(<AnnouncementBar messages={[note(1)]} />);
    expect(one).toContain("Mesaj 1");
    expect(one).not.toContain("Sonraki duyuru");

    const many = renderToStaticMarkup(<AnnouncementBar messages={[note(1), note(2)]} />);
    expect(many).toContain("Mesaj 1");
    expect(many).not.toContain("Mesaj 2");
    expect(many).toContain("Sonraki duyuru");
    expect(many).toContain("Duyuruları duraklat");
  });

  it("links a message that has an address", () => {
    const out = renderToStaticMarkup(
      <AnnouncementBar messages={[note(1, { link: "https://example.com/x" })]} />,
    );
    expect(out).toContain('href="https://example.com/x"');
    expect(out).toContain('rel="noopener noreferrer"');
  });
});

describe("BannerStrip", () => {
  it("renders nothing for an empty slot", () => {
    expect(renderToStaticMarkup(<BannerStrip banners={[]} label="Kampanya" />)).toBe("");
  });

  it("reserves its box with an aspect ratio and keeps the alt text and link", () => {
    const out = renderToStaticMarkup(<BannerStrip banners={[banner(1)]} label="Kampanya" />);
    expect(out).toContain("aspect-[3/2]");
    expect(out).toContain("md:aspect-[16/4]");
    expect(out).toContain('alt="Afiş 1"');
    expect(out).toContain('href="/kategori/yaz"');
  });

  it("serves the mobile image to phones only when there is one", () => {
    const without = renderToStaticMarkup(<BannerStrip banners={[banner(1)]} label="K" />);
    expect(without).not.toContain("<source");

    const withMobile = renderToStaticMarkup(
      <BannerStrip
        banners={[banner(1, { mobile_image: [{ width: 600, url: "/media/m1-600.webp" }] })]}
        label="K"
      />,
    );
    expect(withMobile).toMatch(/<source media="\(max-width: 767px\)"[^>]*\/media\/m1-600\.webp/);
  });

  it("does not link a banner without an address", () => {
    const out = renderToStaticMarkup(<BannerStrip banners={[banner(1, { link: "" })]} label="K" />);
    expect(out).not.toContain("<a ");
  });
});

describe("BannerHero", () => {
  it("renders nothing for an empty slot", () => {
    expect(renderToStaticMarkup(<BannerHero banners={[]} />)).toBe("");
  });

  it("is a labelled carousel; the first image is eager and the rest lazy", () => {
    const out = renderToStaticMarkup(<BannerHero banners={[banner(1), banner(2)]} />);
    expect(out).toContain('aria-roledescription="carousel"');
    expect(out).toContain("Kaydırmayı duraklat");
    expect(out).toContain("Sonraki");
    expect(out).toMatch(/loading="eager"[^>]*>|alt="Afiş 1"[^>]*loading="eager"/);
    expect(out).toContain('loading="lazy"');
  });

  it("has no controls for a single image", () => {
    const out = renderToStaticMarkup(<BannerHero banners={[banner(1)]} />);
    expect(out).not.toContain("Sonraki");
    expect(out).not.toContain("duraklat");
  });
});
