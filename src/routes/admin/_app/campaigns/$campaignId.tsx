import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { CampaignEditorPage } from "@/features/admin/campaigns/campaign-editor";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/campaigns/$campaignId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_campaigns"),
  loader: ({ params }) => {
    if (!Number.isInteger(Number(params.campaignId))) throw notFound();
  },
  component: function CampaignPage() {
    const { campaignId } = Route.useParams();
    return <CampaignEditorPage id={Number(campaignId)} />;
  },
});
