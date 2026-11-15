import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/")({
  loader: async ({ context }) => {
    const [latest, popular, categories] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(productsPageQuery({ sort: "rating_desc" }, { page: 1 })),
      context.queryClient.query(categoriesQuery),
    ]);
    // The API has no on-sale filter yet: take discounted items from the two pages we already have.
    const onSale = [
      ...new Map([...latest.items, ...popular.items].map((p) => [p.id, p])).values(),
    ].filter((p) => p.old_price);
    return { latest: latest.items, popular: popular.items, onSale, categories };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { latest, popular, onSale, categories } = Route.useLoaderData();
    return (
      <main>
        {/* The optional banner is a Store setting (ticket 20); it slots in here. */}
        <HomeHero products={latest} />
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          <ProductRail title="Yeni gelenler" products={latest} seeAll={{ sort: "newest" }} />
          <ProductRail title="İndirimdekiler" products={onSale} showDiscount />
          <ProductRail
            title="En çok beğenilenler"
            products={popular}
            seeAll={{ sort: "rating_desc" }}
          />
          {latest.length === 0 && <p className="text-muted-foreground">Ürünler yakında burada.</p>}
          {categories.length > 0 && (
            <section aria-labelledby="cats">
              <h2 id="cats" className="mb-3 text-xl font-semibold">
                Kategoriler
              </h2>
              <ul className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/kategori/$slug"
                      params={{ slug: c.slug }}
                      className="block rounded-full border border-border px-4 py-2 hover:bg-accent"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    );
  },
});
