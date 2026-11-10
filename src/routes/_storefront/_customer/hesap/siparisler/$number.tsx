import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/features/account/components/orders-pages";

export const Route = createFileRoute("/_storefront/_customer/hesap/siparisler/$number")({
  head: () => ({ meta: [{ title: "Sipariş | Aura Tekstil" }] }),
  component: function OrderRoute() {
    return <OrderDetailPage number={Route.useParams().number} />;
  },
});
