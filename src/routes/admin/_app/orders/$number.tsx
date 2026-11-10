import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { OrderDetailScreen } from "@/features/admin/orders/components/order-detail";
import { orderQuery } from "@/features/admin/orders/queries";

export const Route = createFileRoute("/admin/_app/orders/$number")({
  beforeLoad: ({ context }) => requirePermission(context.me, "view_orders"),
  loader: ({ context, params }) => context.queryClient.query(orderQuery(params.number)),
  component: function OrderPage() {
    const { number } = Route.useParams();
    const { me } = Route.useRouteContext();
    return <OrderDetailScreen number={number} me={me} />;
  },
});
