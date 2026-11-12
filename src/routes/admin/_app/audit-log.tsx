import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuditScreen } from "@/features/admin/audit/audit-screen";
import { type AuditSearch, auditQuery } from "@/features/admin/audit/queries";
import { AUDIT_ACTIONS } from "@/features/admin/audit/rules";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";
import { staffQuery } from "@/features/admin/staff/queries";

const day = z.iso.date().optional().catch(undefined);

const searchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  actor: z.coerce.number().int().positive().optional().catch(undefined),
  action: z
    .enum(Object.keys(AUDIT_ACTIONS) as [string, ...string[]])
    .optional()
    .catch(undefined),
  date_from: day,
  date_to: day,
});

export const Route = createFileRoute("/admin/_app/audit-log")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_audit_log"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.query(auditQuery(deps)),
      context.queryClient.query(staffQuery({ page: 1, size: 100 })),
    ]),
  component: function AuditLogPage() {
    const search: AuditSearch = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <AuditScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
