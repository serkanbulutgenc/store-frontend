import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  categoryTrail,
  isIndexableListing,
  jsonLdScript,
  listingCanonical,
  metaDescription,
  organizationJsonLd,
  productJsonLd,
} from "./seo";

const ORIGIN = "https://aura.example";

const product = {
  id: 1,
  slug: "pamuklu-tisort",
  title: "Pamuklu Tişört",
  description: "Yumuşak pamuk.",
  price: "349.90",
  old_price: null,
  sold_out: false,
  brand: { id: 2, name: "Aura" },
  breadcrumbs: [{ name: "Giyim", slug: "giyim" }],
  image: { alt: "Ön", sizes: [{ url: "/media/a-400.webp", width: 400 }] },
  photos: [
    {
      id: 1,
      alt: "Ön",
      colour_id: null,
      is_primary: true,
      sizes: [
        { url: "/media/p-400.webp", width: 400 },
        { url: "/media/p-1200.webp", width: 1200 },
      ],
    },
  ],
  variants: [{ sku: "TS-1" }, { sku: "TS-2" }],
} as never;

describe("metaDescription", () => {
  it("uses the first 155 characters of the description", () => {
    const d = metaDescription("a".repeat(300), "fallback");
    expect(d).toHaveLength(155);
  });
  it("collapses whitespace and falls back to the template when empty", () => {
    expect(metaDescription("bir\n\n  iki", "x")).toBe("bir iki");
    expect(metaDescription("  ", "şablon")).toBe("şablon");
  });
});

describe("productJsonLd", () => {
  it("emits a TRY KDV-inclusive offer with availability from stock", () => {
    const ld = productJsonLd(product, ORIGIN);
    expect(ld["@type"]).toBe("Product");
    expect(ld.sku).toBe("TS-1");
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Aura" });
    expect(ld.image).toEqual([`${ORIGIN}/media/p-1200.webp`]);
    expect(ld.offers).toMatchObject({
      "@type": "Offer",
      price: "349.90",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      url: `${ORIGIN}/urun/pamuklu-tisort`,
    });
  });
  it("marks sold-out products OutOfStock", () => {
    const ld = productJsonLd({ ...(product as object), sold_out: true } as never, ORIGIN);
    expect((ld.offers as { availability: string }).availability).toBe(
      "https://schema.org/OutOfStock",
    );
  });
  it("omits absent optional fields", () => {
    const ld = productJsonLd(
      { ...(product as object), brand: null, photos: [], image: null, variants: [] } as never,
      ORIGIN,
    );
    expect(ld).not.toHaveProperty("brand");
    expect(ld).not.toHaveProperty("image");
    expect(ld).not.toHaveProperty("sku");
  });
});

describe("breadcrumbs", () => {
  it("numbers positions from 1 with absolute URLs, ending on the page itself", () => {
    const ld = breadcrumbJsonLd(
      [
        { name: "Giyim", path: "/kategori/giyim" },
        { name: "Tişört", path: "/urun/t" },
      ],
      ORIGIN,
    );
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Giyim", item: `${ORIGIN}/kategori/giyim` },
      { "@type": "ListItem", position: 2, name: "Tişört", item: `${ORIGIN}/urun/t` },
    ]);
  });
  it("finds a category's trail in the tree", () => {
    const tree = [
      { name: "Giyim", slug: "giyim", children: [{ name: "Tişört", slug: "tisort" }] },
      { name: "Ev", slug: "ev", children: [] },
    ] as never;
    expect(categoryTrail(tree, "tisort").map((c) => c.slug)).toEqual(["giyim", "tisort"]);
    expect(categoryTrail(tree, "ev").map((c) => c.slug)).toEqual(["ev"]);
    expect(categoryTrail(tree, "yok")).toEqual([]);
  });
});

describe("organizationJsonLd", () => {
  it("uses the store name and origin", () => {
    expect(organizationJsonLd("Aura Tekstil", ORIGIN)).toMatchObject({
      "@type": "Organization",
      name: "Aura Tekstil",
      url: ORIGIN,
    });
  });
});

describe("listing indexing", () => {
  it("indexes the plain category and paged views", () => {
    expect(isIndexableListing({}, "category")).toBe(true);
    expect(isIndexableListing({ page: 3 }, "category")).toBe(true);
  });
  it("noindexes filtered, sorted and search views", () => {
    for (const s of [
      { colour: [1] },
      { size: ["M"] },
      { brand: [1] },
      { price_min: 5 },
      { price_max: 5 },
      { in_stock: false },
      { sort: "price_asc" as const },
      { q: "x" },
    ])
      expect(isIndexableListing(s, "category")).toBe(false);
    expect(isIndexableListing({}, "search")).toBe(false);
  });
  it("canonicalises to the unfiltered URL plus the page", () => {
    expect(listingCanonical("/kategori/giyim", { colour: [1], page: 1 }, ORIGIN)).toBe(
      `${ORIGIN}/kategori/giyim`,
    );
    expect(listingCanonical("/kategori/giyim", { sort: "newest", page: 2 }, ORIGIN)).toBe(
      `${ORIGIN}/kategori/giyim?page=2`,
    );
  });
});

describe("jsonLdScript", () => {
  it("escapes markup so a title cannot close the script tag", () => {
    const s = jsonLdScript({ name: "</script><b>" });
    expect(s.type).toBe("application/ld+json");
    expect(s.children).not.toContain("<");
    expect(JSON.parse(s.children)).toEqual({ name: "</script><b>" });
  });
});
