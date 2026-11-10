import { createFileRoute, notFound } from "@tanstack/react-router";
import { Markdown } from "@/features/legal/markdown";
import { legalBySlug } from "@/features/legal/pages";

export const Route = createFileRoute("/_storefront/yasal/$slug")({
  loader: ({ params }) => {
    const page = legalBySlug(params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Yasal"} | Aura Tekstil` }],
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
