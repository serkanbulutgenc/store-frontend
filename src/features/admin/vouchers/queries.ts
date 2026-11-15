import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { VoucherRow } from "./form";

export const voucherKeys = { all: ["admin", "vouchers"] as const };

/** The vouchers, newest first. No status means all of them: an empty status is refused. */
export const vouchersQuery = (status?: string) =>
  queryOptions({
    queryKey: [...voucherKeys.all, "list", status ?? "all"],
    queryFn: async () =>
      (await adminApi.GET("/api/admin/vouchers", { params: { query: { status } } }))
        .data as VoucherRow[],
  });

/** Open, close and delete a voucher; each refreshes the list when it succeeds. */
export function useVoucherActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: voucherKeys.all });
  const path = (id: number) => ({ params: { path: { voucher_id: id } } });
  const toggle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "activate" | "deactivate" }) =>
      action === "activate"
        ? adminApi.POST("/api/admin/vouchers/{voucher_id}/activate", path(id))
        : adminApi.POST("/api/admin/vouchers/{voucher_id}/deactivate", path(id)),
    onSuccess: refresh,
  }).mutateAsync;
  const remove = useMutation({
    mutationFn: (id: number) => adminApi.DELETE("/api/admin/vouchers/{voucher_id}", path(id)),
    onSuccess: refresh,
  }).mutateAsync;
  return { toggle, remove };
}
