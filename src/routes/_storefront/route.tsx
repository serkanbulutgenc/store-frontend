import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteFooter } from "@/features/catalog/components/site-footer";
import { SiteHeader } from "@/features/catalog/components/site-header";
import { PendingFavorite } from "@/features/favorites/components/heart-button";
import { menusQuery } from "@/features/menus/queries";

export const Route = createFileRoute("/_storefront")({
  loader: async ({ context }) => {
    return context.queryClient.query(menusQuery);
  },
  component: function StorefrontLayout() {
    const menus = Route.useLoaderData();
    return (
      <div data-theme="storefront" className="min-h-screen bg-background text-foreground">
        <SiteHeader items={menus.header} />
        <PendingFavorite />
        <Outlet />
        <SiteFooter items={menus.footer} />
      </div>
    );
  },
});
