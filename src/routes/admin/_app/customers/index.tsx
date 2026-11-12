import { createFileRoute } from "@tanstack/react-router";
import { CustomersScreen } from "@/features/admin/customers/customers-screen";
import { customersQuery } from "@/features/admin/customers/queries";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/customers/")({
  validateSearch: listSearchSchema.pick({ page: true, size: true, q: true }),
  beforeLoad: ({ context }) => requirePermission(context.me, "view_customers"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(customersQuery(deps)),
  component: function CustomersPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <CustomersScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
