import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { BasketCampaignEditorPage } from "@/features/admin/basket-campaigns/basket-campaign-editor";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/basket-campaigns/$campaignId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_campaigns"),
  loader: ({ params }) => {
    if (!Number.isInteger(Number(params.campaignId))) throw notFound();
  },
  component: function BasketCampaignPage() {
    const { campaignId } = Route.useParams();
    return <BasketCampaignEditorPage id={Number(campaignId)} />;
  },
});
