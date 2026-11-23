import { createFileRoute } from "@tanstack/react-router";
import { BannersScreen } from "@/features/admin/banners/banners-screen";
import { bannersQuery } from "@/features/admin/banners/queries";
import { bannerSearchSchema } from "@/features/admin/banners/search";
import { requirePermission } from "@/features/admin/guard";
import { can } from "@/lib/api/me";

export const Route = createFileRoute("/admin/_app/banners/")({
  validateSearch: bannerSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_banners"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(bannersQuery(deps.status, deps.slot)),
  component: function BannersPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const { me } = Route.useRouteContext();
    return (
      <BannersScreen
        owner={can(me, "manage_banners")}
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
