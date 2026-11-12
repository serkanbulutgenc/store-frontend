import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/features/admin/home/home-screen";
import { homeQuery } from "@/features/admin/returns/queries";
import { can } from "@/lib/api/me";

export const Route = createFileRoute("/admin/_app/")({
  // The Home lists need `view_orders`; without it the page stays the empty landing.
  loader: ({ context }) =>
    can(context.me, "view_orders") ? context.queryClient.query(homeQuery()) : undefined,
  component: function HomePage() {
    const { me } = Route.useRouteContext();
    return can(me, "view_orders") ? (
      <HomeScreen />
    ) : (
      <section>
        <h1 className="text-lg font-semibold">Ana sayfa</h1>
      </section>
    );
  },
});
