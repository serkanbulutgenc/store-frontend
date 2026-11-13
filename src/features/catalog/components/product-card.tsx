import { Link } from "@tanstack/react-router";
import { HeartButton } from "@/features/favorites/components/heart-button";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "../queries";
import { ProductImage } from "./product-image";

export function Price({ price, oldPrice }: { price: string; oldPrice: string | null }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-semibold">{formatTry(price)}</span>
      {oldPrice && (
        <s className="text-sm text-muted-foreground">
          <span className="sr-only">Eski fiyat </span>
          {formatTry(oldPrice)}
        </s>
      )}
    </p>
  );
}

export function ProductCard({ product, dimSoldOut }: { product: Card; dimSoldOut?: boolean }) {
  return (
    <li className="group relative">
      <Link
        to="/urun/$slug"
        params={{ slug: product.slug }}
        className={cn(
          "block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          dimSoldOut && product.sold_out && "opacity-60 grayscale",
        )}
      >
        <div className="relative overflow-hidden rounded-md">
          <ProductImage
            image={product.image}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="transition-transform group-hover:scale-[1.02]"
          />
          {product.sold_out && (
            <span className="absolute left-2 top-2 rounded-md bg-foreground px-2 py-0.5 text-xs text-background">
              Tükendi
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2">{product.title}</h3>
        <Price price={product.price} oldPrice={product.old_price} />
        {product.colours.length > 1 && (
          <ul className="mt-1 flex gap-1" aria-label="Renkler">
            {product.colours.map((c) => (
              <li
                key={c.id}
                title={c.name}
                className="size-3 rounded-full border border-border"
                style={{ backgroundColor: c.hex_code }}
              >
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </Link>
      <HeartButton productId={product.id} className="absolute right-2 top-2" />
    </li>
  );
}

export function ProductGrid({ products, dimSoldOut }: { products: Card[]; dimSoldOut?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} dimSoldOut={dimSoldOut} />
      ))}
    </ul>
  );
}
