import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ListSearch } from "../data-table/search";
import { orderKeys } from "../orders/queries";

type S = components["schemas"];
export type ReturnRow = S["ReturnRow"];
export type PagedReturnRow = S["PagedReturnRow"];
export type ReturnAdmin = S["ReturnAdminOut"];
export type OrderDetail = S["OrderDetail"];
export type HomeData = S["HomeOut"];

export type ReturnsSearch = Pick<ListSearch, "page" | "size"> & { status?: string };

export const returnKeys = { all: ["admin", "returns"] as const };
export const homeKey = ["admin", "home"] as const;

export const returnsQuery = (s: ReturnsSearch) =>
  queryOptions({
    queryKey: [...returnKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/returns", {
          params: { query: { status: s.status, page: s.page, page_size: s.size } },
        })
      ).data as PagedReturnRow,
  });

export const homeQuery = () =>
  queryOptions({
    queryKey: homeKey,
    queryFn: async () => (await adminApi.GET("/api/admin/home")).data as HomeData,
  });

type Target = { number: string; id: number };
const path = (v: Target) => ({ params: { path: { number: v.number, return_id: v.id } } });

function useReturnMutation<V extends Target>(fn: (v: V) => Promise<OrderDetail | undefined>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (detail, v) => {
      if (detail) qc.setQueryData(orderKeys.detail(v.number), detail);
      await Promise.all([
        qc.invalidateQueries({ queryKey: orderKeys.all }),
        qc.invalidateQueries({ queryKey: returnKeys.all }),
        qc.invalidateQueries({ queryKey: homeKey }),
      ]);
    },
  });
}

export const useApproveReturn = () =>
  useReturnMutation(
    async (v: Target) =>
      (await adminApi.POST("/api/admin/orders/{number}/returns/{return_id}/approve", path(v))).data,
  );
export const useRejectReturn = () =>
  useReturnMutation(
    async (v: Target & { body: S["ReturnRejectIn"] }) =>
      (
        await adminApi.POST("/api/admin/orders/{number}/returns/{return_id}/reject", {
          ...path(v),
          body: v.body,
        })
      ).data,
  );
export const useReceiveReturn = () =>
  useReturnMutation(
    async (v: Target & { body: S["ReturnReceiveIn"] }) =>
      (
        await adminApi.POST("/api/admin/orders/{number}/returns/{return_id}/receive", {
          ...path(v),
          body: v.body,
        })
      ).data,
  );
export const useRefundReturn = () =>
  useReturnMutation(
    async (v: Target & { body: S["OrderRefundIn"] }) =>
      (
        await adminApi.POST("/api/admin/orders/{number}/returns/{return_id}/refund", {
          ...path(v),
          body: v.body,
        })
      ).data,
  );
