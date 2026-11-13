import { createFileRoute } from "@tanstack/react-router";
import { FavoritesPage } from "@/features/favorites/components/favorites-page";

export const Route = createFileRoute("/_storefront/_customer/hesap/favoriler")({
  head: () => ({ meta: [{ title: "Favorilerim | Aura Tekstil" }] }),
  component: FavoritesPage,
});
