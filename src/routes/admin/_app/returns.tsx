import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";
import { ReturnsScreen } from "@/features/admin/returns/components/returns-screen";
import { type ReturnsSearch, returnsQuery } from "@/features/admin/returns/queries";
import { RETURN_STATUSES } from "@/features/admin/returns/rules";

const searchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  status: z
    .enum(RETURN_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/admin/_app/returns")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_orders"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(returnsQuery(deps)),
  component: function ReturnsPage() {
    const search: ReturnsSearch = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <ReturnsScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
