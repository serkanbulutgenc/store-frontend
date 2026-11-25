import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
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
