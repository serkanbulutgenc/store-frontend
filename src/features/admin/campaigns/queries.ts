import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import { useRowActions } from "../components/row-actions";
import type { CampaignSearch } from "./search";

export type PagedCampaignRow = components["schemas"]["PagedCampaignRowOut"];
export type CampaignListRow = components["schemas"]["CampaignRowOut"];

export const campaignKeys = { all: ["admin", "campaigns"] as const };

/** One page of the Campaigns, newest first. No status means all of them. */
export const campaignsQuery = (s: CampaignSearch) =>
  queryOptions({
    queryKey: [...campaignKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/campaigns", {
          params: { query: { status: s.status, page: s.page, page_size: s.size } },
        })
      ).data as PagedCampaignRow,
  });

/** One Campaign with its targets and the Products it would sell below cost. */
export const campaignQuery = (id: number) =>
  queryOptions({
    queryKey: [...campaignKeys.all, "detail", id],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/campaigns/{campaign_id}", {
          params: { path: { campaign_id: id } },
        })
      ).data as components["schemas"]["CampaignOut"],
  });

/** Open, close and delete a Campaign; each refreshes the list when it succeeds. */
export function useCampaignActions() {
  const path = (id: number) => ({ params: { path: { campaign_id: id } } });
  return useRowActions({
    queryKey: campaignKeys.all,
    activate: (id) => adminApi.POST("/api/admin/campaigns/{campaign_id}/activate", path(id)),
    deactivate: (id) => adminApi.POST("/api/admin/campaigns/{campaign_id}/deactivate", path(id)),
    remove: (id) => adminApi.DELETE("/api/admin/campaigns/{campaign_id}", path(id)),
  });
}
