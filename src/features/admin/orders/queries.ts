import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ListSearch } from "../data-table/search";

export type OrderRow = components["schemas"]["OrderRow"];
export type OrderDetail = components["schemas"]["OrderDetail"];
export type PagedOrderRow = components["schemas"]["PagedOrderRow"];

export type OrdersSearch = ListSearch & { status?: string; payment_status?: string };

export const orderKeys = {
  all: ["admin", "orders"] as const,
  detail: (number: string) => ["admin", "orders", "detail", number] as const,
};

export const ordersQuery = (s: OrdersSearch) =>
  queryOptions({
    queryKey: [...orderKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/orders", {
          params: {
            query: {
              q: s.q,
              status: s.status,
              payment_status: s.payment_status,
              ordering: s.ordering,
              page: s.page,
              page_size: s.size,
            },
          },
        })
      ).data as PagedOrderRow,
  });

export const orderQuery = (number: string) =>
  queryOptions({
    queryKey: orderKeys.detail(number),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/orders/{number}", {
          params: { path: { number } },
        })
      ).data as OrderDetail,
  });

type S = components["schemas"];
type Num = { number: string };

function useOrderMutation<V extends Num>(fn: (v: V) => Promise<OrderDetail | undefined>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (detail, v) => {
      if (detail) qc.setQueryData(orderKeys.detail(v.number), detail);
      await qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

const path = (number: string) => ({ params: { path: { number } } });

export const useMarkPaid = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderPayIn"] }) =>
      (await adminApi.POST("/api/admin/orders/{number}/pay", { ...path(v.number), body: v.body }))
        .data,
  );
export const useCancelOrder = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderCancelIn"] }) =>
      (
        await adminApi.POST("/api/admin/orders/{number}/cancel", {
          ...path(v.number),
          body: v.body,
        })
      ).data,
  );
export const useShipOrder = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderShipIn"] }) =>
      (await adminApi.POST("/api/admin/orders/{number}/ship", { ...path(v.number), body: v.body }))
        .data,
  );
export const useRefundOrder = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderRefundIn"] }) =>
      (
        await adminApi.POST("/api/admin/orders/{number}/refund", {
          ...path(v.number),
          body: v.body,
        })
      ).data,
  );
export const useDeliverOrder = () =>
  useOrderMutation(
    async (v: Num) =>
      (await adminApi.POST("/api/admin/orders/{number}/deliver", path(v.number))).data,
  );
export const useRequestReturn = () =>
  useOrderMutation(
    async (v: Num) =>
      (await adminApi.POST("/api/admin/orders/{number}/request-return", path(v.number))).data,
  );
export const useMarkReturned = () =>
  useOrderMutation(
    async (v: Num) =>
      (await adminApi.POST("/api/admin/orders/{number}/mark-returned", path(v.number))).data,
  );
export const useEditShipping = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderShippingPatch"] }) =>
      (
        await adminApi.PATCH("/api/admin/orders/{number}/shipping", {
          ...path(v.number),
          body: v.body,
        })
      ).data,
  );
export const useCorrectEmail = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderEmailIn"] }) =>
      (
        await adminApi.PATCH("/api/admin/orders/{number}/email", {
          ...path(v.number),
          body: v.body,
        })
      ).data,
  );
export const useSetInvoiceDetails = () =>
  useOrderMutation(
    async (v: Num & { body: S["OrderInvoiceDetailsPatch"] }) =>
      (
        await adminApi.PATCH("/api/admin/orders/{number}/invoice-details", {
          ...path(v.number),
          body: v.body,
        })
      ).data,
  );
