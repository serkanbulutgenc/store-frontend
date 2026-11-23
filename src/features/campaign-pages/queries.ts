import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";

export type CampaignPageRow = components["schemas"]["CampaignPageRowOut"];
export type CampaignPage = components["schemas"]["CampaignPageOut"];

const ROOT = ["store", "campaign-pages"] as const;

/** Published Campaign pages that have started and not ended, newest first. */
export const campaignPagesQuery = queryOptions({
  queryKey: [...ROOT, "list"],
  staleTime: 60_000,
  queryFn: async () => (await storeApi.GET("/api/store/campaign-pages")).data as CampaignPageRow[],
});

/** An ended page still answers; an unpublished, unstarted or unknown one is a 404. */
export const campaignPageQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, "page", slug],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return (
          await storeApi.GET("/api/store/campaign-pages/{slug}", { params: { path: { slug } } })
        ).data as CampaignPage;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });
