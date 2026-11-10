import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";

export type StaffUserOut = components["schemas"]["StaffUserOut"];
export type DeletionRequestOut = components["schemas"]["DeletionRequestOut"];
type Page = { page: number; size: number };

const staffKey = ["admin", "staff"] as const;
const deletionKey = ["admin", "account-deletions"] as const;

export const staffQuery = (p: Page) =>
  queryOptions({
    queryKey: [...staffKey, p],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/staff", {
          params: { query: { page: p.page, page_size: p.size } },
        })
      ).data as components["schemas"]["PagedStaffUserOut"],
  });

export const deletionsQuery = (p: Page) =>
  queryOptions({
    queryKey: [...deletionKey, p],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/account-deletions", {
          params: { query: { page: p.page, page_size: p.size } },
        })
      ).data as components["schemas"]["PagedDeletionRequestOut"],
  });

function useRefreshing<V>(key: readonly unknown[], fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export const useInviteStaff = () =>
  useRefreshing(staffKey, async (body: { email: string; name: string }) =>
    adminApi.POST("/api/admin/staff", { body }),
  );
export const useDeactivateStaff = () =>
  useRefreshing(staffKey, async (id: number) =>
    adminApi.POST("/api/admin/staff/{user_id}/deactivate", { params: { path: { user_id: id } } }),
  );
export const useCompleteDeletion = () =>
  useRefreshing(deletionKey, async (id: number) =>
    adminApi.POST("/api/admin/account-deletions/{request_id}/complete", {
      params: { path: { request_id: id } },
    }),
  );
export const useDeclineDeletion = () =>
  useRefreshing(deletionKey, async (id: number) =>
    adminApi.POST("/api/admin/account-deletions/{request_id}/decline", {
      params: { path: { request_id: id } },
    }),
  );
