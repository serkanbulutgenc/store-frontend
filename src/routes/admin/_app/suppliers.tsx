import { createFileRoute } from "@tanstack/react-router";
import { suppliersQuery } from "@/features/admin/catalog/queries";
import { SuppliersScreen } from "@/features/admin/catalog/references";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/suppliers")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_suppliers"),
  loader: ({ context }) => context.queryClient.query(suppliersQuery),
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <SuppliersScreen me={me} />;
  },
});
