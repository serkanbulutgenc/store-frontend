import { createFileRoute } from "@tanstack/react-router";
import { BasketCampaignEditorPage } from "@/features/admin/basket-campaigns/basket-campaign-editor";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/basket-campaigns/new")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_campaigns"),
  component: () => <BasketCampaignEditorPage />,
});
