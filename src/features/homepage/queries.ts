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
 * The public endpoint has no preview; this one answers 401/403 to everyone else, so it resolves
 * to null then. It deliberately skips the query cache: the cache's global 401 handler would
 * clear it and re-run the route guards, which breaks a Shopper's server render. */
export async function fetchHomepagePreview(): Promise<HomepageSection[] | null> {
  try {
    const { data } = await adminApi.GET("/api/admin/homepage/preview");
    return (data?.sections ?? []) as HomepageSection[];
  } catch {
    return null;
  }
}
