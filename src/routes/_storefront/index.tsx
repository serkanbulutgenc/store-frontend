import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";

export const Route = createFileRoute("/_storefront/")({
  loader: async ({ context }) => {
    const [latest, popular, onSale, categories] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(productsPageQuery({ sort: "popular" }, { page: 1 })),
      context.queryClient.query(productsPageQuery({ on_sale: true }, { page: 1 })),
      context.queryClient.query(categoriesQuery),
    ]);
    return { latest: latest.items, popular: popular.items, onSale: onSale.items, categories };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { latest, popular, onSale, categories } = Route.useLoaderData();
    return (
      <main>
        <h1 className="sr-only">Aura Tekstil</h1>
        {/* The optional banner is a Store setting (ticket 20); it slots in here. */}
        <HomeHero products={latest} />
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          <ProductRail title="Yeni gelenler" products={latest} seeAll={{ sort: "newest" }} />
          <ProductRail
            title="İndirimdekiler"
            products={onSale}
            seeAll={{ on_sale: true }}
            showDiscount
          />
          <ProductRail title="Çok satanlar" products={popular} seeAll={{ sort: "popular" }} />
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
