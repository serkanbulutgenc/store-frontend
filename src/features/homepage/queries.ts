import { queryOptions } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type HomepageSection = components["schemas"]["HomepageSectionOut"];

/** The home page: the Owner's visible sections in order, each already resolved (ADR 0012). */
export const homepageQuery = queryOptions({
  queryKey: ["store", "homepage"],
  staleTime: 60_000,
  queryFn: async () =>
    ((await storeApi.GET("/api/store/homepage")).data?.sections ?? []) as HomepageSection[],
});
