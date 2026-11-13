import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";

export type LegalRow = components["schemas"]["AdminLegalRow"];
export type LegalVersion = components["schemas"]["AdminLegalVersion"];

const ROOT = ["admin", "legal"] as const;

export const legalPagesAdminQuery = queryOptions({
  queryKey: [...ROOT, "pages"],
  queryFn: async () => (await adminApi.GET("/api/admin/legal-pages")).data as LegalRow[],
});

export const legalVersionsQuery = (page: string) =>
  queryOptions({
    queryKey: [...ROOT, "versions", page],
    queryFn: async () => {
      try {
        return (
          await adminApi.GET("/api/admin/legal-pages/{page}/versions", {
            params: { path: { page } },
          })
        ).data as LegalRow[];
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) throw notFound();
        throw e;
      }
    },
  });

export const legalVersionQuery = (page: string, version: number) =>
  queryOptions({
    queryKey: [...ROOT, "version", page, version],
    // A saved version never changes.
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/legal-pages/{page}/versions/{version}", {
          params: { path: { page, version } },
        })
      ).data as LegalVersion,
  });

/** Saving publishes at once, so the Storefront's cached pages and settings are stale too. */
export const usePublishLegalPage = (page: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["PublishIn"]) =>
      (
        await adminApi.POST("/api/admin/legal-pages/{page}/versions", {
          params: { path: { page } },
          body,
        })
      ).data as LegalVersion,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ROOT }),
        qc.invalidateQueries({ queryKey: ["store", "legal"] }),
        qc.invalidateQueries({ queryKey: ["store", "settings"] }),
        qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
      ]),
  });
};
