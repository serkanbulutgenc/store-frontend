import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACCOUNT_KEY } from "@/features/account/queries";
import { storeApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../api/specs/openapi-store";

export type TrackedOrder = components["schemas"]["TrackingOut"];

/** The signed link opens one Order; a bad or expired token is a 404 the page renders. */
export const trackingLinkQuery = (token: string) =>
  queryOptions({
    queryKey: ["store", "tracking", "link", token],
    // A bad link stays bad; anything else gets one more try.
    retry: (count, e) => !(e instanceof ApiError && e.status === 404) && count < 1,
    staleTime: 0,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/tracking/link/{token}", {
          params: { path: { token } },
        })
      ).data as TrackedOrder,
  });

export const useTrackOrder = () =>
  useMutation({
    mutationFn: async (body: { number: string; contact: string }) =>
      (await storeApi.POST("/api/store/tracking", { body })).data as TrackedOrder,
  });

export type ReturnBody = components["schemas"]["ReturnIn"];

/** How the Shopper proves the Order is theirs: the signed link, or their account. */
export type OrderAccess = { kind: "link"; token: string } | { kind: "account"; number: string };

/** Cancel and return-request calls for one Order; the page shows the fresh Order after. */
export function useOrderActions(access: OrderAccess) {
  const qc = useQueryClient();
  const refresh = (order: TrackedOrder) => {
    if (access.kind === "link") qc.setQueryData(trackingLinkQuery(access.token).queryKey, order);
    else {
      qc.setQueryData([...ACCOUNT_KEY, "order", access.number], order);
      void qc.invalidateQueries({ queryKey: [...ACCOUNT_KEY, "orders"] });
    }
  };
  const cancel = useMutation({
    mutationFn: async () =>
      access.kind === "link"
        ? ((
            await storeApi.POST("/api/store/tracking/link/{token}/cancel", {
              params: { path: { token: access.token } },
            })
          ).data as TrackedOrder)
        : ((
            await storeApi.POST("/api/store/account/orders/{number}/cancel", {
              params: { path: { number: access.number } },
            })
          ).data as TrackedOrder),
    onSuccess: refresh,
  });
  const requestReturn = useMutation({
    mutationFn: async (body: ReturnBody) =>
      access.kind === "link"
        ? ((
            await storeApi.POST("/api/store/tracking/link/{token}/returns", {
              params: { path: { token: access.token } },
              body,
            })
          ).data as TrackedOrder)
        : ((
            await storeApi.POST("/api/store/account/orders/{number}/returns", {
              params: { path: { number: access.number } },
              body,
            })
          ).data as TrackedOrder),
    onSuccess: refresh,
  });
  return { cancel, requestReturn };
}
