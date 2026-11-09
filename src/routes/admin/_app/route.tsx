import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/features/admin/components/admin-shell";

/** Guard: UX only, the API enforces access. `me` comes from the root `beforeLoad`. */
export const Route = createFileRoute("/admin/_app")({
  beforeLoad: ({ context, location }) => {
    if (!context.me) throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    return { me: context.me };
  },
  component: function AdminApp() {
    const { me } = Route.useRouteContext();
    return <AdminShell me={me} />;
  },
});
