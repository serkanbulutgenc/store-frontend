import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";
import { type CollectionAction, pendingKind } from "./rules";

export type CollectionRow = components["schemas"]["CollectionRowOut"];
export type CollectionOut = components["schemas"]["CollectionOut"];
export type CollectionPatch = components["schemas"]["CollectionPatch"];

export const collectionKeys = { all: ["admin", "collections"] as const };

/** The Collections, newest first. No status means all of them. */
export const collectionsQuery = (status?: string) =>
  queryOptions({
    queryKey: [...collectionKeys.all, "list", status ?? "all"],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/collections", {
          params: { query: { status: status as CollectionRow["status"] | undefined } },
        })
      ).data as CollectionRow[],
  });

export const collectionQuery = (id: number) =>
  queryOptions({
    queryKey: [...collectionKeys.all, "one", id],
    // The cover image's derivatives are made by a worker: look again until they exist.
    refetchInterval: (query) => (query.state.data?.image?.status === "processing" ? 2000 : false),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/collections/{collection_id}", {
          params: { path: { collection_id: id } },
        })
      ).data as CollectionOut,
  });

/** The Collection's moves and edits; each refreshes the list and the Collection when it succeeds. */
export function useCollectionActions(id: number) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: collectionKeys.all });
  const path = { params: { path: { collection_id: id } } };
  const move = useMutation({
    mutationFn: async ({ action, reason }: { action: CollectionAction; reason?: string }) => {
      switch (action) {
        case "submit":
          return adminApi.POST("/api/admin/collections/{collection_id}/submit", path);
        case "withdraw":
          return adminApi.POST("/api/admin/collections/{collection_id}/withdraw", path);
        case "approve":
          return adminApi.POST("/api/admin/collections/{collection_id}/approve", path);
        case "reject":
          return adminApi.POST("/api/admin/collections/{collection_id}/reject", {
            ...path,
            body: { reason: reason ?? "" },
          });
        case "publish":
          return adminApi.POST("/api/admin/collections/{collection_id}/publish", path);
        case "unpublish":
          return adminApi.POST("/api/admin/collections/{collection_id}/unpublish", path);
      }
    },
    onSuccess: refresh,
  }).mutateAsync;
  const save = useMutation({
    mutationFn: ({ body, toChange }: { body: CollectionPatch; toChange: boolean }) =>
      toChange
        ? adminApi.PATCH("/api/admin/collections/{collection_id}/pending-change", {
            ...path,
            body,
          })
        : adminApi.PATCH("/api/admin/collections/{collection_id}", { ...path, body }),
    onSuccess: refresh,
  }).mutateAsync;
  const remove = useMutation({
    mutationFn: () => adminApi.DELETE("/api/admin/collections/{collection_id}", path),
    onSuccess: refresh,
  }).mutateAsync;
  const removeImage = useMutation({
    mutationFn: () => adminApi.DELETE("/api/admin/collections/{collection_id}/image", path),
    onSuccess: refresh,
  }).mutateAsync;
  const setAlt = useMutation({
    mutationFn: (alt_text: string) =>
      adminApi.PATCH("/api/admin/collections/{collection_id}/image", {
        ...path,
        body: { alt_text },
      }),
    onSuccess: refresh,
  }).mutateAsync;
  const upload = useMutation({
    mutationFn: (args: { file: File; altText: string }) => uploadCollectionImage(id, args),
    onSuccess: refresh,
  }).mutateAsync;
  return { move, save, remove, removeImage, setAlt, upload };
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads (or replaces) the cover image; processing continues on the server. */
export async function uploadCollectionImage(
  id: number,
  { file, altText }: { file: File; altText: string },
): Promise<CollectionOut> {
  const form = new FormData();
  form.append("file", file);
  form.append("alt_text", altText);
  const response = await fetch(`/api/admin/collections/${id}/image`, {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return body as CollectionOut;
}

/** The Collections the Owner has to decide on: waiting submissions, and published ones with a
 * pending change. Shares the "all" list's cache entry, so any move or edit refreshes it. */
export const pendingCollectionsQuery = () =>
  queryOptions({
    ...collectionsQuery(),
    select: (rows) =>
      rows.filter((c) => pendingKind({ status: c.status, hasPendingChange: c.has_pending_change })),
  });

/** How many Collections wait for the Owner; undefined until known. For the nav badge. */
export function usePendingCollectionCount(enabled: boolean): number | undefined {
  return useQuery({ ...pendingCollectionsQuery(), enabled }).data?.length;
}
