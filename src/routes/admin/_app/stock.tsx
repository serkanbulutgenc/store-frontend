import { createFileRoute } from "@tanstack/react-router";
import { StockScreen } from "@/features/admin/catalog/components/stock-screen";
import { lowStockQuery } from "@/features/admin/catalog/queries";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/stock")({
  validateSearch: listSearchSchema.pick({ page: true, size: true }),
  beforeLoad: ({ context }) => requirePermission(context.me, "view_products"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(lowStockQuery(deps)),
  component: function StockPage() {
    const search = Route.useSearch();
    const { me } = Route.useRouteContext();
    const navigate = Route.useNavigate();
    return (
      <StockScreen
        search={search}
        me={me}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
