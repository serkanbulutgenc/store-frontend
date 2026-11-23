import { createFileRoute } from "@tanstack/react-router";
import { CampaignEditorPage } from "@/features/admin/campaigns/campaign-editor";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/campaigns/new")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_campaigns"),
  component: () => <CampaignEditorPage />,
});
