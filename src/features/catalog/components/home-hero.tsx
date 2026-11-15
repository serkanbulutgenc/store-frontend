import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useMemo, useState } from "react";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "../queries";
import { NavButton } from "./product-rail";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Photo({ product, eager }: { product: Card; eager: boolean }) {
  const sizes = [...(product.image?.sizes ?? [])].sort((a, b) => a.width - b.width);
  const largest = sizes[sizes.length - 1];
  if (!largest) return <div role="img" aria-label="Fotoğraf yok" className="size-full bg-muted" />;
  return (
    <img
      src={largest.url}
      srcSet={sizes.map((s) => `${s.url} ${s.width}w`).join(", ")}
      sizes="(min-width: 768px) 70vw, 100vw"
      alt={product.image?.alt ?? product.title}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      className="size-full object-cover"
    />
  );
}

/** Full-width featured slider: swipe/drag, side arrows, thumbnail picker, autoplay that pauses on hover. */
export function HomeHero({ products }: { products: Card[] }) {
  const slides = products.slice(0, 5);
  const autoplay = useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
    [],
  );
  const [ref, api] = useEmblaCarousel({ loop: true }, reducedMotion() ? [] : [autoplay]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const on = () => setIndex(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => {
      api.off("select", on);
    };
  }, [api]);
  if (slides.length === 0) return null;
  return (
    <section
      aria-label="Öne çıkan ürünler"
      aria-roledescription="carousel"
      className="grid w-full bg-foreground text-background md:grid-cols-[1fr_20rem]"
    >
      <div className="relative">
        <div ref={ref} className="overflow-hidden">
          <ul className="flex touch-pan-y">
            {slides.map((p, n) => (
              <li
                key={p.id}
                aria-roledescription="slide"
                aria-label={`${n + 1} / ${slides.length}`}
                className="relative h-[26rem] min-w-0 shrink-0 basis-full md:h-[34rem]"
              >
                <Link to="/urun/$slug" params={{ slug: p.slug }} className="block size-full">
                  <Photo product={p} eager={n === 0} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8 text-white md:p-10">
                    {n === 0 ? (
                      <h1 className="max-w-xl text-2xl font-bold md:text-4xl">{p.title}</h1>
                    ) : (
                      <p className="max-w-xl text-2xl font-bold md:text-4xl">{p.title}</p>
                    )}
                    <p className="mt-1 text-lg">{formatTry(p.price)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {slides.length > 1 && (
          <>
            <NavButton
              side="prev"
              onClick={() => api?.scrollPrev()}
              className="left-3 text-foreground"
            />
            <NavButton
              side="next"
              onClick={() => api?.scrollNext()}
              className="right-3 text-foreground"
            />
          </>
        )}
      </div>
      <ul className="flex gap-2 overflow-x-auto p-3 md:flex-col md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((p, n) => (
          <li key={p.id} className="min-w-40 md:min-w-0">
            <button
              type="button"
              onClick={() => api?.scrollTo(n)}
              aria-label={p.title}
              aria-current={n === index}
              className={cn(
                "flex w-full items-center gap-3 rounded-md p-2 text-left",
                n === index ? "bg-background/20" : "opacity-60 hover:opacity-100",
              )}
            >
              {p.image?.sizes[0] ? (
                <img
                  src={p.image.sizes[0].url}
                  alt=""
                  className="size-16 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="size-16 shrink-0 rounded bg-muted" />
              )}
              <span className="line-clamp-2 text-sm">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
