import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { Section } from "./layout";

export const homepageKeys = { all: ["admin", "homepage"] as const };

/** The saved Homepage layout with every section, hidden ones included. */
export const homepageLayoutQuery = queryOptions({
  queryKey: homepageKeys.all,
  queryFn: async () =>
    ((await adminApi.GET("/api/admin/homepage")).data?.sections ?? []) as Section[],
});

/** Replace the whole layout; the answer is the saved layout, which becomes the cached one. The
 * Storefront's own copy is dropped so the Owner sees the change at once. */
export function useSaveHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: Section[]) =>
      ((await adminApi.PUT("/api/admin/homepage", { body: { sections } })).data?.sections ??
        []) as Section[],
    onSuccess: (saved) => {
      qc.setQueryData(homepageLayoutQuery.queryKey, saved);
      void qc.invalidateQueries({ queryKey: ["store", "homepage"] });
    },
  }).mutateAsync;
}
