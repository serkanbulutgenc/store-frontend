import { createFileRoute } from "@tanstack/react-router";
import { requireOwner } from "@/features/admin/guard";
import { ReportsScreen } from "@/features/admin/reports/reports-screen";
import { reportSearchSchema } from "@/features/admin/reports/search";

export const Route = createFileRoute("/admin/_app/reports")({
  validateSearch: reportSearchSchema,
  beforeLoad: ({ context }) => requireOwner(context.me),
  component: function ReportsPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <ReportsScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
