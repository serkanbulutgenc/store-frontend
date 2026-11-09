import { z } from "zod";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

/**
 * URL search params shared by every Dashboard list. Garbage in the URL falls back to the
 * default rather than throwing. Screens add their own filters with `.extend()`.
 */
export const listSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  size: z.coerce
    .number()
    .refine((n): n is (typeof PAGE_SIZES)[number] => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(25)
    .default(25),
  q: z
    .union([z.string().min(1), z.number().transform(String)])
    .optional()
    .catch(undefined),
  ordering: z.string().min(1).optional().catch(undefined),
});

export type ListSearch = z.infer<typeof listSearchSchema>;

/** URL search params to the API's query string (`size` is `page_size` there). */
export function toApiQuery<T extends ListSearch>(search: T): Record<string, string | number> {
  const { size, ...rest } = search;
  const out: Record<string, string | number> = { page_size: size };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && v !== "") out[k] = v as string | number;
  }
  return out;
}

export type SortingState = { id: string; desc: boolean }[];

export function orderingToSorting(ordering: string | undefined): SortingState {
  if (!ordering) return [];
  return ordering.startsWith("-")
    ? [{ id: ordering.slice(1), desc: true }]
    : [{ id: ordering, desc: false }];
}

/** The API orders by one field; extra sort keys are ignored. */
export function sortingToOrdering(sorting: SortingState): string | undefined {
  const first = sorting[0];
  return first ? `${first.desc ? "-" : ""}${first.id}` : undefined;
}

export function paginationToSearch(p: { pageIndex: number; pageSize: number }) {
  return { page: p.pageIndex + 1, size: p.pageSize };
}
