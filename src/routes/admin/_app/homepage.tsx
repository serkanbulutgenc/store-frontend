import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { HomepageScreen } from "@/features/admin/homepage/homepage-screen";
import { homepageLayoutQuery } from "@/features/admin/homepage/queries";

export const Route = createFileRoute("/admin/_app/homepage")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_homepage"),
  loader: ({ context }) => context.queryClient.query(homepageLayoutQuery),
  component: HomepageScreen,
});
