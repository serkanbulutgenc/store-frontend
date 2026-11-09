import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/features/catalog/components/site-header";
import { categoriesQuery } from "@/features/catalog/queries";

export const Route = createFileRoute("/_storefront")({
  loader: ({ context }) => context.queryClient.query(categoriesQuery),
  component: function StorefrontLayout() {
    const categories = Route.useLoaderData();
    return (
      <div data-theme="storefront" className="min-h-screen bg-background text-foreground">
        <SiteHeader categories={categories} />
        <Outlet />
      </div>
    );
  },
});
