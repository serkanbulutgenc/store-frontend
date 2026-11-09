import type { QueryClient } from "@tanstack/react-query";
import type { Me } from "./me";

export const ME_KEY = ["me"] as const;
const ME_STALE_MS = 60_000;

/**
 * `/me` for the root `beforeLoad`, which runs on every navigation and every intent
 * preload. Cached so those cost nothing. Drop the entry on login (`removeQueries`);
 * logout and any 401 already `clear()` the whole cache.
 */
export function loadMe(
  queryClient: QueryClient,
  fetcher: () => Promise<Me | null>,
): Promise<Me | null> {
  return queryClient.query({ queryKey: ME_KEY, queryFn: fetcher, staleTime: ME_STALE_MS });
}
