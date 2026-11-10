import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { settingsQuery } from "@/features/admin/settings/queries";
import { SettingsScreen } from "@/features/admin/settings/settings-screen";

export const Route = createFileRoute("/admin/_app/settings")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_settings"),
  loader: ({ context }) => context.queryClient.query(settingsQuery),
  component: SettingsScreen,
});
