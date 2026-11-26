import { createFileRoute } from "@tanstack/react-router";
import { BasketPage } from "@/features/basket/components/basket-page";

export const Route = createFileRoute("/_storefront/sepet")({
  head: () => ({
    meta: [{ title: "Sepetim | Auraa Giyim" }, { name: "robots", content: "noindex" }],
  }),
  component: BasketPage,
});
