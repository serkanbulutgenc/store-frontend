import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { homeHead } from "@/features/catalog/seo";
import { HomepageSections } from "@/features/homepage/components/homepage-sections";
import { PreviewBanner } from "@/features/homepage/components/preview-banner";
import { fetchHomepagePreview, homepageQuery } from "@/features/homepage/queries";

export const Route = createFileRoute("/_storefront/")({
  validateSearch: z.object({ preview: z.literal("layout").optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  // The Owner's layout comes resolved from one call (ADR 0012). With `?preview=layout` a
  // signed-in Dashboard user sees the layout under review instead; anyone else, or anyone whose
  // preview call is refused, gets the live page with no banner.
  loader: async ({ context, deps }) => {
    if (deps.preview) {
      const sections = await fetchHomepagePreview();
      if (sections) return { sections, preview: true };
    }
    return { sections: await context.queryClient.query(homepageQuery), preview: false };
  },
  head: ({ match, loaderData }) => {
    const head = homeHead(match.context.siteOrigin);
    return loaderData?.preview
      ? { ...head, meta: [...(head.meta ?? []), { name: "robots", content: "noindex, nofollow" }] }
      : head;
  },
  component: function Home() {
    const { sections, preview } = Route.useLoaderData();
    return (
      <>
        {preview && <PreviewBanner />}
        <main>
          <h1 className="sr-only">Aura Tekstil</h1>
          <HomepageSections sections={sections} />
        </main>
      </>
    );
  },
});
