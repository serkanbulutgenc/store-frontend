import { createFileRoute } from "@tanstack/react-router";
import { NewCampaignPage } from "@/features/admin/campaign-pages/new-campaign-page";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/campaign-pages/new")({
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_campaign_pages"),
  component: NewCampaignPage,
});
