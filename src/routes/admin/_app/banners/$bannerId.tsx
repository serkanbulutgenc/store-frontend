import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { BannerEditor } from "@/features/admin/banners/banner-editor";
import { bannerQuery } from "@/features/admin/banners/queries";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/banners/$bannerId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_banners"),
  loader: async ({ context, params }) => {
    const id = Number(params.bannerId);
    if (!Number.isInteger(id)) throw notFound();
    try {
      await context.queryClient.query(bannerQuery(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function BannerPage() {
    const { bannerId } = Route.useParams();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return <BannerEditor bannerId={Number(bannerId)} me={me} />;
  },
});
