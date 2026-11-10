import { createFileRoute } from "@tanstack/react-router";
import { SecurityScreen } from "@/features/admin/security/security-screen";

/** No permission guard: an Owner who has not enrolled 2FA has none, and this is how they fix that. */
export const Route = createFileRoute("/admin/_app/security")({
  component: function Page() {
    const { me } = Route.useRouteContext();
    return <SecurityScreen me={me} />;
  },
});
