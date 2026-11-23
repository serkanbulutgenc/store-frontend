import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { CampaignPageEditor } from "@/features/admin/campaign-pages/campaign-page-editor";
import { pageQuery } from "@/features/admin/campaign-pages/queries";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/campaign-pages/$pageId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_campaign_pages"),
  loader: async ({ context, params }) => {
    const id = Number(params.pageId);
    if (!Number.isInteger(id)) throw notFound();
    try {
      await context.queryClient.query(pageQuery(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function CampaignPagePage() {
    const { pageId } = Route.useParams();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return <CampaignPageEditor pageId={Number(pageId)} me={me} />;
  },
});
