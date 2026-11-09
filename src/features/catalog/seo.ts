import type { BrowseSearch } from "./browse-search";
import type { CategoryNode, ProductDetail } from "./queries";

export const STORE_NAME = "Aura Tekstil";
const DESCRIPTION_LENGTH = 155;

export const absoluteUrl = (origin: string, path: string) => `${origin}${path}`;

/** First 155 characters of the free text, or the template when there is none. */
export function metaDescription(text: string | null | undefined, fallback: string): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, DESCRIPTION_LENGTH).trimEnd() : fallback;
}

type Sized = { sizes: { url: string; width: number }[] };

function largestUrl(image: Sized, origin: string): string | undefined {
  const best = [...image.sizes].sort((a, b) => b.width - a.width)[0];
  if (!best) return undefined;
  return best.url.startsWith("http") ? best.url : absoluteUrl(origin, best.url);
}

/** schema.org `Product`: KDV-inclusive TRY price, availability from stock. */
export function productJsonLd(product: ProductDetail, origin: string): Record<string, unknown> {
  const images = (product.photos.length ? product.photos : product.image ? [product.image] : [])
    .map((p) => largestUrl(p, origin))
    .filter((u): u is string => Boolean(u));
  const sku = product.variants[0]?.sku;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: metaDescription(product.description, product.title),
    ...(images.length ? { image: images } : {}),
    ...(sku ? { sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(origin, `/urun/${product.slug}`),
      price: product.price,
      priceCurrency: "TRY",
      availability: product.sold_out
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[],
  origin: string,
): { itemListElement: unknown[] } & Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(origin, c.path),
    })),
  };
}

/** Root-to-leaf path to a category slug, or [] when it is not in the tree. */
export function categoryTrail(
  tree: CategoryNode[],
  slug: string,
): { name: string; slug: string }[] {
  for (const top of tree) {
    if (top.slug === slug) return [top];
    const child = top.children.find((c) => c.slug === slug);
    if (child) return [top, child];
  }
  return [];
}

/** Store settings do not exist yet (ticket 20); until then the name is a constant. */
export function organizationJsonLd(name: string, origin: string): Record<string, unknown> {
  return { "@context": "https://schema.org", "@type": "Organization", name, url: origin };
}

/** Plain and paged category views are indexable; anything filtered, sorted or searched is not. */
export function isIndexableListing(s: BrowseSearch, kind: "category" | "search"): boolean {
  if (kind === "search") return false;
  return !(
    s.q ||
    s.colour?.length ||
    s.size?.length ||
    s.brand?.length ||
    s.price_min !== undefined ||
    s.price_max !== undefined ||
    s.in_stock !== undefined ||
    s.sort !== undefined
  );
}

/** The unfiltered URL plus the page number. */
export function listingCanonical(path: string, s: BrowseSearch, origin: string): string {
  const page = s.page && s.page > 1 ? `?page=${s.page}` : "";
  return `${absoluteUrl(origin, path)}${page}`;
}

/** A `<script type="application/ld+json">` descriptor; `<` is escaped so text cannot end the tag. */
export function jsonLdScript(data: unknown): { type: string; children: string } {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

type Meta = Record<string, string>;

function openGraph(o: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type: string;
}): Meta[] {
  return [
    { property: "og:type", content: o.type },
    { property: "og:site_name", content: STORE_NAME },
    { property: "og:locale", content: "tr_TR" },
    { property: "og:title", content: o.title },
    { property: "og:description", content: o.description },
    { property: "og:url", content: o.url },
    { name: "twitter:card", content: o.image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: o.title },
    { name: "twitter:description", content: o.description },
    ...(o.image
      ? [
          { property: "og:image", content: o.image },
          { name: "twitter:image", content: o.image },
        ]
      : []),
  ];
}

export type HeadResult = {
  meta: Meta[];
  links: { rel: string; href: string }[];
  scripts: { type: string; children: string }[];
};

export function productHead(product: ProductDetail, origin: string): HeadResult {
  const title = `${product.title} | ${STORE_NAME}`;
  const description = metaDescription(
    product.description,
    `${product.title} - ${STORE_NAME}'de uygun fiyatla.`,
  );
  const url = absoluteUrl(origin, `/urun/${product.slug}`);
  const first = product.photos.find((p) => p.is_primary) ?? product.photos[0] ?? product.image;
  const crumbs = [
    ...product.breadcrumbs.map((c) => ({ name: c.name, path: `/kategori/${c.slug}` })),
    { name: product.title, path: `/urun/${product.slug}` },
  ];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...openGraph({
        title,
        description,
        url,
        type: "product",
        image: first ? largestUrl(first, origin) : undefined,
      }),
    ],
    // The canonical ignores any colour query: it is always the bare product URL.
    links: [{ rel: "canonical", href: url }],
    scripts: [
      jsonLdScript(productJsonLd(product, origin)),
      jsonLdScript(breadcrumbJsonLd(crumbs, origin)),
    ],
  };
}

export function listingHead(o: {
  title: string;
  path: string;
  search: BrowseSearch;
  kind: "category" | "search";
  origin: string;
  trail?: { name: string; slug: string }[];
}): HeadResult {
  const title = `${o.title} | ${STORE_NAME}`;
  const description = `${o.title} - ${STORE_NAME} ürünlerini inceleyin.`;
  const url = listingCanonical(o.path, o.search, o.origin);
  const indexable = isIndexableListing(o.search, o.kind);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(indexable ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ...openGraph({ title, description, url, type: "website" }),
    ],
    // Only indexable views self-canonicalise; noindex views carry no conflicting canonical.
    links: o.kind === "category" && indexable ? [{ rel: "canonical", href: url }] : [],
    scripts: o.trail?.length
      ? [
          jsonLdScript(
            breadcrumbJsonLd(
              o.trail.map((c) => ({ name: c.name, path: `/kategori/${c.slug}` })),
              o.origin,
            ),
          ),
        ]
      : [],
  };
}

export function homeHead(origin: string): HeadResult {
  const description = `${STORE_NAME}: yeni gelen ürünler ve kategoriler.`;
  return {
    meta: [
      { title: STORE_NAME },
      { name: "description", content: description },
      ...openGraph({ title: STORE_NAME, description, url: origin, type: "website" }),
    ],
    links: [{ rel: "canonical", href: origin }],
    scripts: [jsonLdScript(organizationJsonLd(STORE_NAME, origin))],
  };
}
