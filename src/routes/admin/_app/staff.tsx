import { createFileRoute } from "@tanstack/react-router";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";
import { staffQuery } from "@/features/admin/staff/queries";
import { StaffScreen } from "@/features/admin/staff/staff-screen";

export const Route = createFileRoute("/admin/_app/staff")({
  validateSearch: listSearchSchema.pick({ page: true, size: true }),
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_staff_users"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query(staffQuery({ page: deps.page, size: deps.size })),
  component: function Page() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <StaffScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
