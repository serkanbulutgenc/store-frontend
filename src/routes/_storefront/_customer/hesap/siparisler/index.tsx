import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OrdersPage } from "@/features/account/components/orders-pages";

export const Route = createFileRoute("/_storefront/_customer/hesap/siparisler/")({
  validateSearch: z.object({ page: z.coerce.number().int().min(1).catch(1).default(1) }),
  head: () => ({ meta: [{ title: "Siparişlerim | Aura Tekstil" }] }),
  component: function OrdersRoute() {
    return <OrdersPage page={Route.useSearch().page} />;
  },
});
