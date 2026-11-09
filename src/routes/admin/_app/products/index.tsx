import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProductsScreen } from "@/features/admin/catalog/components/products-screen";
import { isExactCode } from "@/features/admin/catalog/labels";
import {
  categoriesQuery,
  type ProductsSearch,
  productQuery,
  productsQuery,
} from "@/features/admin/catalog/queries";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";

const searchSchema = listSearchSchema.extend({
  status: z.enum(["draft", "published", "archived"]).optional().catch(undefined),
  category_id: z.coerce.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/admin/_app/products/")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_products"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.query(productsQuery(deps)),
      context.queryClient.query(categoriesQuery),
    ]),
  component: function ProductsPage() {
    const search: ProductsSearch = Route.useSearch();
    const { me, queryClient } = Route.useRouteContext();
    const navigate = Route.useNavigate();

    async function onSearchChange(patch: Partial<ProductsSearch>) {
      const next = { ...search, ...patch };
      // Scanning a barcode or typing an exact SKU opens the Product. A title search never
      // jumps: the user may want to see and refine the list.
      if (patch.q) {
        try {
          const result = await queryClient.query(productsQuery({ ...next, page: 1 }));
          const only = result.total === 1 ? result.items[0] : undefined;
          if (only) {
            const product = await queryClient.query(productQuery(only.id));
            if (isExactCode(product.variants, patch.q)) {
              await navigate({
                to: "/admin/products/$productId",
                params: { productId: String(only.id) },
              });
              return;
            }
          }
        } catch {
          // Fall through to the plain list; its own loader reports the error.
        }
      }
      await navigate({ search: next });
    }
    return <ProductsScreen search={search} me={me} onSearchChange={onSearchChange} />;
  },
});
