import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type Basket = components["schemas"]["BasketOut"];
export type BasketLine = components["schemas"]["BasketLineOut"];
export type PublicSettings = components["schemas"]["PublicSettingsOut"];

export const basketQuery = queryOptions({
  queryKey: ["store", "basket"],
  staleTime: 0,
  queryFn: async () => (await storeApi.GET("/api/store/basket")).data as Basket,
});

export const settingsQuery = queryOptions({
  queryKey: ["store", "settings"],
  staleTime: 60_000,
  queryFn: async () => (await storeApi.GET("/api/store/settings")).data as PublicSettings,
});

/** Every basket mutation returns the whole basket, which becomes the cached truth. */
function useBasketMutation<V>(run: (v: V) => Promise<Basket>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    scope: { id: "basket" }, // one at a time, so responses cannot land out of order
    onSuccess: (basket) => qc.setQueryData(basketQuery.queryKey, basket),
    // A 409 means stock moved; the Shopper must see the basket as it is now.
    onError: () => qc.invalidateQueries({ queryKey: basketQuery.queryKey }),
  });
}

export const useAddToBasket = () =>
  useBasketMutation(
    async (v: { variantId: number; quantity?: number }) =>
      (
        await storeApi.POST("/api/store/basket/lines", {
          body: { variant_id: v.variantId, quantity: v.quantity ?? 1 },
        })
      ).data as Basket,
  );

export const useSetQuantity = () =>
  useBasketMutation(
    async (v: { lineId: number; quantity: number }) =>
      (
        await storeApi.PATCH("/api/store/basket/lines/{line_id}", {
          params: { path: { line_id: v.lineId } },
          body: { quantity: v.quantity },
        })
      ).data as Basket,
  );

export const useRemoveLine = () =>
  useBasketMutation(
    async (lineId: number) =>
      (
        await storeApi.DELETE("/api/store/basket/lines/{line_id}", {
          params: { path: { line_id: lineId } },
        })
      ).data as Basket,
  );
