import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAddToBasket } from "@/features/basket/queries";
import { HeartButton } from "@/features/favorites/components/heart-button";
import { cn } from "@/lib/utils";
import {
  canAddToBasket,
  defaultColourId,
  findVariant,
  photosForColour,
  sizesForColour,
  stockLabel,
} from "../product-options";
import { type ProductDetail, productsPageQuery } from "../queries";
import { Price, ProductGrid } from "./product-card";
import { ProductImage } from "./product-image";

function Gallery({ product, colourId }: { product: ProductDetail; colourId: number | null }) {
  const photos = photosForColour(product.photos, colourId);
  const [picked, setPicked] = useState<number | null>(null);
  // A colour change shows that colour's primary photo again.
  const current = photos.find((p) => p.id === picked) ?? photos[0];
  if (!current)
    return <ProductImage image={product.image} sizes="(min-width: 1024px) 50vw, 100vw" eager />;
  return (
    <div className="space-y-3">
      <ProductImage image={current} sizes="(min-width: 1024px) 50vw, 100vw" eager />
      {photos.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Fotoğraflar">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPicked(p.id)}
                aria-label={`Fotoğraf ${i + 1}`}
                aria-current={p.id === current.id}
                className={cn(
                  "block w-full overflow-hidden rounded-md border-2",
                  p.id === current.id ? "border-primary" : "border-transparent",
                )}
              >
                <ProductImage image={p} sizes="100px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

export function ProductPage({ product }: { product: ProductDetail }) {
  const [colourId, setColourId] = useState(() => defaultColourId(product.variants));
  const [size, setSize] = useState<string | null>(null);
  const sizes = sizesForColour(product.variants, colourId);
  // A size that does not exist in the newly picked colour is dropped.
  const activeSize = sizes.some((s) => s.size === size) ? size : null;
  const variant = findVariant(product.variants, colourId, activeSize);
  const label = stockLabel(variant);
  const addable = canAddToBasket(variant);
  const colour = product.colours.find((c) => c.id === colourId);
  const add = useAddToBasket();
  const navigate = useNavigate();

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
        <Gallery key={colourId} product={product} colourId={colourId} />
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
                  onClick={() => setColourId(c.id)}
                  className={cn(
                    "size-9 rounded-full border-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
                    c.id === colourId ? "border-primary ring-2 ring-primary/30" : "border-border",
                  )}
                  style={{ backgroundColor: c.hex_code }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="mb-2 font-medium">Beden</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.variantId}
                  type="button"
                  aria-pressed={s.size === activeSize}
                  onClick={() => setSize(s.size)}
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

          <div className="space-y-2">
            <p aria-live="polite" className="min-h-6 font-medium text-primary">
              {label}
            </p>
            <Button
              size="lg"
              className="w-full"
              disabled={!addable || add.isPending}
              onClick={() => {
                if (!variant) return;
                add.mutate(
                  { variantId: variant.id },
                  {
                    onSuccess: () => {
                      toast.success("Ürün sepete eklendi.", {
                        action: {
                          label: "Sepete git",
                          onClick: () => void navigate({ to: "/sepet" }),
                        },
                      });
                    },
                    onError: (e) => toast.error(e.message),
                  },
                );
              }}
            >
              {variant && !variant.in_stock
                ? "Tükendi"
                : activeSize
                  ? "Sepete ekle"
                  : "Beden seçin"}
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
          {product.attributes.length > 0 && (
            <div>
              <h2 className="mb-1 font-medium">Ürün özellikleri</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {product.attributes.map((a) => (
                  <div key={a.name} className="contents">
                    <dt className="text-muted-foreground">{a.name}</dt>
                    <dd>{a.values.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {product.description && (
            <div>
              <h2 className="mb-1 font-medium">Ürün açıklaması</h2>
              <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>
      <Similar product={product} />
    </main>
  );
}
