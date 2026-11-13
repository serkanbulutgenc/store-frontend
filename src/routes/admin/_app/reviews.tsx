import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requirePermission } from "@/features/admin/guard";
import { adminReviewsQuery } from "@/features/admin/reviews/queries";
import { ReviewsScreen } from "@/features/admin/reviews/reviews-screen";
import { can } from "@/lib/api/me";

const searchSchema = z.object({
  status: z.enum(["pending", "published", "rejected"]).catch("pending").default("pending"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export const Route = createFileRoute("/admin/_app/reviews")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_products"),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(adminReviewsQuery(deps)),
  component: function ReviewsPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const { me } = Route.useRouteContext();
    return (
      <ReviewsScreen
        search={search}
        canManage={can(me, "manage_products")}
        onSearchChange={(patch) => navigate({ search: { ...search, ...patch } })}
      />
    );
  },
});
