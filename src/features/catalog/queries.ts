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

const ROOT = ["store", "catalog"] as const;

export const categoriesQuery = queryOptions({
  queryKey: [...ROOT, "categories"],
  staleTime: 5 * 60_000,
  queryFn: async () => (await storeApi.GET("/api/store/categories")).data as CategoryNode[],
});

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
