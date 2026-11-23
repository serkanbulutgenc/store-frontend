import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ImageIcon } from "lucide-react";
import type { HomeCategory } from "../queries";
import { NavButton, useCarouselNav } from "./product-rail";

/**
 * The homepage's "Kategoriler" row: the Categories the Owner picked, as thumbnail tiles in a
 * row that drags and has arrow buttons, like the product rows. A Category without an image
 * shows a placeholder tile. Renders nothing when none is picked.
 */
export function CategoryRail({ categories }: { categories: HomeCategory[] }) {
  const [ref, api] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
  });
  const { canPrev, canNext } = useCarouselNav(api);
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="home-categories">
      <h2 id="home-categories" className="mb-4 text-xl font-semibold">
        Kategoriler
      </h2>
      <div className="relative">
        <div ref={ref} className="overflow-hidden">
          <ul className="-ml-3 flex touch-pan-y">
            {categories.map((c) => (
              <li
                key={c.slug}
                className="min-w-0 shrink-0 basis-1/3 pl-3 sm:basis-1/4 lg:basis-1/6"
              >
                <Link
                  to="/kategori/$slug"
                  params={{ slug: c.slug }}
                  draggable={false}
                  className="group block text-center"
                >
                  <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.image_alt}
                        loading="lazy"
                        draggable={false}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        data-testid="category-placeholder"
                        className="grid size-full place-items-center text-muted-foreground"
                      >
                        <ImageIcon className="size-8" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span className="mt-2 block text-sm font-medium">{c.name}</span>
                </Link>
              </li>
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
