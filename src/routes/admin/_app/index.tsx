import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/features/admin/home/home-screen";
import { homeQuery } from "@/features/admin/returns/queries";

export const Route = createFileRoute("/admin/_app/")({
  // Every Dashboard user has an Ana sayfa; the API decides which Widgets they may see.
  loader: ({ context }) => context.queryClient.query(homeQuery()),
  component: function HomePage() {
    const { me } = Route.useRouteContext();
    return <HomeScreen me={me} />;
  },
});
