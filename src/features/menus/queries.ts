import { queryOptions } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type Menus = components["schemas"]["MenusOut"];

/** The Header and Footer Menus, already resolved by the API: hidden and non-public items are
 * left out, labels and links follow their targets. */
export const menusQuery = queryOptions({
  queryKey: ["store", "menus"] as const,
  queryFn: async () => (await storeApi.GET("/api/store/menus")).data as Menus,
});
