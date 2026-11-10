import { createFileRoute } from "@tanstack/react-router";
import { ConfirmationPage } from "@/features/checkout/components/confirmation-page";

export const Route = createFileRoute("/_storefront/siparis-onayi")({
  head: () => ({
    meta: [{ title: "Siparişiniz alındı | Aura Tekstil" }, { name: "robots", content: "noindex" }],
  }),
  component: ConfirmationPage,
});
