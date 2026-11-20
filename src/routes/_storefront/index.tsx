import { createFileRoute, Link } from "@tanstack/react-router";
import { settingsQuery } from "@/features/basket/queries";
import { HomeBanner } from "@/features/catalog/components/home-banner";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { RecentlyViewed } from "@/features/catalog/components/recently-viewed";
import {
  categoriesQuery,
  collectionPageQuery,
  productsPageQuery,
} from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";
import { HOME_SLIDER_SLUG, sliderProducts } from "@/features/catalog/slider";

export const Route = createFileRoute("/_storefront/")({
  loader: async ({ context }) => {
    const [latest, popular, onSale, categories, settings, featured] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(productsPageQuery({ sort: "popular" }, { page: 1 })),
      context.queryClient.query(productsPageQuery({ on_sale: true }, { page: 1 })),
      context.queryClient.query(categoriesQuery),
      // The banner is optional: the home page must still render when the settings do not load.
      context.queryClient.query(settingsQuery).catch(() => null),
      // An unpublished, empty or missing Collection is a 404: the slider then shows the newest.
      context.queryClient
        .query(collectionPageQuery(HOME_SLIDER_SLUG))
        .then((c) => c.items)
        .catch(() => null),
    ]);
    return {
      latest: latest.items,
      popular: popular.items,
      onSale: onSale.items,
      categories,
      banner: settings?.banner,
      slider: sliderProducts(featured, latest.items),
    };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { latest, popular, onSale, categories, banner, slider } = Route.useLoaderData();
    return (
      <main>
        <h1 className="sr-only">Aura Tekstil</h1>
        <HomeBanner banner={banner} />
        <HomeHero products={slider} />
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          <RecentlyViewed />
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
