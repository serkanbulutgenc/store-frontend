import { createFileRoute } from "@tanstack/react-router";
import { InboxScreen } from "@/features/admin/contact/inbox-screen";
import { threadsQuery } from "@/features/admin/contact/queries";
import { contactSearchSchema } from "@/features/admin/contact/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/contact/")({
  validateSearch: contactSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_contact"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.me ? context.queryClient.query(threadsQuery(deps, context.me.id)) : undefined,
  component: function ContactInboxPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return (
      <InboxScreen
        search={search}
        me={me}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
