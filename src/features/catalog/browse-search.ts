import { z } from "zod";

export const SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "rating_desc",
  "relevance",
] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABELS: Record<Sort, string> = {
  relevance: "Önerilen",
  newest: "En yeni",
  price_asc: "Fiyat: artan",
  price_desc: "Fiyat: azalan",
  name_asc: "İsim: A-Z",
  rating_desc: "En yüksek puan",
};

/** Sanity bound for a hand-typed `?page=`; the listing also clamps to the last real page. */
export const MAX_PAGE_PARAM = 500;

/** The server renders (and the loader preloads) at most this many pages; the rest load on the client. */
export const SSR_PAGES = 3;

/** One value or a list, from a URL that may have been typed by hand. */
const list = <T extends z.ZodType>(item: T) =>
  z
    .union([z.array(item), item.transform((v) => [v])])
    .transform((a) => (Array.isArray(a) ? a : [a]) as z.infer<T>[])
    .optional()
    .catch(undefined);

const price = z.coerce.number().min(0).optional().catch(undefined);

/**
 * Listing state lives in the URL, so a list can be shared, reloaded and walked back. Every
 * field is optional and garbage falls back to "not set", which keeps default URLs clean.
 */
export const browseSearchSchema = z.object({
  q: z
    .union([z.string().trim().min(1), z.number().transform(String)])
    .optional()
    .catch(undefined),
  colour: list(z.number().int().positive()),
  size: list(z.string().min(1)),
  brand: list(z.number().int().positive()),
  option: list(z.number().int().positive()),
  price_min: price,
  price_max: price,
  in_stock: z.boolean().optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(MAX_PAGE_PARAM).optional().catch(undefined),
});

export type BrowseSearch = z.infer<typeof browseSearchSchema>;

export function effectiveSort(s: Pick<BrowseSearch, "q" | "sort">): Sort {
  if (s.sort === "relevance") return s.q ? "relevance" : "newest";
  return s.sort ?? (s.q ? "relevance" : "newest");
}

type ListQuery = {
  category?: string;
  q?: string;
  colour?: number[];
  size?: string[];
  brand?: number[];
  option?: number[];
  price_min?: number;
  price_max?: number;
  in_stock: boolean;
  sort: Sort;
  page: number;
};

/** URL state to the API's query for one page of results. */
export function toListQuery(s: BrowseSearch, opts: { category?: string; page: number }): ListQuery {
  const q: ListQuery = {
    in_stock: s.in_stock ?? true,
    sort: effectiveSort(s),
    page: opts.page,
  };
  if (opts.category) q.category = opts.category;
  if (s.q) q.q = s.q;
  if (s.colour?.length) q.colour = s.colour;
  if (s.size?.length) q.size = s.size;
  if (s.brand?.length) q.brand = s.brand;
  if (s.option?.length) q.option = s.option;
  if (s.price_min !== undefined) q.price_min = s.price_min;
  if (s.price_max !== undefined) q.price_max = s.price_max;
  return q;
}

/** `page=3` in the URL means pages 1 to 3 are on screen; `max` limits how many are listed. */
export function pageNumbers(page: number | undefined, max = MAX_PAGE_PARAM): number[] {
  const n = Math.min(Math.max(page ?? 1, 1), max);
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** The pages the loader awaits: a deep `?page=30` only preloads the first few. */
export const ssrPageNumbers = (page: number | undefined) => pageNumbers(page, SSR_PAGES);

/**
 * The pages a loader awaits. The server preloads a few so the HTML is complete; the browser
 * awaits none, so a filter, sort or scroll shows skeleton cards instead of holding the old screen.
 */
export const loaderPageNumbers = (page: number | undefined) =>
  typeof window === "undefined" ? ssrPageNumbers(page) : [];

/** For `loaderDeps`: a bump beyond the preloaded pages must not re-run the loader. */
export const loaderSearch = (s: BrowseSearch): BrowseSearch => ({
  ...s,
  page: Math.min(s.page ?? 1, SSR_PAGES),
});

/** Applies a filter change: the page resets and values equal to the default are removed. */
export function withFilters(current: BrowseSearch, patch: Partial<BrowseSearch>): BrowseSearch {
  const merged: Record<string, unknown> = { ...current, ...patch };
  delete merged.page;
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || (Array.isArray(v) && v.length === 0)) delete merged[k];
  }
  if (merged.in_stock === true) delete merged.in_stock;
  return merged as BrowseSearch;
}

export function toggleValue<T>(values: readonly T[] | undefined, value: T): T[] {
  const current = values ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

/** Identifies the filter/sort set of a listing, whatever page of it is shown. */
export const listKey = (s: BrowseSearch, category?: string): string =>
  JSON.stringify(toListQuery(s, { category, page: 1 }));
