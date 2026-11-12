import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { NotFoundState } from "@/components/route-states";
import { EDITOR_TABS, ProductEditor } from "@/features/admin/catalog/components/product-editor";
import {
  brandsQuery,
  categoriesQuery,
  coloursQuery,
  imagesQuery,
  productClassesQuery,
  productQuery,
  suppliersQuery,
} from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";
import { can } from "@/lib/api/me";

const searchSchema = z.object({
  tab: z.enum(EDITOR_TABS).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/_app/products/$productId")({
  validateSearch: searchSchema,
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_products"),
  loader: async ({ context, params }) => {
    const id = Number(params.productId);
    if (!Number.isInteger(id)) throw notFound();
    const qc = context.queryClient;
    try {
      await Promise.all([
        qc.query(productQuery(id)),
        qc.query(categoriesQuery),
        qc.query(brandsQuery),
        qc.query(productClassesQuery),
        qc.query(coloursQuery),
        can(context.me, "manage_suppliers") ? qc.query(suppliersQuery) : undefined,
        can(context.me, "manage_products") ? qc.query(imagesQuery(id)) : undefined,
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function ProductPage() {
    const { productId } = Route.useParams();
    const { me } = Route.useRouteContext();
    const { tab } = Route.useSearch();
    return <ProductEditor productId={Number(productId)} me={me} initialTab={tab} />;
  },
});
