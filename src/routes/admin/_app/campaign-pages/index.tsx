import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageSearchSchema } from "@/features/admin/campaign-pages/search";

// The list moved into the Kampanyalar screen as its second tab; old links land there.
export const Route = createFileRoute("/admin/_app/campaign-pages/")({
  validateSearch: pageSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/admin/campaigns", search: { tab: "pages", pstatus: search.status } });
  },
});
