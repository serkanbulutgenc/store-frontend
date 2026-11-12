import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { CustomerDetailScreen } from "@/features/admin/customers/customer-detail";
import { customerQuery } from "@/features/admin/customers/queries";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/customers/$id")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_customers"),
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw notFound();
    try {
      await context.queryClient.query(customerQuery(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function CustomerPage() {
    const { id } = Route.useParams();
    return <CustomerDetailScreen id={Number(id)} />;
  },
});
