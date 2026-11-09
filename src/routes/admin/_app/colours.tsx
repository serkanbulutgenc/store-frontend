import { createFileRoute } from "@tanstack/react-router";
import { coloursQuery } from "@/features/admin/catalog/queries";
import { ColoursScreen } from "@/features/admin/catalog/references";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/colours")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_colours"),
  loader: ({ context }) => context.queryClient.query(coloursQuery),
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <ColoursScreen me={me} />;
  },
});
