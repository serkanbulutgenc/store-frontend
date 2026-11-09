import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ErrorState, NotFoundState, PendingState } from "@/components/route-states";
import { createErrorHandler } from "@/lib/api/handle-error";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const onError = createErrorHandler({
    // The proxy already cleared the cookie; drop cached data so the next user never sees it.
    onUnauthorized: () => {
      queryClient.clear();
      void router.invalidate();
    },
  });
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
  });
  const router = createRouter({
    routeTree,
    context: { me: null, queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPendingComponent: PendingState,
    defaultErrorComponent: ErrorState,
    defaultNotFoundComponent: () => <NotFoundState />,
    // biome-ignore lint/correctness/noComponentHookFactories: closes over the per-request QueryClient
    Wrap: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
