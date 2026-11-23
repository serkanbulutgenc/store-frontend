import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavButton } from "@/features/catalog/components/product-rail";
import { cn } from "@/lib/utils";
import type { PictureBanner } from "../queries";
import { prefersReducedMotion } from "../rotation";
import { BannerLink, PictureBannerImage } from "./picture-banner";

/** The home hero: a large carousel of Banners with arrows, dots and a pause button. It rotates
 * on its own, pauses on hover and focus, and does not move at all under reduced motion. */
export function BannerHero({ banners }: { banners: PictureBanner[] }) {
  const autoplay = useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
    [],
  );
  const [reduced] = useState(prefersReducedMotion);
  const [ref, api] = useEmblaCarousel({ loop: true }, reduced ? [] : [autoplay]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!api) return;
    const on = () => setIndex(api.selectedScrollSnap());
    on();
    api.on("select", on);
    return () => {
      api.off("select", on);
    };
  }, [api]);
  if (banners.length === 0) return null;
  const many = banners.length > 1;
  const toggle = () => {
    if (paused) autoplay.play();
    else autoplay.stop();
    setPaused(!paused);
  };
  return (
    <section
      aria-label="Öne çıkan kampanyalar"
      aria-roledescription="carousel"
      onFocus={() => !paused && autoplay.stop()}
      onBlur={() => !paused && !reduced && autoplay.play()}
      className="relative w-full bg-muted"
    >
      <div ref={ref} className="overflow-hidden">
        <ul className="flex touch-pan-y">
          {banners.map((b, n) => (
            <li
              key={b.id}
              aria-roledescription="slide"
              aria-label={`${n + 1} / ${banners.length}`}
              className="min-w-0 shrink-0 basis-full"
            >
              <BannerLink link={b.link}>
                <PictureBannerImage
                  banner={b}
                  eager={n === 0}
                  className="aspect-[3/2] md:aspect-[16/6]"
                />
              </BannerLink>
            </li>
          ))}
        </ul>
      </div>
      {many && (
        <>
          <NavButton side="prev" onClick={() => api?.scrollPrev()} className="left-3" />
          <NavButton side="next" onClick={() => api?.scrollNext()} className="right-3" />
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {!reduced && (
              <button
                type="button"
                onClick={toggle}
                aria-label={paused ? "Kaydırmayı oynat" : "Kaydırmayı duraklat"}
                className="grid size-7 place-items-center rounded-full bg-background/90 shadow"
              >
                {paused ? (
                  <Play className="size-4" aria-hidden="true" />
                ) : (
                  <Pause className="size-4" aria-hidden="true" />
                )}
              </button>
            )}
            {banners.map((b, n) => (
              <button
                key={b.id}
                type="button"
                onClick={() => api?.scrollTo(n)}
                aria-label={`${n + 1}. görsele git`}
                aria-current={n === index}
                className={cn(
                  "size-2.5 rounded-full border border-background/80 shadow",
                  n === index ? "bg-background" : "bg-foreground/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
