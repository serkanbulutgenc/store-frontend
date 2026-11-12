import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ListSearch } from "../data-table/search";

export type AuditEntryOut = components["schemas"]["AuditEntryOut"];
export type AuditEntryDetail = components["schemas"]["AuditEntryDetail"];
export type PagedAuditEntryOut = components["schemas"]["PagedAuditEntryOut"];

export type AuditSearch = Pick<ListSearch, "page" | "size"> & {
  actor?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
};

export const auditQuery = (s: AuditSearch) =>
  queryOptions({
    queryKey: ["admin", "audit-log", "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/audit-log", {
          params: {
            query: {
              actor: s.actor,
              action: s.action,
              date_from: s.date_from,
              date_to: s.date_to,
              page: s.page,
              page_size: s.size,
            },
          },
        })
      ).data as PagedAuditEntryOut,
  });

export const auditEntryQuery = (id: number) =>
  queryOptions({
    queryKey: ["admin", "audit-log", "detail", id],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/audit-log/{entry_id}", {
          params: { path: { entry_id: id } },
        })
      ).data as AuditEntryDetail,
  });
