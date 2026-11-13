import { createFileRoute } from "@tanstack/react-router";
import { ProductClassesScreen } from "@/features/admin/catalog/product-classes";
import { productClassesQuery } from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/product-classes/")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_product_classes"),
  loader: ({ context }) => context.queryClient.query(productClassesQuery),
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <ProductClassesScreen me={me} />;
  },
});
