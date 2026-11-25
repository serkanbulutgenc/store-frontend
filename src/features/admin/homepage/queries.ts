import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { Section } from "./layout";

export const homepageKeys = { all: ["admin", "homepage"] as const };

/** The live layout (every section, hidden ones included), the Staff change waiting for the
 * Owner, if any, and why the last one was rejected. */
export type HomepageEditing = {
  sections: Section[];
  pending: { sections: Section[]; submitted_by: string | null; submitted_at: string } | null;
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
