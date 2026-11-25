import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";
import type { Section } from "./layout";

export const homepageKeys = { all: ["admin", "homepage"] as const };

/** The live layout (every section, hidden ones included), the Staff change waiting for the
 * Owner, if any, and why the last one was rejected. */
export type HomepageEditing = {
  sections: Section[];
  /** Section id -> why the Storefront skips that visible section (nothing to show). */
  warnings: Record<string, string>;
  pending: {
    sections: Section[];
    warnings: Record<string, string>;
    submitted_by: string | null;
    submitted_at: string;
  } | null;
  rejection_reason: string;
};

export const homepageLayoutQuery = queryOptions({
  queryKey: homepageKeys.all,
  queryFn: async () => (await adminApi.GET("/api/admin/homepage")).data as HomepageEditing,
});

/** Save the whole layout; the answer is the layout as now stored, which becomes the cached one.
 * The Owner's save is live, so the Storefront's own copy is dropped; a Staff save only waits. */
export function useSaveHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: Section[]) =>
      (await adminApi.PUT("/api/admin/homepage", { body: { sections } })).data as HomepageEditing,
    onSuccess: (saved) => {
      qc.setQueryData(homepageLayoutQuery.queryKey, saved);
      void qc.invalidateQueries({ queryKey: ["store", "homepage"] });
    },
  }).mutateAsync;
}

/** One approved version of the layout, as listed in its history. */
export type LayoutVersion = {
  version: number;
  approved_at: string;
  approved_by: string | null;
  section_count: number;
};

export const homepageVersionsQuery = queryOptions({
  queryKey: [...homepageKeys.all, "versions"] as const,
  queryFn: async () => (await adminApi.GET("/api/admin/homepage/versions")).data as LayoutVersion[],
});

/** Put an earlier version back live (Owner only). It becomes a new version; the answer is the
 * layout as now stored. */
export function useRestoreHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) =>
      (
        await adminApi.POST("/api/admin/homepage/versions/{version}/restore", {
          params: { path: { version } },
        })
      ).data as HomepageEditing,
    onSuccess: (restored) => {
      qc.setQueryData(homepageLayoutQuery.queryKey, restored);
      void qc.invalidateQueries({ queryKey: homepageVersionsQuery.queryKey });
      void qc.invalidateQueries({ queryKey: ["store", "homepage"] });
    },
  }).mutateAsync;
}

/** An image that belongs to one section (an Afiş, or a slide of a Slayt). */
export type LayoutImage = components["schemas"]["LayoutImageOut"];

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALT_MAX = 255;
export const LINK_MAX = 500;

/** The section images among `ids`, in that order. The server makes the smaller pictures after an
 * upload, so look again until none is still processing. */
export const layoutImagesQuery = (ids: number[]) =>
  queryOptions({
    queryKey: [...homepageKeys.all, "images", ids] as const,
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.some(
        (i) => i.image?.status === "processing" || i.mobile_image?.status === "processing",
      )
        ? 2000
        : false,
    queryFn: async () =>
      (await adminApi.GET("/api/admin/homepage/images", { params: { query: { ids } } }))
        .data as LayoutImage[],
  });

type Upload = { file: File; altText?: string; link?: string };

/** Uploads a picture: a new image, the main picture of `imageId`, or its mobile picture. */
export async function uploadLayoutImage(
  { file, altText, link }: Upload,
  target: { imageId?: number; which?: "image" | "mobile-image" } = {},
): Promise<LayoutImage> {
  const form = new FormData();
  form.append("file", file);
  if (altText !== undefined) form.append("alt_text", altText);
  if (link !== undefined) form.append("link", link);
  const base = "/api/admin/homepage/images";
  const url = target.imageId === undefined ? base : `${base}/${target.imageId}/${target.which}`;
  const response = await fetch(url, { method: "POST", body: form }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return body as LayoutImage;
}

/** Edits of one section image; each refreshes the images being shown. */
export function useLayoutImageActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: [...homepageKeys.all, "images"] });
  const upload = useMutation({
    mutationFn: ({
      imageId,
      which,
      ...rest
    }: Upload & { imageId?: number; which?: "image" | "mobile-image" }) =>
      uploadLayoutImage(rest, { imageId, which }),
    onSuccess: refresh,
  }).mutateAsync;
  const edit = useMutation({
    mutationFn: ({ imageId, ...body }: { imageId: number; alt_text?: string; link?: string }) =>
      adminApi.PATCH("/api/admin/homepage/images/{image_id}", {
        params: { path: { image_id: imageId } },
        body,
      }),
    onSuccess: refresh,
  }).mutateAsync;
  const removeMobile = useMutation({
    mutationFn: (imageId: number) =>
      adminApi.DELETE("/api/admin/homepage/images/{image_id}/mobile-image", {
        params: { path: { image_id: imageId } },
      }),
    onSuccess: refresh,
  }).mutateAsync;
  return { upload, edit, removeMobile };
}
