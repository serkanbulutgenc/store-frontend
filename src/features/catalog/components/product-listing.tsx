import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type BrowseSearch,
  effectiveSort,
  listKey,
  pageNumbers,
  SORT_LABELS,
  type Sort,
  withFilters,
} from "../browse-search";
import { type CategoryNode, productsPageQuery, type SeedPages } from "../queries";
import { FilterPanel } from "./filter-panel";
import { ProductGrid, ProductGridSkeleton } from "./product-card";

/**
 * Category and search results with infinite scroll. `search.page = N` shows pages 1 to N, so
 * the state survives reload and back. Scrolling near the end bumps N in the URL (replacing
 * the history entry, so Back leaves the list). The "Daha fazla göster" link is the same bump
 * as a real `rel="next"` anchor: crawlers, keyboards and no-JS readers can follow it.
 */
export function ProductListing({
  search,
  category,
  categories,
  seed,
  onSearchChange,
}: {
  search: BrowseSearch;
  category?: string;
  categories: CategoryNode[];
  seed: SeedPages | null;
  onSearchChange: (next: BrowseSearch, opts?: { keepScroll?: boolean; replace?: boolean }) => void;
}) {
  // The server has page 1 already. In the browser a new filter or sort has none yet: the
  // previous result stays as `placeholder` (its facets keep the panel steady) and the grid
  // shows skeleton cards until the new page 1 lands.
  // `seed` holds the pages the server rendered, so hydration shows the same HTML; it only
  // applies to the filter set it was loaded for.
  const seeded = seed && seed.key === listKey(search, category) ? seed.pages : undefined;
  const query = useQuery({
    ...productsPageQuery(search, { category, page: 1 }),
    initialData: seeded?.[0],
  });
  if (query.isError) throw query.error;
  const loading = query.data === undefined || query.isPlaceholderData;
  const first = query.data;
  const lastPage = first && !loading ? Math.max(Math.ceil(first.total / first.page_size), 1) : 1;
  const pages = pageNumbers(search.page).filter((p) => p <= lastPage);
  const more = useQueries({
    queries: pages.slice(1).map((page, i) => ({
      ...productsPageQuery(search, { category, page }),
      initialData: seeded?.[i + 1],
    })),
  });
  // Only the unbroken run of loaded pages is shown, so a slow page 3 never leaves a gap.
  const loaded = first && !loading ? [first] : [];
  for (const r of more) {
    if (!r.data) break;
    loaded.push(r.data);
  }
  const items = loaded.flatMap((p) => p.items);
  const hasMore = !loading && loaded.length < lastPage;
  const failed = more.find((r) => r.isError);
  const fetching = more.some((r) => r.isFetching);
  const sort = effectiveSort(search);
  const sorts: Sort[] = search.q
    ? ["relevance", "newest", "price_asc", "price_desc", "name_asc", "rating_desc"]
    : ["newest", "price_asc", "price_desc", "name_asc", "rating_desc"];
  const nextPage = loaded.length + 1;
  const loadNext = () =>
    onSearchChange({ ...search, page: nextPage }, { keepScroll: true, replace: true });

  const sentinel = useRef<HTMLDivElement>(null);
  const canAutoLoad = !loading && hasMore && !fetching && !failed && pages.length === loaded.length;
  // Re-created whenever the state changes, so a sentinel still in view after a page lands
  // fires again and a tall screen keeps filling.
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadNext is rebuilt every render and only nextPage changes it
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canAutoLoad || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadNext();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canAutoLoad, nextPage]);

  if (!first) return <ListingSkeleton />;

  return (
    <div className="gap-8 lg:grid lg:grid-cols-[14rem_1fr]">
      <details className="mb-4 rounded-md border border-border bg-card p-3 lg:mb-0 lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:open:block lg:[&::details-content]:block lg:[&::details-content]:[content-visibility:visible]">
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
        {loading ? (
          <ProductGridSkeleton count={PAGE_SKELETONS} />
        ) : items.length === 0 ? (
          <EmptyResults search={search} categories={categories} />
        ) : (
          <ProductGrid products={items} />
        )}
        <p className="sr-only" aria-live="polite">
          {items.length} / {first.total} ürün gösteriliyor
        </p>
        {fetching && <ProductGridSkeleton className="mt-6" />}
        {hasMore && (
          <div ref={sentinel} className="mt-8 text-center">
            {failed && (
              <p role="alert" className="mb-3 text-destructive">
                Ürünler yüklenemedi.{" "}
                <Button variant="outline" size="sm" onClick={() => void failed.refetch()}>
                  Tekrar dene
                </Button>
              </p>
            )}
            <Button variant="outline" asChild>
              <Link
                to="."
                // Shared by two routes, so the router cannot type the search against one of them.
                search={{ ...search, page: nextPage } as never}
                rel="next"
                replace
                resetScroll={false}
                onClick={(e) => {
                  e.preventDefault();
                  loadNext();
                }}
              >
                Daha fazla göster
              </Link>
            </Button>
          </div>
        )}
        {!hasMore && items.length > first.page_size && (
          <p className="mt-8 text-center text-muted-foreground">Tüm ürünleri gördünüz.</p>
        )}
      </div>
    </div>
  );
}

const PAGE_SKELETONS = 12;

/** The whole listing before any result exists (first client navigation into it). */
export function ListingSkeleton() {
  return (
    <div className="gap-8 lg:grid lg:grid-cols-[14rem_1fr]">
      <div className="mb-4 hidden space-y-3 lg:block" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
      <div>
        <Skeleton className="mb-4 h-9 w-full" />
        <ProductGridSkeleton count={PAGE_SKELETONS} />
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
