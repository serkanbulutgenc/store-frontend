import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { vouchersQuery } from "@/features/admin/vouchers/queries";
import { voucherSearchSchema } from "@/features/admin/vouchers/search";
import { VouchersScreen } from "@/features/admin/vouchers/vouchers-screen";

export const Route = createFileRoute("/admin/_app/vouchers")({
  validateSearch: voucherSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_vouchers"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(vouchersQuery(deps)),
  component: function VouchersPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <VouchersScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
