import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/account/components/profile-page";

export const Route = createFileRoute("/_storefront/_customer/hesap/")({
  head: () => ({ meta: [{ title: "Hesabım | Aura Tekstil" }] }),
  component: ProfilePage,
});
