import { createFileRoute } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";
import { requirePermission } from "@/features/admin/guard";
import { LegalEditor } from "@/features/admin/legal/legal-editor";
import { legalVersionQuery, legalVersionsQuery } from "@/features/admin/legal/queries";

export const Route = createFileRoute("/admin/_app/legal-pages/$page")({
  notFoundComponent: () => <NotFoundState home="/admin" />,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_legal_pages"),
  loader: async ({ context, params }) => {
    const versions = await context.queryClient.query(legalVersionsQuery(params.page));
    const latest = versions[0];
    if (latest) await context.queryClient.query(legalVersionQuery(params.page, latest.version));
  },
  component: function LegalPageRoute() {
    const { page } = Route.useParams();
    return <LegalEditor page={page} />;
  },
});
