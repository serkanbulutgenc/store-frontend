import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { fetchMe } from "@/lib/api/fetch-me";
import type { Me } from "@/lib/api/me";
import { loadMe } from "@/lib/api/me-query";
import { fetchSiteOrigin } from "@/lib/site-origin";
import appCss from "@/styles.css?url";

export type RouterContext = { me: Me | null; siteOrigin: string; queryClient: QueryClient };

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    const [me, siteOrigin] = await Promise.all([
      loadMe(context.queryClient, () => fetchMe()),
      context.queryClient.ensureQueryData({
        queryKey: ["site-origin"],
        staleTime: Number.POSITIVE_INFINITY,
        queryFn: () => fetchSiteOrigin(),
      }),
    ]);
    return { me, siteOrigin };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aura Tekstil" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => (
    <RootDocument>
      <Outlet />
    </RootDocument>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
