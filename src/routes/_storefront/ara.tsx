import { createFileRoute } from "@tanstack/react-router";
import {
  browseSearchSchema,
  listKey,
  loaderPageNumbers,
  loaderSearch,
} from "@/features/catalog/browse-search";
import { ListingPending, ListingRoute } from "@/features/catalog/components/listing-route";
import { categoriesQuery, productsPageQuery, type SeedPages } from "@/features/catalog/queries";
import { listingHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/ara")({
  validateSearch: browseSearchSchema,
  pendingComponent: ListingPending,
  pendingMs: 100,
  loaderDeps: ({ search }) => loaderSearch(search),
  loader: async ({ context, deps }) => {
    const [categories, ...pages] = await Promise.all([
      context.queryClient.query(categoriesQuery),
      ...loaderPageNumbers(deps.page).map((page) =>
        context.queryClient.query(productsPageQuery(deps, { page })),
      ),
    ]);
    const seed: SeedPages | null = pages.length ? { key: listKey(deps), pages } : null;
    return { categories, seed };
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
    const { categories, seed } = Route.useLoaderData();
    const search = Route.useSearch();
    return (
      <ListingRoute
        title={search.q ? `“${search.q}” için sonuçlar` : "Tüm ürünler"}
        search={search}
        categories={categories}
        seed={seed}
        navigate={Route.useNavigate()}
      />
    );
  },
});
