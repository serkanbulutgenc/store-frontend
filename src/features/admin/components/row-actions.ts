import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import type { OnOffToggle } from "../on-off";

export type ToggleCall = (args: {
  id: number;
  action: "activate" | "deactivate";
}) => Promise<unknown>;

/**
 * Open, close and delete a row of a list (a Voucher, a Campaign); each refreshes the list when
 * it succeeds. The caller says which endpoints do it, so the paths stay typed.
 */
export function useRowActions({
  queryKey,
  activate,
  deactivate,
  remove,
}: {
  queryKey: QueryKey;
  activate: (id: number) => Promise<unknown>;
  deactivate: (id: number) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
}) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey });
  const toggle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "activate" | "deactivate" }) =>
      action === "activate" ? activate(id) : deactivate(id),
    onSuccess: refresh,
  }).mutateAsync;
  const removeRow = useMutation({ mutationFn: remove, onSuccess: refresh }).mutateAsync;
  return { toggle, remove: removeRow };
}

/** Flip a row's on/off switch and say how it went. */
export function useFlip<Row extends { id: number; status: string }>(
  toggle: ToggleCall,
  toggleFor: (status: string) => OnOffToggle,
) {
  return async (row: Row) => {
    const next = toggleFor(row.status);
    try {
      await toggle({ id: row.id, action: next.action });
      toast.success(next.success);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    }
  };
}

/** Deleting the last row of a later page leaves that page empty: step back to the last one. */
export function useStepBackWhenEmpty(
  list: { items: unknown[]; total: number; page_size: number },
  page: number,
  onPage: (patch: { page: number }) => void,
) {
  const pages = Math.max(1, Math.ceil(list.total / list.page_size));
  const empty = list.items.length === 0;
  useEffect(() => {
    if (empty && page > pages) onPage({ page: pages });
  }, [empty, page, pages, onPage]);
}
