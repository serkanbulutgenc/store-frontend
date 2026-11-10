import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TrackingPage } from "@/features/tracking/components/tracking-page";

export const Route = createFileRoute("/_storefront/siparis-takip")({
  validateSearch: z.object({ t: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Sipariş takibi | Aura Tekstil" },
      { name: "robots", content: "noindex" },
      // The token in the address must not travel to other sites.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: function TrackingRoute() {
    const { t } = Route.useSearch();
    return <TrackingPage token={t} />;
  },
});
