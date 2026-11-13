import { createFileRoute } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { attributesQuery } from "@/features/admin/catalog/attributes-queries";
import { AttributesScreen } from "@/features/admin/catalog/attributes-screen";
import { productClassesQuery } from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/product-classes/$classId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_attributes"),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query(productClassesQuery),
      context.queryClient.query(attributesQuery(Number(params.classId))),
    ]);
  },
  component: function Page() {
    const { classId } = Route.useParams();
    return <AttributesScreen classId={Number(classId)} />;
  },
});
