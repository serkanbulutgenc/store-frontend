import { createFileRoute } from "@tanstack/react-router";
import { brandsQuery } from "@/features/admin/catalog/queries";
import { BrandsScreen } from "@/features/admin/catalog/references";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/brands")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_brands"),
  loader: ({ context }) => context.queryClient.query(brandsQuery),
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <BrandsScreen me={me} />;
  },
});
