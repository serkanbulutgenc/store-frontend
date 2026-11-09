import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProductPage } from "@/features/catalog/components/product-page";
import { productQuery } from "@/features/catalog/queries";
import { productHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/urun/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.query(productQuery(params.slug));
    // The API resolves an old slug to its Product; send the Shopper and crawlers to the new URL.
    if (product.slug !== params.slug)
      throw redirect({
        to: "/urun/$slug",
        params: { slug: product.slug },
        search: true,
        statusCode: 301,
      });
    return product;
  },
  head: ({ loaderData, match }) =>
    loaderData ? productHead(loaderData, match.context.siteOrigin) : {},
  // Remount per product so colour and size selections never leak between products.
  component: function ProductRoute() {
    const product = Route.useLoaderData();
    return <ProductPage key={product.id} product={product} />;
  },
});
