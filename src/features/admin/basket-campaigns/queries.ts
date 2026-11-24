import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import { useRowActions } from "../components/row-actions";

export type PagedBasketCampaigns = components["schemas"]["PagedBasketCampaignOut"];

export const basketCampaignKeys = { all: ["admin", "basket-campaigns"] as const };

/** One page of the Basket Campaigns, newest first. No status means all of them. */
export const basketCampaignsQuery = (s: { status?: string; page: number; size: number }) =>
  queryOptions({
    queryKey: [...basketCampaignKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/basket-campaigns", {
          params: { query: { status: s.status, page: s.page, page_size: s.size } },
        })
      ).data as PagedBasketCampaigns,
  });

export const basketCampaignQuery = (id: number) =>
  queryOptions({
    queryKey: [...basketCampaignKeys.all, "detail", id],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/basket-campaigns/{campaign_id}", {
          params: { path: { campaign_id: id } },
        })
      ).data as components["schemas"]["BasketCampaignOut"],
  });

/** Open, close and delete a Basket Campaign; each refreshes the list when it succeeds. */
export function useBasketCampaignActions() {
  const path = (id: number) => ({ params: { path: { campaign_id: id } } });
  return useRowActions({
    queryKey: basketCampaignKeys.all,
    activate: (id) => adminApi.POST("/api/admin/basket-campaigns/{campaign_id}/activate", path(id)),
    deactivate: (id) =>
      adminApi.POST("/api/admin/basket-campaigns/{campaign_id}/deactivate", path(id)),
    remove: (id) => adminApi.DELETE("/api/admin/basket-campaigns/{campaign_id}", path(id)),
  });
}
