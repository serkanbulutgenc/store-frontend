import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsScreen } from "@/features/admin/approvals/approvals-screen";
import { approvalsQuery } from "@/features/admin/approvals/queries";
import { requireOwner } from "@/features/admin/guard";

export const Route = createFileRoute("/admin/_app/approvals")({
  beforeLoad: ({ context }) => requireOwner(context.me),
  loader: ({ context }) => context.queryClient.query(approvalsQuery()),
  component: ApprovalsScreen,
});
