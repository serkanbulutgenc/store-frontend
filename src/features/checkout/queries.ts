import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { basketQuery } from "@/features/basket/queries";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";

export type CheckoutQuote = components["schemas"]["QuoteOut"];

/**
 * What the basket costs sent to `province`. The backend prices it with the same service that
 * places the Order, so the figures match what is charged. The basket's lines are in the key so
 * a quantity change refetches; the previous quote stays on screen meanwhile.
 */
export function useCheckoutQuote(
  basket: { subtotal: string; lines: { id: number; quantity: number }[] },
  province: string,
  method: components["schemas"]["PaymentMethod"],
  enabled: boolean,
) {
  const lines = basket.lines.map((l) => `${l.id}:${l.quantity}`).join(",");
  return useQuery({
    queryKey: ["store", "checkout-quote", { lines, subtotal: basket.subtotal, province, method }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 0,
    queryFn: async () =>
      (
        await storeApi.POST("/api/store/checkout/quote", {
          body: { province, payment_method: method },
        })
      ).data as CheckoutQuote,
  });
}

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
