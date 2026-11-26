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
        queryFn: () => fetchSiteOrigin().catch(() => ""),
      }),
    ]);
    return { me, siteOrigin };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Auraa Giyim" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=DM+Sans:wght@400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
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
