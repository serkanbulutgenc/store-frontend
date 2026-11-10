import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/features/checkout/components/checkout-page";

export const Route = createFileRoute("/_storefront/odeme")({
  head: () => ({
    meta: [{ title: "Ödeme | Aura Tekstil" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckoutPage,
});
