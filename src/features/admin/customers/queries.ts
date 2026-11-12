import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ListSearch } from "../data-table/search";

export type CustomerRow = components["schemas"]["CustomerRow"];
export type CustomerDetail = components["schemas"]["CustomerDetail"];
export type PagedCustomerRow = components["schemas"]["PagedCustomerRow"];

export const customerKeys = {
  all: ["admin", "customers"] as const,
  detail: (id: number) => ["admin", "customers", "detail", id] as const,
};

export const customersQuery = (s: ListSearch) =>
  queryOptions({
    queryKey: [...customerKeys.all, "list", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/customers", {
          params: { query: { q: s.q, page: s.page, page_size: s.size } },
        })
      ).data as PagedCustomerRow,
  });

export const customerQuery = (id: number) =>
  queryOptions({
    queryKey: customerKeys.detail(id),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/customers/{customer_id}", {
          params: { path: { customer_id: id } },
        })
      ).data as CustomerDetail,
  });
