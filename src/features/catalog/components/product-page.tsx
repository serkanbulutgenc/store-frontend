import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartButton } from "@/features/favorites/components/heart-button";
import { ReviewsSection } from "@/features/reviews/components/reviews-section";
import { reviewsQuery } from "@/features/reviews/queries";
import { cn } from "@/lib/utils";
import { type ProductDetail, productsPageQuery } from "../queries";
import { Price, ProductGrid } from "./product-card";
import { ProductGallery } from "./product-gallery";
import { useQuickPick } from "./quick-view/use-quick-pick";

function Similar({ product }: { product: ProductDetail }) {
  const category = product.breadcrumbs.at(-1)?.slug;
  const { data } = useQuery({
    ...productsPageQuery({ in_stock: true }, { category, page: 1 }),
    enabled: Boolean(category),
  });
  const items = data?.items.filter((p) => p.id !== product.id).slice(0, 4) ?? [];
  if (items.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="similar">
      <h2 id="similar" className="mb-4 text-lg font-semibold">
        Benzer ürünler
      </h2>
      <ProductGrid products={items} />
    </section>
  );
}

function ProductTabs({ product }: { product: ProductDetail }) {
  // Page 1 is the same query the reviews tab renders, so this costs no extra request.
  const { data } = useQuery(reviewsQuery(product.slug, 1));
  return (
    <Tabs defaultValue="attributes" className="mt-12">
      <TabsList variant="line" className="h-auto flex-wrap">
        <TabsTrigger value="attributes">Ürün özellikleri</TabsTrigger>
        <TabsTrigger value="reviews">Yorumlar{data ? ` (${data.count})` : ""}</TabsTrigger>
        <TabsTrigger value="description">Açıklama</TabsTrigger>
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
      {/* Kept mounted so a half-written review survives a tab switch. */}
      <TabsContent value="reviews" forceMount className="pt-4 data-[state=inactive]:hidden">
        <ReviewsSection key={product.slug} slug={product.slug} productId={product.id} />
      </TabsContent>
      <TabsContent value="description" className="pt-4">
        {product.description ? (
          <p className="max-w-3xl whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>
        ) : (
          <p className="text-muted-foreground">Açıklama yok.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ProductPage({ product }: { product: ProductDetail }) {
  const pick = useQuickPick(product);
  const { colourId, sizes, size: activeSize, variant, needsSize } = pick;
  const colour = product.colours.find((c) => c.id === colourId);

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
                <span aria-hidden="true">/</span>
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
              {product.brand && <p className="text-muted-foreground">{product.brand.name}</p>}
              <h1 className="text-2xl font-semibold">{product.title}</h1>
            </div>
            <HeartButton productId={product.id} className="shrink-0 border border-border" />
          </div>
          <div className="text-xl">
            <Price price={product.price} oldPrice={product.old_price} />
            <p className="text-sm text-muted-foreground">KDV dahil</p>
          </div>
          {product.sold_out && (
            <p className="rounded-md bg-muted px-3 py-2 font-medium" role="status">
              Tükendi
            </p>
          )}

          <fieldset className="border-0 p-0">
            <legend className="mb-2 font-medium">Renk{colour ? `: ${colour.name}` : ""}</legend>
            <div className="flex flex-wrap gap-2">
              {product.colours.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={c.id === colourId}
                  onClick={() => pick.setColourId(c.id)}
                  className={cn(
                    "size-9 rounded-full border-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
                    c.id === colourId ? "border-primary ring-2 ring-primary/30" : "border-border",
                  )}
                  style={{ backgroundColor: c.hex_code }}
                />
              ))}
            </div>
          </fieldset>

          {/* A one-size colour has nothing to choose. */}
          {sizes.length > 1 && (
            <fieldset className="border-0 p-0">
              <legend className="mb-2 font-medium">Beden</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.variantId}
                    type="button"
                    aria-pressed={s.size === activeSize}
                    onClick={() => pick.setSize(s.size)}
                    className={cn(
                      "min-w-11 rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      s.size === activeSize
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card",
                      !s.inStock && "text-muted-foreground line-through",
                    )}
                  >
                    {s.size}
                    {!s.inStock && <span className="sr-only"> (tükendi)</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <p aria-live="polite" className="min-h-6 font-medium text-primary">
              {pick.label}
            </p>
            <Button
              size="lg"
              className="w-full"
              disabled={!pick.canAdd || pick.pending}
              onClick={() => variant && pick.addVariant(variant.id)}
            >
              {variant && !variant.in_stock ? "Tükendi" : needsSize ? "Beden seçin" : "Sepete ekle"}
            </Button>
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            Kapıda ödeme veya havale ile ödeyebilirsiniz. Kargo ücreti sepette gösterilir.
          </p>
          {product.is_hygiene && (
            <p className="rounded-md border border-border px-3 py-2 text-sm">
              Hijyen nedeniyle bu ürün, ambalajı açıldıktan sonra iade edilemez.
            </p>
          )}
        </div>
      </div>
      <ProductTabs product={product} />
      <Similar product={product} />
    </main>
  );
}
