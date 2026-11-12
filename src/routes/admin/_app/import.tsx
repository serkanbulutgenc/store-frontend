import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { ImportScreen } from "@/features/admin/import/import-screen";

export const Route = createFileRoute("/admin/_app/import")({
  beforeLoad: ({ context }) => requirePermission(context.me, "import_catalogue"),
  component: ImportScreen,
});
