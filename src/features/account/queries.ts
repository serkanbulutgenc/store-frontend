import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";
import type { AddressValues } from "./schemas";

export type Account = components["schemas"]["AccountOut"];
export type OrderRow = components["schemas"]["AccountOrderRow"];
export type AccountOrder = components["schemas"]["AccountOrderOut"];

export const ACCOUNT_KEY = ["store", "account"] as const;

/** The signed-in Customer, or null for a guest (401). The `_customer` guard and the header read this. */
export const accountQuery = queryOptions({
  queryKey: ACCOUNT_KEY,
  staleTime: 60_000,
  queryFn: async (): Promise<Account | null> => {
    try {
      return (await storeApi.GET("/api/store/account")).data as Account;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
      throw e;
    }
  },
});

export const addressesQuery = queryOptions({
  queryKey: [...ACCOUNT_KEY, "addresses"],
  queryFn: async () => (await storeApi.GET("/api/store/account/addresses")).data ?? [],
});

export const ordersQuery = (page: number) =>
  queryOptions({
    queryKey: [...ACCOUNT_KEY, "orders", page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (await storeApi.GET("/api/store/account/orders", { params: { query: { page } } })).data,
  });

export const orderQuery = (number: string) =>
  queryOptions({
    queryKey: [...ACCOUNT_KEY, "order", number],
    retry: (count, e) => !(e instanceof ApiError && e.status === 404) && count < 1,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/account/orders/{number}", {
          params: { path: { number } },
        })
      ).data as AccountOrder,
  });

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name?: string; phone?: string; marketing_consent?: boolean }) =>
      (await storeApi.PATCH("/api/store/account", { body })).data as Account,
    onSuccess: (account) => qc.setQueryData(ACCOUNT_KEY, account),
  });
}

function useAddressMutation<V>(run: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    // Setting a default changes other rows too, so refetch rather than patch the cache.
    onSettled: () => qc.invalidateQueries({ queryKey: addressesQuery.queryKey }),
  });
}

export const useSaveAddress = () =>
  useAddressMutation(async (v: { id?: number; values: AddressValues }) =>
    v.id === undefined
      ? storeApi.POST("/api/store/account/addresses", { body: v.values })
      : storeApi.PUT("/api/store/account/addresses/{address_id}", {
          params: { path: { address_id: v.id } },
          body: v.values,
        }),
  );

export const useDeleteAddress = () =>
  useAddressMutation(async (id: number) =>
    storeApi.DELETE("/api/store/account/addresses/{address_id}", {
      params: { path: { address_id: id } },
    }),
  );

export function useRequestDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await storeApi.POST("/api/store/account/deletion-request")).data as Account,
    onSuccess: (account) => qc.setQueryData(ACCOUNT_KEY, account),
  });
}
