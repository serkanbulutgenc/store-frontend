import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { coloursQuery, imagesQuery, productQuery } from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";
import { PhotosScreen } from "@/features/admin/photos/photos-screen";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/products/$productId_/photos")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_products"),
  loader: async ({ context, params }) => {
    const id = Number(params.productId);
    if (!Number.isInteger(id)) throw notFound();
    const qc = context.queryClient;
    try {
      await Promise.all([
        qc.query(productQuery(id)),
        qc.query(imagesQuery(id)),
        qc.query(coloursQuery),
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function PhotosPage() {
    const { productId } = Route.useParams();
    return <PhotosScreen productId={Number(productId)} />;
  },
});
