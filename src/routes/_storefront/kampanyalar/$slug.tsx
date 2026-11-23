import { createFileRoute } from "@tanstack/react-router";
import { CampaignPageView } from "@/features/campaign-pages/components/campaign-pages";
import { campaignPageQuery } from "@/features/campaign-pages/queries";
import { campaignPageHead } from "@/features/campaign-pages/seo";

export const Route = createFileRoute("/_storefront/kampanyalar/$slug")({
  // An unpublished or unstarted page is a 404 from the API, which the query turns into notFound.
  loader: async ({ context, params }) => ({
    page: await context.queryClient.query(campaignPageQuery(params.slug)),
  }),
  head: ({ loaderData, match }) =>
    loaderData ? campaignPageHead(loaderData.page, match.context.siteOrigin) : {},
  component: function CampaignPageRoute() {
    const { page } = Route.useLoaderData();
    return <CampaignPageView page={page} />;
  },
});
