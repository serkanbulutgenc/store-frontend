import { useSuspenseQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  type BrowseSearch,
  effectiveSort,
  pageNumbers,
  SORT_LABELS,
  type Sort,
  withFilters,
} from "../browse-search";
import { type CategoryNode, productsPageQuery } from "../queries";
import { FilterPanel } from "./filter-panel";
import { ProductGrid } from "./product-card";

/**
 * Category and search results. `search.page = N` shows pages 1 to N, so the state survives
 * reload and back; "daha fazla göster" just bumps N in the URL.
 */
export function ProductListing({
  search,
  category,
  categories,
  onSearchChange,
}: {
  search: BrowseSearch;
  category?: string;
  categories: CategoryNode[];
  onSearchChange: (next: BrowseSearch, opts?: { keepScroll?: boolean }) => void;
}) {
  const pages = pageNumbers(search.page);
  const results = useSuspenseQueries({
    queries: pages.map((page) => productsPageQuery(search, { category, page })),
  });
  const first = results[0]?.data;
  if (!first) return null;
  const items = results.flatMap((r) => r.data.items);
  const hasMore = items.length < first.total && pages.length < 10;
  const sort = effectiveSort(search);
  const sorts: Sort[] = search.q
    ? ["relevance", "newest", "price_asc", "price_desc"]
    : ["newest", "price_asc", "price_desc"];

  return (
    <div className="gap-8 lg:grid lg:grid-cols-[14rem_1fr]">
      <details className="mb-4 rounded-md border border-border bg-card p-3 lg:mb-0 lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:open:block">
        <summary className="cursor-pointer font-medium lg:hidden">Filtrele</summary>
        <div className="mt-3 lg:mt-0">
          <FilterPanel
            facets={first.facets}
            search={search}
            onChange={(patch) => onSearchChange(withFilters(search, patch))}
          />
        </div>
      </details>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-muted-foreground">
            {first.total} ürün
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="sr-only sm:not-sr-only">
              Sırala
            </label>
            <Select
              id="sort"
              className="h-9 w-auto"
              value={sort}
              onChange={(e) =>
                onSearchChange(withFilters(search, { sort: e.target.value as Sort }))
              }
            >
              {sorts.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyResults search={search} categories={categories} />
        ) : (
          <ProductGrid products={items} />
        )}
        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() =>
                onSearchChange({ ...search, page: pages.length + 1 }, { keepScroll: true })
              }
            >
              Daha fazla göster
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export const CONTACT_HREF = "/legal/iletisim";

/** Nothing matched: point to the top categories and the shop's contact page. */
function EmptyResults({
  search,
  categories,
}: {
  search: BrowseSearch;
  categories: CategoryNode[];
}) {
  return (
    <div className="rounded-md border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">
        {search.q ? `“${search.q}” için sonuç bulamadık` : "Bu filtrelerle ürün bulunamadı"}
      </h2>
      <p className="mt-1 text-muted-foreground">
        Yazımı kontrol edebilir, filtreleri gevşetebilir veya kategorilere göz atabilirsiniz.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              to="/kategori/$slug"
              params={{ slug: c.slug }}
              className="inline-block rounded-md border border-border px-3 py-1.5 hover:bg-accent"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        Aradığınızı bulamadıysanız{" "}
        <a href={CONTACT_HREF} className="underline">
          bize ulaşın
        </a>
        .
      </p>
    </div>
  );
}
