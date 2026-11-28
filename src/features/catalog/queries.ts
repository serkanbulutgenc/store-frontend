import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";
import { type BrowseSearch, toListQuery } from "./browse-search";

export type ProductCard = components["schemas"]["ProductCardOut"];
export type ProductPage = components["schemas"]["ProductPageOut"];
export type ProductDetail = components["schemas"]["ProductDetailOut"];
export type Facets = components["schemas"]["FacetsOut"];
export type CategoryNode = components["schemas"]["CategoryNodeOut"];
export type CategoryPage = components["schemas"]["CategoryPageOut"];
export type CardImage = components["schemas"]["CardImageOut"];
export type CollectionPage = components["schemas"]["CollectionPageOut"];

/** The menu shows categories, sub-categories and their children. */
const MENU_DEPTH = 3;

const ROOT = ["store", "catalog"] as const;

export const categoriesQuery = queryOptions({
  queryKey: [...ROOT, "categories"],
  staleTime: 5 * 60_000,
  queryFn: async () =>
    (await storeApi.GET("/api/store/categories", { params: { query: { depth: MENU_DEPTH } } }))
      .data as CategoryNode[],
});

export type HomeCategory = components["schemas"]["HomeCategoryOut"];

export const categoryPageQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "category", slug],
    queryFn: async () => {
      try {
        return (await storeApi.GET("/api/store/categories/{slug}", { params: { path: { slug } } }))
          .data as CategoryPage;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });

export type SuggestionGroup = components["schemas"]["SuggestionGroupOut"];

export const MIN_SUGGESTION_QUERY = 2;

/**
 * Search suggestions for what is typed. A failure is the answer `null`, "show nothing": it
 * replaces what was cached for this text, nothing older stands in for it while the next one
 * loads, and it is asked again next time.
 */
export const suggestionsQuery = (q: string) =>
  queryOptions<SuggestionGroup[] | null>({
    queryKey: [...ROOT, "suggestions", q],
    enabled: q.length >= MIN_SUGGESTION_QUERY,
    placeholderData: keepPreviousData,
    staleTime: ({ state }) => (state.data === null ? 0 : 30_000),
    queryFn: async ({ signal }) => {
      try {
        const { data } = await storeApi.GET("/api/store/suggestions", {
          params: { query: { q } },
          signal,
        });
        return data?.groups ?? null;
      } catch (e) {
        if (signal.aborted) throw e;
        return null;
      }
    },
  });

/** One page of a listing. The key holds the full query, so every filter combination caches. */
export const productsPageQuery = (
  search: BrowseSearch,
  opts: { category?: string; page: number },
) => {
  const query = toListQuery(search, opts);
  return queryOptions({
    queryKey: [...ROOT, "products", query],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (await storeApi.GET("/api/store/products", { params: { query } })).data as ProductPage,
  });
};

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "product", slug],
    queryFn: async () => {
      try {
        return (await storeApi.GET("/api/store/products/{slug}", { params: { path: { slug } } }))
          .data as ProductDetail;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });

/** The ranked "Benzer ürünler" cards of a Product: up to 8, empty when nothing is similar. */
export const similarQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "similar", slug],
    staleTime: 60_000,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/products/{slug}/similar", {
          params: { path: { slug } },
        })
      ).data as ProductCard[],
  });

/** Fresh cards for the slugs this browser kept. Sold-out and unpublished Products are left out. */
export const recentlyViewedQuery = (slugs: string[]) =>
  queryOptions({
    queryKey: [...ROOT, "recently-viewed", slugs],
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/recently-viewed", {
          params: { query: { slugs: slugs.join(",") } },
        })
      ).data as ProductCard[],
  });

/** The Size guide text, fetched only when the dialog opens so it stays out of the page HTML. */
export const sizeGuideQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "size-guide", slug],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/products/{slug}/size-guide", {
          params: { path: { slug } },
        })
      ).data as components["schemas"]["SizeGuideOut"],
  });

/**
 * Pages the server loaded for a listing, sent to the browser inside the route's loader data.
 * The browser has no query cache at hydration, so without them its first render would be a
 * skeleton and would not match the server's HTML.
 */
export type SeedPages = { key: string; pages: ProductPage[] };

export const collectionPageQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "collection", slug],
    queryFn: async () => {
      try {
        return (await storeApi.GET("/api/store/collections/{slug}", { params: { path: { slug } } }))
          .data as CollectionPage;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });
