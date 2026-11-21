import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productQuery } from "@/features/catalog/queries";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type SubscribeOut = components["schemas"]["SubscribeOut"];
export type SubscribeBody = { variantId: number; email: string };

/** A signed-in Shopper sends no email: the backend uses the verified one on the account. */
export const useSubscribeStockAlert = (productSlug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, email }: SubscribeBody) =>
      (
        await storeApi.POST("/api/store/stock-alerts", {
          body: { variant_id: variantId, email, consent: true },
        })
      ).data as SubscribeOut,
    // A 409 `in_stock` means the picker is stale; refetch so the Size shows as available.
    onError: () => qc.invalidateQueries({ queryKey: productQuery(productSlug).queryKey }),
  });
};

export const useConfirmStockAlert = () =>
  useMutation({
    mutationFn: async (token: string) => {
      await storeApi.POST("/api/store/stock-alerts/confirm", { body: { token } });
    },
  });

export const useRejectStockAlert = () =>
  useMutation({
    mutationFn: async (token: string) => {
      await storeApi.POST("/api/store/stock-alerts/reject", { body: { token } });
    },
  });
