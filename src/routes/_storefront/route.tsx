import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AnnouncementBar } from "@/features/banners/components/announcement-bar";
import { bannersQuery } from "@/features/banners/queries";
import { SiteFooter } from "@/features/catalog/components/site-footer";
import { SiteHeader } from "@/features/catalog/components/site-header";
import { PendingFavorite } from "@/features/favorites/components/heart-button";
import { menusQuery } from "@/features/menus/queries";

export const Route = createFileRoute("/_storefront")({
  loader: async ({ context }) => {
    const [menus, banners] = await Promise.all([
      context.queryClient.query(menusQuery),
      // Banners are optional: a failure must not take the storefront down.
      context.queryClient.query(bannersQuery()).catch(() => null),
    ]);
    return { ...menus, announcement: banners?.announcement ?? [] };
  },
  component: function StorefrontLayout() {
    const menus = Route.useLoaderData();
    return (
      <div data-theme="storefront" className="min-h-screen bg-background text-foreground">
        <AnnouncementBar messages={menus.announcement} />
        <SiteHeader items={menus.header} />
        <PendingFavorite />
        <Outlet />
        <SiteFooter items={menus.footer} />
      </div>
    );
  },
});
