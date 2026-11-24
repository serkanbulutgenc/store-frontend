import { createFileRoute } from "@tanstack/react-router";
import { BannerHero } from "@/features/banners/components/banner-hero";
import { BannerStrip } from "@/features/banners/components/picture-banner";
import { bannersQuery, NO_BANNERS } from "@/features/banners/queries";
import { CategoryRail } from "@/features/catalog/components/category-rail";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { RecentlyViewed } from "@/features/catalog/components/recently-viewed";
import {
  collectionPageQuery,
  homeCategoriesQuery,
  productsPageQuery,
} from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";
import { HOME_SLIDER_SLUG, sliderProducts } from "@/features/catalog/slider";

export const Route = createFileRoute("/_storefront/")({
  loader: async ({ context }) => {
    const [latest, popular, onSale, categories, featured, banners] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(productsPageQuery({ sort: "popular" }, { page: 1 })),
      context.queryClient.query(productsPageQuery({ on_sale: true }, { page: 1 })),
      context.queryClient.query(homeCategoriesQuery),
      // An unpublished, empty or missing Collection is a 404: the slider then shows the newest.
      context.queryClient
        .query(collectionPageQuery(HOME_SLIDER_SLUG))
        .then((c) => c.items)
        .catch(() => null),
      context.queryClient.query(bannersQuery()).catch(() => NO_BANNERS),
    ]);
    return {
      latest: latest.items,
      popular: popular.items,
      onSale: onSale.items,
      categories,
      hero: banners.home_hero,
      mid: banners.home_mid,
      slider: sliderProducts(featured, latest.items),
    };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { latest, popular, onSale, categories, slider, hero, mid } = Route.useLoaderData();
    return (
      <main>
        <h1 className="sr-only">Aura Tekstil</h1>
        {hero.length > 0 ? <BannerHero banners={hero} /> : <HomeHero products={slider} />}
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          <RecentlyViewed />
          <ProductRail title="Yeni gelenler" products={latest} seeAll={{ sort: "newest" }} />
          <BannerStrip banners={mid.slice(0, 1)} label="Kampanya" />
          <ProductRail
            title="İndirimdekiler"
            products={onSale}
            seeAll={{ on_sale: true }}
            showDiscount
          />
          <BannerStrip banners={mid.slice(1, 2)} label="Kampanya" />
          <ProductRail title="Çok satanlar" products={popular} seeAll={{ sort: "popular" }} />
          {latest.length === 0 && <p className="text-muted-foreground">Ürünler yakında burada.</p>}
          <CategoryRail categories={categories} />
        </div>
      </main>
    );
  },
});
