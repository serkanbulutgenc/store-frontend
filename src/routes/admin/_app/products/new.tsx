import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductForm } from "@/features/admin/catalog/components/product-form";
import {
  brandsQuery,
  categoriesQuery,
  productClassesQuery,
} from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/products/new")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_products"),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(categoriesQuery),
      context.queryClient.query(brandsQuery),
      context.queryClient.query(productClassesQuery),
    ]),
  component: function NewProduct() {
    const { me } = Route.useRouteContext();
    const navigate = useNavigate();
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="text-muted-foreground underline">
            Ürünler
          </Link>
          <h1 className="text-lg font-semibold">Yeni ürün</h1>
        </div>
        <p className="text-muted-foreground">
          Ürünü oluşturduktan sonra varyantları (renk ve beden) eklersiniz.
        </p>
        <ProductForm
          me={me}
          onSaved={(p) =>
            navigate({ to: "/admin/products/$productId", params: { productId: String(p.id) } })
          }
        />
      </div>
    );
  },
});
