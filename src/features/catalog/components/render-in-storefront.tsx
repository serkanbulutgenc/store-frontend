import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Cards render router Links, so a rail needs a router and a query client around it.
const root = createRootRoute();
const router = createRouter({
  routeTree: root.addChildren([
    createRoute({ getParentRoute: () => root, path: "/urun/$slug" }),
    createRoute({ getParentRoute: () => root, path: "/kampanyalar/$slug" }),
  ]),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

/** Test helper: the static markup of `node` inside a router and a query client. */
export const renderInStorefront = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <RouterContextProvider router={router}>{node}</RouterContextProvider>
    </QueryClientProvider>,
  );
