import { useMutation, useQueryClient } from "@tanstack/react-query";
import { basketQuery } from "@/features/basket/queries";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";

export type PlacedOrder = components["schemas"]["OrderPlacedOut"];

/** The confirmation page reads the placed Order from here; there is no endpoint to refetch it. */
export const placedOrderKey = ["store", "placed-order"] as const;

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["CheckoutIn"]) =>
      (await storeApi.POST("/api/store/checkout", { body })).data as PlacedOrder,
    onSuccess: (order) => {
      qc.setQueryData(placedOrderKey, order);
    },
    onError: (e) => {
      // 409: stock vanished or a Legal page changed. Refresh what the Shopper is looking at.
      if (e instanceof ApiError && e.status === 409) {
        void qc.invalidateQueries({ queryKey: basketQuery.queryKey });
        void qc.invalidateQueries({ queryKey: ["store", "settings"] });
      }
    },
  });
}
