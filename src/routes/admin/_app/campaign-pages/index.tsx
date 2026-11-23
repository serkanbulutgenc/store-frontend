import { createFileRoute } from "@tanstack/react-router";
import { CampaignPagesScreen } from "@/features/admin/campaign-pages/campaign-pages-screen";
import { pagesQuery } from "@/features/admin/campaign-pages/queries";
import { pageSearchSchema } from "@/features/admin/campaign-pages/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/campaign-pages/")({
  validateSearch: pageSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_campaign_pages"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(pagesQuery(deps.status)),
  component: function CampaignPagesPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <CampaignPagesScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
