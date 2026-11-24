import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "../queries";
import { ProductCard } from "./product-card";

/** Shared prev/next state for an Embla carousel. */
export function useCarouselNav(api: ReturnType<typeof useEmblaCarousel>[1]) {
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const sync = useCallback(() => {
    setCanPrev(api?.canScrollPrev() ?? false);
    setCanNext(api?.canScrollNext() ?? false);
  }, [api]);
  useEffect(() => {
    if (!api) return;
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api, sync]);
  return { canPrev, canNext };
}

export function NavButton({
  side,
  onClick,
  disabled,
  className,
}: {
  side: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Icon = side === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "prev" ? "Önceki" : "Sonraki"}
      className={cn(
        "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 shadow-md transition-opacity hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-0",
        side === "prev" ? "left-1" : "right-1",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}

const discount = (p: Card) =>
  p.old_price ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100) : 0;

/**
 * A titled row of product cards that drags/swipes and has arrow buttons at both sides.
 * No scrollbar: Embla moves the track with a transform, not native overflow scrolling.
 */
export function ProductRail({
  title,
  products,
  seeAll,
  showDiscount,
  action,
  max = 12,
}: {
  title: string;
  products: Card[];
  seeAll?: { sort?: "newest" | "popular"; on_sale?: true };
  showDiscount?: boolean;
  /** Replaces the "see all" link, e.g. a "Temizle" button. */
  action?: ReactNode;
  /** How many cards the row shows at most. */
  max?: number;
}) {
  const [ref, api] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
  });
  const { canPrev, canNext } = useCarouselNav(api);
  if (products.length === 0) return null;
  const id = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id={id} className="text-xl font-semibold">
          {title}
        </h2>
        {action}
        {seeAll && (
          <Link to="/ara" search={seeAll} className="text-sm underline underline-offset-4">
            Tümünü gör
          </Link>
        )}
      </div>
      <div className="relative">
        <div ref={ref} className="overflow-hidden">
          <ul className="-ml-3 flex touch-pan-y">
            {products.slice(0, max).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                className="min-w-0 shrink-0 basis-1/2 pl-3 sm:basis-1/3 lg:basis-1/4"
                badge={
                  showDiscount && discount(p) > 0 ? (
                    <span className="absolute left-5 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      %{discount(p)}
                    </span>
                  ) : null
                }
              />
            ))}
          </ul>
        </div>
        <NavButton
          side="prev"
          onClick={() => api?.scrollPrev()}
          disabled={!canPrev}
          className="-left-2 md:-left-5 top-[40%]"
        />
        <NavButton
          side="next"
          onClick={() => api?.scrollNext()}
          disabled={!canNext}
          className="-right-2 md:-right-5 top-[40%]"
        />
      </div>
    </section>
  );
}
