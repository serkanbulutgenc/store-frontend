import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartButton } from "@/features/favorites/components/heart-button";
import { RatingSummary } from "@/features/reviews/components/stars";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "../queries";
import { ProductImage } from "./product-image";
import { QuickActions } from "./quick-view/quick-actions";

/** "-20%" from the API's "20.00": whole numbers plain, fractions with a Turkish comma. */
const badge = (percentage: string) => `-${Number(percentage).toLocaleString("tr-TR")}%`;

/**
 * The price block of every surface (card, quick view, detail). A running Campaign shows the
 * Campaign price, the Shelf price struck through and a badge, and hides the Old price; without
 * one it is the price and, if set, the Old price struck through. The Campaign's own name is
 * never shown.
 */
export function Price({
  price,
  oldPrice,
  shelfPrice,
  campaignPercentage,
}: {
  price: string;
  oldPrice: string | null;
  shelfPrice?: string | null;
  campaignPercentage?: string | null;
}) {
  // The percentage is the signal: the API always sends the Shelf price, Campaign or not.
  const onCampaign = Boolean(campaignPercentage);
  const struck = onCampaign ? shelfPrice : oldPrice;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-semibold">{formatTry(price)}</span>
      {struck && (
        <s className="text-sm text-muted-foreground">
          <span className="sr-only">{onCampaign ? "Liste fiyatı " : "Eski fiyat "}</span>
          {formatTry(struck)}
        </s>
      )}
      {onCampaign && campaignPercentage && (
        <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
          <span className="sr-only">İndirim </span>
          {badge(campaignPercentage)}
        </span>
      )}
    </p>
  );
}

export function ProductCard({
  product,
  dimSoldOut,
  className,
  badge,
}: {
  product: Card;
  dimSoldOut?: boolean;
  className?: string;
  badge?: ReactNode;
}) {
  return (
    <li className={cn("group relative", className)}>
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
        <Price
          price={product.price}
          oldPrice={product.old_price}
          shelfPrice={product.shelf_price}
          campaignPercentage={product.campaign_percentage}
        />
        <RatingSummary average={product.rating_average} count={product.rating_count} />
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
      {badge}
      <HeartButton productId={product.id} className="absolute right-2 top-2" />
      <QuickActions product={product} />
    </li>
  );
}

const GRID = "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4";

/** Placeholder cards shaped like ProductCard (image, title, price), two rows on desktop. */
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p role="status" className="sr-only">
        Ürünler yükleniyor
      </p>
      <ul aria-hidden="true" className={GRID}>
        {Array.from({ length: count }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <li key={i}>
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductGrid({ products, dimSoldOut }: { products: Card[]; dimSoldOut?: boolean }) {
  return (
    <ul className={GRID}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} dimSoldOut={dimSoldOut} />
      ))}
    </ul>
  );
}
