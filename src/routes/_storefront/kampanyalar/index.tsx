import { createFileRoute } from "@tanstack/react-router";
import { CampaignList } from "@/features/campaign-pages/components/campaign-pages";
import { campaignPagesQuery } from "@/features/campaign-pages/queries";
import { campaignListHead } from "@/features/campaign-pages/seo";

export const Route = createFileRoute("/_storefront/kampanyalar/")({
  loader: async ({ context }) => ({ pages: await context.queryClient.query(campaignPagesQuery) }),
  head: ({ match }) => campaignListHead(match.context.siteOrigin),
  component: function CampaignsRoute() {
    const { pages } = Route.useLoaderData();
    return <CampaignList pages={pages} />;
  },
});
