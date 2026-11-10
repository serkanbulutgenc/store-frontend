import { createFileRoute } from "@tanstack/react-router";
import { AddressesPage } from "@/features/account/components/addresses-page";

export const Route = createFileRoute("/_storefront/_customer/hesap/adresler")({
  head: () => ({ meta: [{ title: "Adreslerim | Aura Tekstil" }] }),
  component: AddressesPage,
});
