import { z } from "zod";

export const SORTS = ["newest", "price_asc", "price_desc", "relevance"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABELS: Record<Sort, string> = {
  relevance: "Önerilen",
  newest: "En yeni",
  price_asc: "Fiyat: artan",
  price_desc: "Fiyat: azalan",
};

/** "Daha fazla göster" reveals page after page; a URL never fetches more than this many. */
export const MAX_PAGES = 10;

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
  price_min: price,
  price_max: price,
  in_stock: z.boolean().optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
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
  if (s.price_min !== undefined) q.price_min = s.price_min;
  if (s.price_max !== undefined) q.price_max = s.price_max;
  return q;
}

/** `page=3` in the URL means pages 1 to 3 are on screen. */
export function pageNumbers(page: number | undefined): number[] {
  const n = Math.min(Math.max(page ?? 1, 1), MAX_PAGES);
  return Array.from({ length: n }, (_, i) => i + 1);
}

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
