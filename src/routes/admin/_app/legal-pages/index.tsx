import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { LegalScreen } from "@/features/admin/legal/legal-screen";
import { legalPagesAdminQuery } from "@/features/admin/legal/queries";

export const Route = createFileRoute("/admin/_app/legal-pages/")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_legal_pages"),
  loader: ({ context }) => context.queryClient.query(legalPagesAdminQuery),
  component: LegalScreen,
});
