import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StockAlertLinkPage } from "@/features/stock-alerts/components/stock-alert-link-page";

export const Route = createFileRoute("/_storefront/stok-bildirimi/onayla")({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Stok bildirimi | Auraa Giyim" },
      { name: "robots", content: "noindex" },
      // The token in the address must not travel to other sites.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: function StockAlertConfirmRoute() {
    const { token } = Route.useSearch();
    return <StockAlertLinkPage action="confirm" token={token} />;
  },
});
