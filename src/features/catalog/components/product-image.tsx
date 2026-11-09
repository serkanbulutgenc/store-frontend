import { cn } from "@/lib/utils";
import type { CardImage } from "../queries";

type Sized = { alt: string; sizes: { width: number; url: string }[] };

/** Responsive photo from the API's derivative sizes. Reserves its box so the page never jumps. */
export function ProductImage({
  image,
  sizes,
  className,
  eager = false,
}: {
  image: Sized | CardImage | null | undefined;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  if (!image || image.sizes.length === 0)
    return (
      <div
        role="img"
        aria-label="Fotoğraf yok"
        className={cn("aspect-[3/4] bg-muted", className)}
      />
    );
  const sorted = [...image.sizes].sort((a, b) => a.width - b.width);
  const largest = sorted[sorted.length - 1];
  return (
    <img
      src={(sorted.find((s) => s.width >= 400) ?? largest)?.url}
      srcSet={sorted.map((s) => `${s.url} ${s.width}w`).join(", ")}
      sizes={sizes}
      alt={image.alt}
      loading={eager ? "eager" : "lazy"}
      className={cn("aspect-[3/4] w-full bg-muted object-cover", className)}
    />
  );
}
