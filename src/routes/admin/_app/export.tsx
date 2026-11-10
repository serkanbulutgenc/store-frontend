import { createFileRoute } from "@tanstack/react-router";
import { ExportScreen } from "@/features/admin/export/export-screen";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/export")({
  beforeLoad: ({ context }) => requirePermission(context.me, "export_accountant_csv"),
  component: ExportScreen,
});
