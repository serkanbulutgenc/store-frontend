import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { ACCOUNT_KEY, accountQuery } from "@/features/account/queries";
import type { ProductCard } from "@/features/catalog/queries";
import { storeApi } from "@/lib/api/clients";

export const favoritesQuery = queryOptions({
  queryKey: [...ACCOUNT_KEY, "favorites"],
  staleTime: 60_000,
  queryFn: async (): Promise<ProductCard[]> =>
    (await storeApi.GET("/api/store/account/favorites")).data ?? [],
});

/** The signed-in Shopper's hearted Product ids (at most 200); empty for a guest. */
export function useFavoriteIds() {
  const { data: account, isPending: accountPending } = useQuery(accountQuery);
  const { data, isSuccess } = useQuery({ ...favoritesQuery, enabled: Boolean(account) });
  const ids = useMemo(() => new Set((data ?? []).map((p) => p.id)), [data]);
  // `ready` is false while we cannot yet tell a guest from a Shopper whose hearts are loading.
  return { signedIn: Boolean(account), ready: !accountPending && (!account || isSuccess), ids };
}

export function useSetFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, on }: { productId: number; on: boolean }) => {
      const params = { params: { path: { product_id: productId } } };
      await (on
        ? storeApi.PUT("/api/store/account/favorites/{product_id}", params)
        : storeApi.DELETE("/api/store/account/favorites/{product_id}", params));
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: favoritesQuery.queryKey }),
  });
}
