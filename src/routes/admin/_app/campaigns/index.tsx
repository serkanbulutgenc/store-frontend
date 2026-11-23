import { createFileRoute, redirect } from "@tanstack/react-router";
import { pagesQuery } from "@/features/admin/campaign-pages/queries";
import { CampaignsScreen } from "@/features/admin/campaigns/campaigns-screen";
import { campaignsQuery } from "@/features/admin/campaigns/queries";
import { campaignSearchSchema } from "@/features/admin/campaigns/search";
import { can } from "@/lib/api/me";

export const Route = createFileRoute("/admin/_app/campaigns/")({
  validateSearch: campaignSearchSchema,
  // Campaigns for the Owner, pages for Staff: either permission opens the screen.
  beforeLoad: ({ context, search }) => {
    // An old link (an Order's) opened a Campaign in a dialog through `?edit=`.
    if (search.edit !== undefined)
      throw redirect({
        to: "/admin/campaigns/$campaignId",
        params: { campaignId: String(search.edit) },
      });
    if (!can(context.me, "manage_campaigns") && !can(context.me, "edit_campaign_pages"))
      throw redirect({ to: "/admin" });
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const pages =
      deps.tab === "pages" ||
      (!can(context.me, "manage_campaigns") && can(context.me, "edit_campaign_pages"));
    return pages
      ? context.queryClient.query(pagesQuery(deps.pstatus))
      : context.queryClient.query(campaignsQuery(deps));
  },
  component: function CampaignsPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return (
      <CampaignsScreen
        me={me}
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
