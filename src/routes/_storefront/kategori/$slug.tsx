import { createFileRoute, notFound } from "@tanstack/react-router";
import { browseSearchSchema, pageNumbers } from "@/features/catalog/browse-search";
import { ListingRoute } from "@/features/catalog/components/listing-route";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/_storefront/kategori/$slug")({
  validateSearch: browseSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    try {
      await Promise.all(
        pageNumbers(deps.page).map((page) =>
          context.queryClient.query(productsPageQuery(deps, { category: params.slug, page })),
        ),
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
    const categories = await context.queryClient.query(categoriesQuery);
    const all = categories.flatMap((c) => [c, ...c.children]);
    return { title: all.find((c) => c.slug === params.slug)?.name ?? "Ürünler" };
  },
  component: function CategoryPage() {
    const { title } = Route.useLoaderData();
    const { slug } = Route.useParams();
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const categories = Route.useRouteContext().queryClient.getQueryData(categoriesQuery.queryKey);
    return (
      <ListingRoute
        title={title}
        category={slug}
        search={search}
        categories={categories ?? []}
        navigate={navigate}
      />
    );
  },
});
