import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteFooter } from "@/features/catalog/components/site-footer";
import { SiteHeader } from "@/features/catalog/components/site-header";
import { categoriesQuery } from "@/features/catalog/queries";
import { PendingFavorite } from "@/features/favorites/components/heart-button";
import { legalPagesQuery } from "@/features/legal/queries";

export const Route = createFileRoute("/_storefront")({
  loader: async ({ context }) => {
    const [categories, legalPages] = await Promise.all([
      context.queryClient.query(categoriesQuery),
      context.queryClient.query(legalPagesQuery),
    ]);
    return { categories, legalPages };
  },
  component: function StorefrontLayout() {
    const { categories, legalPages } = Route.useLoaderData();
    return (
      <div data-theme="storefront" className="min-h-screen bg-background text-foreground">
        <SiteHeader categories={categories} />
        <PendingFavorite />
        <Outlet />
        <SiteFooter pages={legalPages} />
      </div>
    );
  },
});
