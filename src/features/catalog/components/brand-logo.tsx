import { cn } from "@/lib/utils";

/** A Brand's logo, small, beside its name. Nothing when the Brand has none (or it is still
 * being processed). The name is always shown next to it, so the image is decorative. */
export function BrandLogo({
  url,
  className,
}: {
  url: string | null | undefined;
  className?: string;
}) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn("h-5 w-auto max-w-16 shrink-0 object-contain", className)}
    />
  );
}
