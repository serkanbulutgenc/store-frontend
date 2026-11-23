import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { threadQuery } from "@/features/admin/contact/queries";
import { ThreadScreen } from "@/features/admin/contact/thread-screen";
import { requirePermission } from "@/features/admin/guard";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/admin/_app/contact/$threadId")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_contact"),
  loader: async ({ context, params }) => {
    const id = Number(params.threadId);
    if (!Number.isInteger(id)) throw notFound();
    try {
      await context.queryClient.query(threadQuery(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  component: function ContactThreadPage() {
    const { threadId } = Route.useParams();
    const { me } = Route.useRouteContext();
    if (!me) return null;
    return <ThreadScreen threadId={Number(threadId)} me={me} />;
  },
});
