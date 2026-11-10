import { queryOptions, useMutation } from "@tanstack/react-query";
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
