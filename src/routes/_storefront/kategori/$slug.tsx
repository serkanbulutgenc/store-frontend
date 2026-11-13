import { createFileRoute, notFound } from "@tanstack/react-router";
import { browseSearchSchema, pageNumbers } from "@/features/catalog/browse-search";
import { ListingRoute } from "@/features/catalog/components/listing-route";
import type { CategoryPage } from "@/features/catalog/queries";
import { categoriesQuery, categoryPageQuery, productsPageQuery } from "@/features/catalog/queries";
import { categoryTrail, listingHead } from "@/features/catalog/seo";
import { ApiError } from "@/lib/api/errors";

export const Route = createFileRoute("/_storefront/kategori/$slug")({
  validateSearch: browseSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    // The Category first: a hidden or unknown one is a 404 before any listing request.
    const category: CategoryPage = await context.queryClient.query(categoryPageQuery(params.slug));
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
    const trail = categoryTrail(categories, params.slug);
    return { categories, trail, category, title: category.name };
  },
  head: ({ loaderData, match, params }) =>
    loaderData
      ? listingHead({
          title: loaderData.title,
          path: `/kategori/${params.slug}`,
          search: match.search,
          kind: "category",
          origin: match.context.siteOrigin,
          trail: loaderData.trail,
          seoTitle: loaderData.category.seo_title,
          seoDescription: loaderData.category.seo_description,
        })
      : {},
  component: function CategoryPage() {
    const { title, categories, category } = Route.useLoaderData();
    const { slug } = Route.useParams();
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <ListingRoute
        title={title}
        intro={{ description: category.description, image: category.image }}
        category={slug}
        search={search}
        categories={categories}
        navigate={navigate}
      />
    );
  },
});
