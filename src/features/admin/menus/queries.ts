import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { MenuItemRow } from "./tree";
import { toBody } from "./tree";

export type MenuKey = "header" | "footer";
export type MenuRow = components["schemas"]["MenuOut"];
export type MenuTarget = components["schemas"]["MenuTargetOut"];

export const MENUS: { key: MenuKey; label: string }[] = [
  { key: "header", label: "Üst menü" },
  { key: "footer", label: "Alt menü" },
];

export const menuKeys = { all: ["admin", "menus"] as const };

/** The saved Menu with every item, including hidden and non-public ones, each flagged. */
export const menuQuery = (key: MenuKey) =>
  queryOptions({
    queryKey: [...menuKeys.all, key],
    queryFn: async () =>
      (await adminApi.GET("/api/admin/menus/{key}", { params: { path: { key } } })).data as MenuRow,
  });

/** Categories, Legal pages, Products and Brands whose name matches `q`. */
export const menuTargetsQuery = (q: string) =>
  queryOptions({
    queryKey: [...menuKeys.all, "targets", q],
    queryFn: async () =>
      (await adminApi.GET("/api/admin/menu-targets", { params: { query: { q } } }))
        .data as MenuTarget[],
  });

/** Replace the whole Menu; the answer is the saved tree, which becomes the cached Menu. */
export function useSaveMenu(key: MenuKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: MenuItemRow[]) =>
      (
        await adminApi.PUT("/api/admin/menus/{key}", {
          params: { path: { key } },
          body: { items: toBody(items) },
        })
      ).data as MenuRow,
    onSuccess: (saved) => qc.setQueryData(menuQuery(key).queryKey, saved),
  }).mutateAsync;
}
