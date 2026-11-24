import { queryOptions } from "@tanstack/react-query";
import { adminApi, storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type HomepageSection = components["schemas"]["HomepageSectionOut"];

/** The home page: the Owner's visible sections in order, each already resolved (ADR 0012). */
export const homepageQuery = queryOptions({
  queryKey: ["store", "homepage"],
  staleTime: 60_000,
  queryFn: async () =>
    ((await storeApi.GET("/api/store/homepage")).data?.sections ?? []) as HomepageSection[],
});

/** Preview mode: the layout as the Storefront would draw it, for a signed-in Dashboard user.
 * The public endpoint has no preview; this one answers 401/403 to everyone else. */
export const homepagePreviewQuery = queryOptions({
  queryKey: ["admin", "homepage", "preview"],
  staleTime: 0,
  queryFn: async () =>
    ((await adminApi.GET("/api/admin/homepage/preview")).data?.sections ?? []) as HomepageSection[],
});
