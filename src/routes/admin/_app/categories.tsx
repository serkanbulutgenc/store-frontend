import { createFileRoute } from "@tanstack/react-router";
import { categoriesQuery } from "@/features/admin/catalog/queries";
import { CategoriesScreen } from "@/features/admin/catalog/references";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/categories")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_categories"),
  loader: ({ context }) => context.queryClient.query(categoriesQuery),
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <CategoriesScreen me={me} />;
  },
});
