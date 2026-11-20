import { createFileRoute } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { classGuideQuery, productClassesQuery } from "@/features/admin/catalog/queries";
import { ClassSizeGuideScreen } from "@/features/admin/catalog/size-guide-screen";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/product-classes/$classId_/size-guide")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  // Owner and Staff both edit guides; the Product classes screen itself stays Owner-only.
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_products"),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query(productClassesQuery),
      context.queryClient.query(classGuideQuery(Number(params.classId))),
    ]);
  },
  component: function Page() {
    const { classId } = Route.useParams();
    const { me } = Route.useRouteContext();
    return <ClassSizeGuideScreen classId={Number(classId)} me={me} />;
  },
});
