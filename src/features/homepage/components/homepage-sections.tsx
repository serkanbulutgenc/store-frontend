import { BannerHero } from "@/features/banners/components/banner-hero";
import { BannerStrip } from "@/features/banners/components/picture-banner";
import { bannerLink } from "@/features/catalog/banner";
import { CategoryRail } from "@/features/catalog/components/category-rail";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ProductDescription } from "@/features/catalog/components/product-description";
import { ProductRail } from "@/features/catalog/components/product-rail";
import { RecentlyViewed } from "@/features/catalog/components/recently-viewed";
import { cn } from "@/lib/utils";
import type { HomepageSection } from "../queries";

/** "Tümünü gör" for a section whose Owner set a link; nothing without one. */
function SeeAll({ link }: { link: string }) {
  const target = bannerLink(link);
  if (!target) return null;
  return (
    <a
      href={target.href}
      {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-sm underline underline-offset-4"
    >
      Tümünü gör
    </a>
  );
}

/** A section's products as a grid (`list` is one column). The carousel is `ProductRail`. */
function ProductGrid({ section }: { section: HomepageSection }) {
  const id = `section-${section.id}`;
  const products = section.products ?? [];
  return (
    <section aria-labelledby={section.title ? id : undefined}>
      {(section.title || section.link) && (
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id={id} className="text-xl font-semibold">
            {section.title}
          </h2>
          <SeeAll link={section.link} />
        </div>
      )}
      <ul
        className={cn(
          "grid gap-3",
          section.display === "list" ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        )}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
    </section>
  );
}

function ProductsBlock({ section }: { section: HomepageSection }) {
  if (section.client_resolved) return <RecentlyViewed />;
  if (section.display !== "carousel") return <ProductGrid section={section} />;
  return (
    <ProductRail
      title={section.title}
      products={section.products ?? []}
      action={section.link ? <SeeAll link={section.link} /> : undefined}
      showDiscount={section.source === "on_sale"}
      max={24}
    />
  );
}

function SectionBlock({ section }: { section: HomepageSection }) {
  switch (section.type) {
    case "slider":
      return section.banners?.length ? (
        <BannerHero banners={section.banners} />
      ) : (
        <HomeHero products={section.products ?? []} />
      );
    case "products":
      return <ProductsBlock section={section} />;
    case "categories":
      return (
        <CategoryRail
          categories={section.categories ?? []}
          title={section.title || undefined}
          action={section.link ? <SeeAll link={section.link} /> : undefined}
        />
      );
    case "banner":
      return <BannerStrip banners={section.banners ?? []} label="Kampanya" />;
    case "rich_text":
      // Markdown through the Description renderer: no raw HTML, only allowed elements and links.
      return (
        <section>
          {section.title && <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>}
          <ProductDescription source={section.body ?? ""} />
        </section>
      );
    default:
      // A type this build does not know yet: skip it rather than break the page.
      return null;
  }
}

/** The home page body: the Owner's sections in order. The slider spans the full width; the
 * rest sit in the centred column. */
export function HomepageSections({ sections }: { sections: HomepageSection[] }) {
  const first = sections[0]?.type === "slider" ? sections[0] : null;
  const rest = first ? sections.slice(1) : sections;
  const empty = sections.every((s) => s.client_resolved);
  return (
    <>
      {first && <SectionBlock section={first} />}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {rest.map((s) => (
          <SectionBlock key={s.id} section={s} />
        ))}
        {empty && <p className="text-muted-foreground">Ürünler yakında burada.</p>}
      </div>
    </>
  );
}
