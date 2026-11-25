import { describe, expect, it } from "vitest";
import type { PictureBanner } from "@/features/banners/queries";
import { renderInStorefront } from "@/features/catalog/components/render-in-storefront";
import type { ProductCard } from "@/features/catalog/queries";
import type { HomepageSection } from "../queries";
import { HomepageSections } from "./homepage-sections";

const card = (n: number, over: Partial<ProductCard> = {}): ProductCard => ({
  id: n,
  slug: `urun-${n}`,
  title: `Ürün ${n}`,
  price: "100.00",
  old_price: null,
  shelf_price: null,
  campaign_percentage: null,
  rating_average: null,
  rating_count: 0,
  sold_out: false,
  colours: [],
  image: null,
  ...over,
});

const banner = (id: number): PictureBanner => ({
  id,
  alt: `Afiş ${id}`,
  link: "/kategori/yaz",
  image: [{ width: 800, url: `/media/b${id}.webp` }],
  mobile_image: null,
});

const section = (over: Partial<HomepageSection> & Pick<HomepageSection, "id" | "type">) =>
  ({
    title: "",
    link: "",
    display: "carousel",
    source: null,
    client_resolved: false,
    ...over,
  }) as HomepageSection;

const html = (sections: HomepageSection[]) =>
  renderInStorefront(<HomepageSections sections={sections} />);

describe("HomepageSections", () => {
  it("renders the sections in the order given", () => {
    const out = html([
      section({ id: "b", type: "products", title: "Çok satanlar", products: [card(1)] }),
      section({ id: "a", type: "products", title: "Yeni gelenler", products: [card(2)] }),
    ]);

    expect(out.indexOf("Çok satanlar")).toBeLessThan(out.indexOf("Yeni gelenler"));
  });

  it("shows the title and the see-all link of a section that has one", () => {
    const out = html([
      section({
        id: "latest",
        type: "products",
        title: "Yeni gelenler",
        link: "/ara?sort=newest",
        products: [card(1)],
      }),
    ]);

    expect(out).toContain("Yeni gelenler");
    expect(out).toContain('href="/ara?sort=newest"');
    expect(out).toContain("Tümünü gör");
  });

  it("shows no see-all link when the section has none", () => {
    const out = html([section({ id: "x", type: "products", title: "Seçki", products: [card(1)] })]);

    expect(out).not.toContain("Tümünü gör");
  });

  it("badges discounts only in an on-sale section", () => {
    const discounted = card(1, { old_price: "200.00" });
    const sale = html([
      section({
        id: "s",
        type: "products",
        source: "on_sale",
        title: "İndirim",
        products: [discounted],
      }),
    ]);
    const latest = html([
      section({
        id: "l",
        type: "products",
        source: "latest",
        title: "Yeni",
        products: [discounted],
      }),
    ]);

    expect(sale).toContain("%50");
    expect(latest).not.toContain("%50");
  });

  it("draws a grid section as a grid of cards, and a list as one column", () => {
    const grid = html([
      section({ id: "g", type: "products", display: "grid", title: "Izgara", products: [card(1)] }),
    ]);
    const list = html([
      section({ id: "l", type: "products", display: "list", title: "Liste", products: [card(1)] }),
    ]);

    expect(grid).toContain("lg:grid-cols-4");
    expect(list).toContain("grid-cols-1");
    expect(list).not.toContain("lg:grid-cols-4");
  });

  it("shows the slider's banners when it has them, else its products", () => {
    const banners = html([section({ id: "h", type: "slider", banners: [banner(1)] })]);
    const products = html([section({ id: "h", type: "slider", products: [card(7)] })]);

    expect(banners).toContain('alt="Afiş 1"');
    expect(products).toContain("Ürün 7");
  });

  it("shows the banner of a banner section", () => {
    expect(html([section({ id: "m", type: "banner", banners: [banner(3)] })])).toContain(
      'alt="Afiş 3"',
    );
  });

  it("shows the picked categories", () => {
    const out = html([
      section({
        id: "c",
        type: "categories",
        title: "Kategoriler",
        categories: [{ name: "Elbise", slug: "elbise", image_url: null, image_alt: "" }],
      }),
    ]);

    expect(out).toContain("Elbise");
    expect(out).toContain('href="/kategori/elbise"');
  });

  it("renders a rich text section's headings, lists and links", () => {
    const out = html([
      section({
        id: "t",
        type: "rich_text",
        title: "Duyuru",
        body: "### Başlık\n\n- bir\n- iki\n\n[Ara](/ara) ve [site](https://example.com)",
      }),
    ]);

    expect(out).toContain("<h3");
    expect(out).toContain("<li>bir</li>");
    expect(out).toContain('href="/ara"');
    expect(out).toContain('href="https://example.com"');
  });

  it("strips scripts, inline handlers and unsafe links from rich text", () => {
    const out = html([
      section({
        id: "t",
        type: "rich_text",
        body: '<script>alert(1)</script><img src=x onerror="alert(2)">[tıkla](javascript:alert(3))',
      }),
    ]);

    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("javascript:");
  });

  it("skips a section type it does not know instead of breaking the page", () => {
    const out = html([
      section({ id: "?", type: "carousel3d" as HomepageSection["type"] }),
      section({ id: "p", type: "products", title: "Yeni", products: [card(1)] }),
    ]);

    expect(out).toContain("Yeni");
  });

  it("says products are coming when only the browser-filled section is left", () => {
    const out = html([
      section({ id: "r", type: "products", source: "recently_viewed", client_resolved: true }),
    ]);

    expect(out).toContain("Ürünler yakında burada.");
  });

  it("does not say so once there is something to show", () => {
    expect(
      html([section({ id: "p", type: "products", title: "Yeni", products: [card(1)] })]),
    ).not.toContain("yakında");
  });
});
