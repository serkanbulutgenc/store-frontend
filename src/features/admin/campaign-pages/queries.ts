import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";
import { approvalKeys, decide } from "../approvals/queries";
import type { PageAction } from "./rules";

export type PageRow = components["schemas"]["CampaignPageRowOut"];
export type PageOut = components["schemas"]["CampaignPageOut"];
export type PagePatch = components["schemas"]["CampaignPagePatch"];

export const pageKeys = { all: ["admin", "campaign-pages"] as const };

/** The pages, newest first. No status means all of them. */
export const pagesQuery = (status?: string) =>
  queryOptions({
    queryKey: [...pageKeys.all, "list", status ?? "all"],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/campaign-pages", {
          params: { query: { status } },
        })
      ).data as PageRow[],
  });

export const pageQuery = (id: number) =>
  queryOptions({
    queryKey: [...pageKeys.all, "one", id],
    // The cover image's derivatives are made by a worker: look again until they exist.
    refetchInterval: (query) => (query.state.data?.image?.status === "processing" ? 2000 : false),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/campaign-pages/{page_id}", {
          params: { path: { page_id: id } },
        })
      ).data as PageOut,
  });

/** The discount Campaigns the Owner may link a page to. */
export const linkableCampaignsQuery = () =>
  queryOptions({
    queryKey: ["admin", "campaigns", "linkable"],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/campaigns", {
          params: { query: { page: 1, page_size: 100 } },
        })
      ).data?.items ?? [],
  });

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads (or replaces) the cover image; processing continues on the server. */
export async function uploadCover(
  id: number,
  { file, altText }: { file: File; altText: string },
): Promise<PageOut> {
  const form = new FormData();
  form.append("file", file);
  form.append("alt_text", altText);
  const response = await fetch(`/api/admin/campaign-pages/${id}/image`, {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return body as PageOut;
}

/** The page's moves and edits; each refreshes the list and the page when it succeeds. */
export function usePageActions(id: number) {
  const qc = useQueryClient();
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: pageKeys.all });
    await qc.invalidateQueries({ queryKey: approvalKeys.all });
  };
  const path = { params: { path: { page_id: id } } };
  const move = useMutation({
    mutationFn: async ({ action, reason }: { action: PageAction; reason?: string }) => {
      switch (action) {
        case "submit":
          return adminApi.POST("/api/admin/campaign-pages/{page_id}/submit", path);
        case "withdraw":
          return adminApi.POST("/api/admin/campaign-pages/{page_id}/withdraw", path);
        case "publish":
          return adminApi.POST("/api/admin/campaign-pages/{page_id}/publish", path);
        case "unpublish":
          return adminApi.POST("/api/admin/campaign-pages/{page_id}/unpublish", path);
        // The Owner's queue is shared by every kind of content.
        case "approve":
          return decide("campaign_page", id, "approve");
        case "reject":
          return decide("campaign_page", id, "reject", reason);
      }
    },
    onSuccess: refresh,
  }).mutateAsync;
  const save = useMutation({
    mutationFn: (body: PagePatch) =>
      adminApi.PATCH("/api/admin/campaign-pages/{page_id}", { ...path, body }),
    onSuccess: refresh,
  }).mutateAsync;
  const link = useMutation({
    mutationFn: (campaignId: number | null) =>
      adminApi.PUT("/api/admin/campaign-pages/{page_id}/campaign", {
        ...path,
        body: { campaign_id: campaignId },
      }),
    onSuccess: refresh,
  }).mutateAsync;
  const removeImage = useMutation({
    mutationFn: () => adminApi.DELETE("/api/admin/campaign-pages/{page_id}/image", path),
    onSuccess: refresh,
  }).mutateAsync;
  const setAlt = useMutation({
    mutationFn: (alt_text: string) =>
      adminApi.PATCH("/api/admin/campaign-pages/{page_id}/image", { ...path, body: { alt_text } }),
    onSuccess: refresh,
  }).mutateAsync;
  const upload = useMutation({
    mutationFn: (args: { file: File; altText: string }) => uploadCover(id, args),
    onSuccess: refresh,
  }).mutateAsync;
  return { move, save, link, removeImage, setAlt, upload };
}
