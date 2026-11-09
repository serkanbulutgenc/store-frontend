import { createFileRoute } from "@tanstack/react-router";
import { browseSearchSchema, pageNumbers } from "@/features/catalog/browse-search";
import { ListingRoute } from "@/features/catalog/components/listing-route";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { listingHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/ara")({
  validateSearch: browseSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [categories] = await Promise.all([
      context.queryClient.query(categoriesQuery),
      ...pageNumbers(deps.page).map((page) =>
        context.queryClient.query(productsPageQuery(deps, { page })),
      ),
    ]);
    return categories;
  },
  head: ({ match }) =>
    listingHead({
      title: match.search.q ? `“${match.search.q}” için sonuçlar` : "Tüm ürünler",
      path: "/ara",
      search: match.search,
      kind: "search",
      origin: match.context.siteOrigin,
    }),
  component: function SearchPage() {
    const categories = Route.useLoaderData();
    const search = Route.useSearch();
    return (
      <ListingRoute
        title={search.q ? `“${search.q}” için sonuçlar` : "Tüm ürünler"}
        search={search}
        categories={categories}
        navigate={Route.useNavigate()}
      />
    );
  },
});
