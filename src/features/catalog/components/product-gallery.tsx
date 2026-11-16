import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "../queries";
import { ProductImage } from "./product-image";

type Photo = ProductDetail["photos"][number];

/**
 * Main photo with a thumbnail column on its left (md and up) or a row below it (phones). The column
 * is as tall as the main photo and scrolls when there are more thumbnails than fit. One photo, no
 * thumbnails. Remount with a new `key` when the colour changes so the primary photo shows again.
 */
export function ProductGallery({
  photos,
  fallback,
  sizes,
}: {
  photos: Photo[];
  fallback: ProductDetail["image"];
  sizes: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const current = photos.find((p) => p.id === picked) ?? photos[0];
  if (!current) return <ProductImage image={fallback} sizes={sizes} eager />;
  const thumbs = photos.length > 1;
  return (
    <div className={cn("flex flex-col gap-3", thumbs && "md:flex-row-reverse")}>
      <div className="min-w-0 flex-1">
        <ProductImage image={current} sizes={sizes} eager />
      </div>
      {thumbs && (
        // The list is out of flow on md+ so its height follows the main photo, not the other way round.
        <div className="md:relative md:w-20 md:shrink-0">
          <ul
            className="flex gap-2 overflow-x-auto md:absolute md:inset-0 md:flex-col md:overflow-x-hidden md:overflow-y-auto"
            aria-label="Fotoğraflar"
          >
            {photos.map((p, i) => (
              <li key={p.id} className="w-16 shrink-0 md:w-full">
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
        </div>
      )}
    </div>
  );
}
