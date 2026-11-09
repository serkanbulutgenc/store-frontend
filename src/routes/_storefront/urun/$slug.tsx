import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/features/catalog/components/product-page";
import { productQuery } from "@/features/catalog/queries";

export const Route = createFileRoute("/_storefront/urun/$slug")({
  loader: ({ context, params }) => context.queryClient.query(productQuery(params.slug)),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} | Aura Tekstil` : "Aura Tekstil" }],
  }),
  // Remount per product so colour and size selections never leak between products.
  component: function ProductRoute() {
    const product = Route.useLoaderData();
    return <ProductPage key={product.id} product={product} />;
  },
});
