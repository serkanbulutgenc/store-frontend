import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { listSearchSchema } from "@/features/admin/data-table/search";
import { requirePermission } from "@/features/admin/guard";
import { OrdersScreen } from "@/features/admin/orders/components/orders-screen";
import { type OrdersSearch, ordersQuery } from "@/features/admin/orders/queries";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/features/admin/orders/rules";

const searchSchema = listSearchSchema.extend({
  status: z
    .enum(ORDER_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
  payment_status: z
    .enum(PAYMENT_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/admin/_app/orders/")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "view_orders"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(ordersQuery(deps)),
  component: function OrdersPage() {
    const search: OrdersSearch = Route.useSearch();
    const { me } = Route.useRouteContext();
    const navigate = Route.useNavigate();
    return (
      <OrdersScreen
        search={search}
        me={me}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
