import { createFileRoute } from "@tanstack/react-router";
import { PendingCollectionsScreen } from "@/features/admin/collections/pending-screen";
import { pendingCollectionsQuery } from "@/features/admin/collections/queries";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/collections/pending")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_collections"),
  loader: ({ context }) => context.queryClient.query(pendingCollectionsQuery()),
  component: PendingCollectionsScreen,
});
