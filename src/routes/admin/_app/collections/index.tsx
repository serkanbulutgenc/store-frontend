import { createFileRoute } from "@tanstack/react-router";
import { CollectionsScreen } from "@/features/admin/collections/collections-screen";
import { collectionsQuery } from "@/features/admin/collections/queries";
import { collectionSearchSchema } from "@/features/admin/collections/search";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/collections/")({
  validateSearch: collectionSearchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_collections"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(collectionsQuery(deps.status)),
  component: function CollectionsPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <CollectionsScreen
        search={search}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
