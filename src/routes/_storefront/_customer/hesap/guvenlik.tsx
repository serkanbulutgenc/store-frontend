import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/features/account/components/security-page";

export const Route = createFileRoute("/_storefront/_customer/hesap/guvenlik")({
  head: () => ({ meta: [{ title: "Güvenlik | Aura Tekstil" }] }),
  component: SecurityPage,
});
