import { createFileRoute, redirect } from "@tanstack/react-router";
import { Markdown } from "@/features/legal/markdown";
import { legalPageQuery } from "@/features/legal/queries";

export const Route = createFileRoute("/_storefront/yasal/$slug")({
  loader: async ({ context, params }) => {
    const page = await context.queryClient.query(legalPageQuery(params.slug));
    // The API resolves an earlier address to its page; send Shoppers and crawlers to the current one.
    if (page.slug !== params.slug)
      throw redirect({ to: "/yasal/$slug", params: { slug: page.slug }, statusCode: 301 });
    return page;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Yasal"} | Auraa Giyim` }],
  }),
  component: function LegalRoute() {
    const page = Route.useLoaderData();
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Markdown source={page.body} />
        <p className="mt-8 text-muted-foreground">Sürüm {page.version}</p>
      </main>
    );
  },
});
