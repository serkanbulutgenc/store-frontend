import { createFileRoute } from "@tanstack/react-router";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";
import { DeletionsScreen } from "@/features/admin/staff/deletions-screen";
import { deletionsQuery } from "@/features/admin/staff/queries";

export const Route = createFileRoute("/admin/_app/account-deletions")({
  validateSearch: listSearchSchema.pick({ page: true, size: true }),
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_account_deletions"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(deletionsQuery({ page: deps.page, size: deps.size })),
  component: function Page() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <DeletionsScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
