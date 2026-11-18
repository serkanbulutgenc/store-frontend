import { createFileRoute } from "@tanstack/react-router";
import { NewCollectionScreen } from "@/features/admin/collections/new-screen";
import { requirePermission } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/collections/new")({
  beforeLoad: ({ context }) => requirePermission(context.me, "edit_collections"),
  component: NewCollectionScreen,
});
