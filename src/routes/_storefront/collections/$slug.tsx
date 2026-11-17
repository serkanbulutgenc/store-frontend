import { createFileRoute } from "@tanstack/react-router";
import { CollectionView } from "@/features/catalog/components/collection-page";
import { collectionPageQuery } from "@/features/catalog/queries";
import { collectionHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/collections/$slug")({
  // An unpublished or empty Collection is a 404 from the API, which the query turns into notFound.
  loader: async ({ context, params }) => ({
    collection: await context.queryClient.query(collectionPageQuery(params.slug)),
  }),
  head: ({ loaderData, match }) =>
    loaderData ? collectionHead(loaderData.collection, match.context.siteOrigin) : {},
  component: function CollectionRoute() {
    const { collection } = Route.useLoaderData();
    return <CollectionView collection={collection} />;
  },
});
