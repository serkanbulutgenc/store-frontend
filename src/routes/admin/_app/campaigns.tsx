import { createFileRoute } from "@tanstack/react-router";
import { CampaignsScreen } from "@/features/admin/campaigns/campaigns-screen";
import { campaignsQuery } from "@/features/admin/campaigns/queries";
import { campaignSearchSchema } from "@/features/admin/campaigns/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/campaigns")({
  validateSearch: campaignSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_campaigns"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(campaignsQuery(deps)),
  component: function CampaignsPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <CampaignsScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
