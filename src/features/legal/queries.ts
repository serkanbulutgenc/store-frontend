import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";

export type LegalPageRow = components["schemas"]["LegalPageRow"];
export type LegalPage = components["schemas"]["LegalPageOut"];
export type LegalSearchHit = components["schemas"]["LegalSearchHit"];

const ROOT = ["store", "legal"] as const;

/** The current version of every Legal page: the footer links and the index. */
export const legalPagesQuery = queryOptions({
  queryKey: [...ROOT, "pages"],
  staleTime: 60_000,
  queryFn: async () => (await storeApi.GET("/api/store/legal-pages")).data as LegalPageRow[],
});

export const legalPageQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "page", slug],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return (await storeApi.GET("/api/store/legal-pages/{slug}", { params: { path: { slug } } }))
          .data as LegalPage;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });

/** Under two characters the API answers with nothing, so skip the request. */
export const legalSearchQuery = (q: string) =>
  queryOptions({
    queryKey: [...ROOT, "search", q],
    staleTime: 60_000,
    queryFn: async () =>
      q.trim().length < 2
        ? []
        : ((await storeApi.GET("/api/store/legal-pages/search", { params: { query: { q } } }))
            .data as LegalSearchHit[]),
  });
