import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";
import { HomePrototype, VARIANTS } from "./-home-prototype";

export const Route = createFileRoute("/_storefront/")({
  validateSearch: z.object({ variant: z.enum(["A", "B", "C"]).optional().catch(undefined) }),
  loader: async ({ context }) => {
    const [latest, popular, categories] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(productsPageQuery({ sort: "rating_desc" }, { page: 1 })),
      context.queryClient.query(categoriesQuery),
    ]);
    const seen = new Map([...latest.items, ...popular.items].map((p) => [p.id, p]));
    const onSale = [...seen.values()].filter((p) => p.old_price);
    return { latest: latest.items, popular: popular.items, onSale, categories };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const data = Route.useLoaderData();
    const { variant = "A" } = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <>
        <HomePrototype variant={variant} data={data} />
        <PrototypeSwitcher
          variants={VARIANTS}
          current={variant}
          onChange={(v) => navigate({ search: { variant: v as "A" | "B" | "C" }, replace: true })}
        />
      </>
    );
  },
});
