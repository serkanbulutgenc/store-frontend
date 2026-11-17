import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { CollectionEditor } from "@/features/admin/collections/collection-editor";
import { collectionQuery } from "@/features/admin/collections/queries";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/collections/$collectionId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_collections"),
  loader: async ({ context, params }) => {
    const id = Number(params.collectionId);
    if (!Number.isInteger(id)) throw notFound();
    try {
      await context.queryClient.query(collectionQuery(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function CollectionPage() {
    const { collectionId } = Route.useParams();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return <CollectionEditor collectionId={Number(collectionId)} me={me} />;
  },
});
