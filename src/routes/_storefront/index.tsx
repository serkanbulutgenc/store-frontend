import { createFileRoute } from "@tanstack/react-router";
import { homeHead } from "@/features/catalog/seo";
import { HomepageSections } from "@/features/homepage/components/homepage-sections";
import { homepageQuery } from "@/features/homepage/queries";

export const Route = createFileRoute("/_storefront/")({
  // The Owner's layout comes resolved from one call (ADR 0012).
  loader: async ({ context }) => ({ sections: await context.queryClient.query(homepageQuery) }),
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { sections } = Route.useLoaderData();
    return (
      <main>
        <h1 className="sr-only">Aura Tekstil</h1>
        <HomepageSections sections={sections} />
      </main>
    );
  },
});
