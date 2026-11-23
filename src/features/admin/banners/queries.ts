import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";
import { approvalKeys, decide } from "../approvals/queries";
import type { BannerAction } from "./rules";

export type BannerRow = components["schemas"]["BannerRowOut"];
export type BannerOut = components["schemas"]["BannerOut"];
export type BannerPatch = components["schemas"]["BannerPatch"];
export type BannerIn = components["schemas"]["BannerIn"];

export const bannerKeys = { all: ["admin", "banners"] as const };

/** Every Banner by slot and order; the filters narrow it. */
export const bannersQuery = (status?: string, slot?: string) =>
  queryOptions({
    queryKey: [...bannerKeys.all, "list", status ?? "all", slot ?? "all"],
    queryFn: async () =>
      (await adminApi.GET("/api/admin/banners", { params: { query: { status, slot } } }))
        .data as BannerRow[],
  });

export const bannerQuery = (id: number) =>
  queryOptions({
    queryKey: [...bannerKeys.all, "one", id],
    // Derivatives are made by a worker: look again until they exist.
    refetchInterval: (query) =>
      query.state.data?.image?.status === "processing" ||
      query.state.data?.mobile_image?.status === "processing"
        ? 2000
        : false,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/banners/{banner_id}", {
          params: { path: { banner_id: id } },
        })
      ).data as BannerOut,
  });

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads (or replaces) the main or the mobile image; processing continues on the server. */
export async function uploadImage(
  id: number,
  which: "image" | "mobile-image",
  { file, altText }: { file: File; altText?: string },
): Promise<BannerOut> {
  const form = new FormData();
  form.append("file", file);
  // The mobile image shares the main image's alt text.
  if (which === "image" && altText !== undefined) form.append("alt_text", altText);
  const response = await fetch(`/api/admin/banners/${id}/${which}`, {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return body as BannerOut;
}

/** The Banner's moves and edits; each refreshes the list and the Banner when it succeeds. */
export function useBannerActions(id: number) {
  const qc = useQueryClient();
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: bannerKeys.all });
    await qc.invalidateQueries({ queryKey: approvalKeys.all });
  };
  const path = { params: { path: { banner_id: id } } };
  const move = useMutation({
    mutationFn: async ({ action, reason }: { action: BannerAction; reason?: string }) => {
      switch (action) {
        case "submit":
          return adminApi.POST("/api/admin/banners/{banner_id}/submit", path);
        case "withdraw":
          return adminApi.POST("/api/admin/banners/{banner_id}/withdraw", path);
        case "publish":
          return adminApi.POST("/api/admin/banners/{banner_id}/publish", path);
        case "unpublish":
          return adminApi.POST("/api/admin/banners/{banner_id}/unpublish", path);
        // The Owner's queue is shared by every kind of content.
        case "approve":
          return decide("banner", id, "approve");
        case "reject":
          return decide("banner", id, "reject", reason);
      }
    },
    onSuccess: refresh,
  }).mutateAsync;
  const save = useMutation({
    mutationFn: (body: BannerPatch) =>
      adminApi.PATCH("/api/admin/banners/{banner_id}", { ...path, body }),
    onSuccess: refresh,
  }).mutateAsync;
  const removeImage = useMutation({
    mutationFn: () => adminApi.DELETE("/api/admin/banners/{banner_id}/image", path),
    onSuccess: refresh,
  }).mutateAsync;
  const removeMobile = useMutation({
    mutationFn: () => adminApi.DELETE("/api/admin/banners/{banner_id}/mobile-image", path),
    onSuccess: refresh,
  }).mutateAsync;
  const setAlt = useMutation({
    mutationFn: (alt_text: string) =>
      adminApi.PATCH("/api/admin/banners/{banner_id}/image", { ...path, body: { alt_text } }),
    onSuccess: refresh,
  }).mutateAsync;
  const upload = useMutation({
    mutationFn: (args: { which: "image" | "mobile-image"; file: File; altText?: string }) =>
      uploadImage(id, args.which, args),
    onSuccess: refresh,
  }).mutateAsync;
  return { move, save, removeImage, removeMobile, setAlt, upload };
}
