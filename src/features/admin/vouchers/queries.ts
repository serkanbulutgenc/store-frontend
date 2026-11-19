import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import { useRowActions } from "../components/row-actions";
import type { VoucherSearch } from "./search";

export type PagedVoucherRow = components["schemas"]["PagedVoucherAdminOut"];

export const voucherKeys = { all: ["admin", "vouchers"] as const };

/** One page of the vouchers, newest first. No status means all of them: an empty status is refused. */
export const vouchersQuery = (s: VoucherSearch) =>
  queryOptions({
    queryKey: [...voucherKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/vouchers", {
          params: { query: { status: s.status, page: s.page, page_size: s.size } },
        })
      ).data as PagedVoucherRow,
  });

/** Open, close and delete a voucher; each refreshes the list when it succeeds. */
export function useVoucherActions() {
  const path = (id: number) => ({ params: { path: { voucher_id: id } } });
  return useRowActions({
    queryKey: voucherKeys.all,
    activate: (id) => adminApi.POST("/api/admin/vouchers/{voucher_id}/activate", path(id)),
    deactivate: (id) => adminApi.POST("/api/admin/vouchers/{voucher_id}/deactivate", path(id)),
    remove: (id) => adminApi.DELETE("/api/admin/vouchers/{voucher_id}", path(id)),
  });
}
