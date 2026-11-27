import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText, ListChecks, ShoppingBag, Truck } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartButton } from "@/features/favorites/components/heart-button";
import { ReviewsSection } from "@/features/reviews/components/reviews-section";
import { StarsInline } from "@/features/reviews/components/stars";
import { formatAverage } from "@/features/reviews/format";
import { NotifyMe } from "@/features/stock-alerts/components/notify-me";
import { addLabel } from "../product-options";
import type { ProductCard, ProductDetail } from "../queries";
import { recordViewed } from "../recently-viewed";
import { BrandLogo } from "./brand-logo";
import { Price } from "./product-card";
import { ProductDescription } from "./product-description";
import { ProductGallery } from "./product-gallery";
import { RecentlyViewed } from "./recently-viewed";
import { SimilarProducts } from "./similar-products";
import { SizePickerExtras } from "./size-guide";
import { ColourChips, HygieneNotice, QuantityStepper, SizeChips } from "./variant-picker/options";
import { useVariantPick } from "./variant-picker/use-variant-pick";

function ProductTabs({ product }: { product: ProductDetail }) {
  return (
    <Tabs defaultValue="attributes" className="mt-12">
      <TabsList variant="line" className="h-auto flex-wrap">
        <TabsTrigger value="attributes">
          <ListChecks className="size-4" aria-hidden="true" />
          Ürün özellikleri
        </TabsTrigger>
        <TabsTrigger value="description">
          <FileText className="size-4" aria-hidden="true" />
          Açıklama
        </TabsTrigger>
      </TabsList>
      <TabsContent value="attributes" className="pt-4">
        {product.attributes.length > 0 ? (
          <dl className="grid max-w-3xl grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            {product.attributes.map((a) => (
              <div key={a.name} className="contents">
                <dt className="text-muted-foreground">{a.name}</dt>
                <dd>{a.values.join(", ")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">Ürün özelliği yok.</p>
        )}
      </TabsContent>
      <TabsContent value="description" className="pt-4">
        {product.description ? (
          <ProductDescription source={product.description} />
        ) : (
          <p className="text-muted-foreground">Açıklama yok.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ProductPage({
  product,
  similar,
}: {
  product: ProductDetail;
  similar: ProductCard[];
}) {
  const pick = useVariantPick(product);
  useEffect(() => recordViewed(product.slug), [product.slug]);
  const { colourId, sizes, size: activeSize, variant, needsSize } = pick;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {product.breadcrumbs.length > 0 && (
        <nav aria-label="Konum" className="mb-4 text-muted-foreground">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link to="/" className="hover:underline">
                Ana sayfa
              </Link>
            </li>
            {product.breadcrumbs.map((c) => (
              <li key={c.slug} className="flex gap-1">
                <ChevronRight className="size-4 self-center" aria-hidden="true" />
                <Link to="/kategori/$slug" params={{ slug: c.slug }} className="hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="gap-10 lg:grid lg:grid-cols-2">
        <ProductGallery
          key={colourId}
          photos={pick.photos}
          fallback={product.image}
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="mt-6 space-y-5 lg:mt-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.brand && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <BrandLogo url={product.brand.logo_url} />
                  {product.brand.name}
                </p>
              )}
              <h1 className="text-2xl font-semibold">{product.title}</h1>
              <button
                type="button"
                onClick={() =>
                  document.getElementById("yorumlar")?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-1 inline-flex items-center gap-2 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {product.rating_average !== null && product.rating_count > 0 ? (
                  <>
                    <StarsInline stars={Math.round(product.rating_average)} />
                    <span className="font-medium">{formatAverage(product.rating_average)}</span>
                    <span className="text-muted-foreground">
                      · {product.rating_count} değerlendirme
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Henüz değerlendirme yok</span>
                )}
              </button>
            </div>
          </div>
          <div className="text-xl">
            <Price
              price={product.price}
              oldPrice={product.old_price}
              shelfPrice={product.shelf_price}
              campaignPercentage={product.campaign_percentage}
            />
            <p className="text-sm text-muted-foreground">KDV dahil</p>
          </div>
          {product.sold_out && (
            <p className="rounded-md bg-muted px-3 py-2 font-medium" role="status">
              Tükendi
            </p>
          )}

          <ColourChips colours={product.colours} colourId={colourId} onSelect={pick.setColourId} />
          <SizeChips sizes={sizes} size={activeSize} onSelect={pick.setSize} />
          <SizePickerExtras product={product} />

          <div className="space-y-2">
            <p aria-live="polite" className="min-h-6 font-medium text-primary">
              {pick.label}
            </p>
            <div className="flex items-stretch gap-2">
              <QuantityStepper quantity={pick.quantity} onChange={pick.setQuantity} />
              <Button
                size="lg"
                className="h-12 min-w-0 flex-1"
                disabled={!pick.canAdd || pick.pending}
                onClick={() => variant && pick.addVariant(variant.id)}
              >
                <ShoppingBag className="size-5" aria-hidden="true" />
                {addLabel(variant, needsSize)}
              </Button>
              <HeartButton
                productId={product.id}
                className="size-12 shrink-0 border border-border bg-card shadow-none hover:bg-accent"
              />
            </div>
            {variant && !variant.in_stock && (
              <NotifyMe productSlug={product.slug} variantId={variant.id} />
            )}
          </div>

          <p className="flex items-start gap-2 rounded-md bg-rose-soft px-3 py-2 text-sm">
            <Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Kapıda ödeme veya havale ile ödeyebilirsiniz. Kargo ücreti sepette gösterilir.
          </p>
          {product.is_hygiene && <HygieneNotice />}
        </div>
      </div>
      <ProductTabs product={product} />
      <div id="yorumlar" className="mt-12 scroll-mt-6">
        <ReviewsSection key={product.slug} slug={product.slug} productId={product.id} />
      </div>
      <div className="mt-12 empty:hidden">
        <SimilarProducts products={similar} />
      </div>
      <div className="mt-12 empty:hidden">
        <RecentlyViewed currentSlug={product.slug} />
      </div>
    </main>
  );
}
