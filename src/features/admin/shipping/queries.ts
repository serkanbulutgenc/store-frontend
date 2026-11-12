import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import { keys as catalogKeys } from "../catalog/queries";

export type ShippingOut = components["schemas"]["ShippingOut"];
export type RateOut = components["schemas"]["RateOut"];
export type ProvinceOut = components["schemas"]["ProvinceOut"];
export type ZoneOut = components["schemas"]["ZoneOut"];
export type ProductClassOut = components["schemas"]["ProductClassOut"];

const key = ["admin", "shipping"] as const;

export const shippingQuery = queryOptions({
  queryKey: key,
  queryFn: async () => (await adminApi.GET("/api/admin/shipping")).data as ShippingOut,
});

function useShippingMutation<V, R>(
  fn: (v: V) => Promise<R>,
  extra: readonly (readonly unknown[])[] = [],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([key, ...extra].map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

export const useUpdateRate = () =>
  useShippingMutation(
    async (v: { id: number; body: components["schemas"]["RatePatch"] }) =>
      (
        await adminApi.PATCH("/api/admin/shipping/rates/{rate_id}", {
          params: { path: { rate_id: v.id } },
          body: v.body,
        })
      ).data as RateOut,
  );

export const useMoveProvince = () =>
  useShippingMutation(
    async (v: { id: number; zone_id: number }) =>
      (
        await adminApi.PATCH("/api/admin/shipping/provinces/{province_id}", {
          params: { path: { province_id: v.id } },
          body: { zone_id: v.zone_id },
        })
      ).data as ProvinceOut,
  );

export const useRenameZone = () =>
  useShippingMutation(
    async (v: { id: number; name: string }) =>
      (
        await adminApi.PATCH("/api/admin/shipping/zones/{zone_id}", {
          params: { path: { zone_id: v.id } },
          body: { name: v.name },
        })
      ).data as ZoneOut,
  );

/** Product classes are shared with the product editor, so refresh its list too. */
export const useSetClassDesi = () =>
  useShippingMutation(
    async (v: { id: number; default_desi: number }) =>
      (
        await adminApi.PATCH("/api/admin/product-classes/{class_id}", {
          params: { path: { class_id: v.id } },
          body: { default_desi: v.default_desi },
        })
      ).data as ProductClassOut,
    [catalogKeys.refs],
  );
