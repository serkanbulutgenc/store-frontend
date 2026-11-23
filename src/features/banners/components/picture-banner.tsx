import { bannerLink } from "@/features/catalog/banner";
import { cn } from "@/lib/utils";
import type { PictureBanner as Banner } from "../queries";

type Sizes = Banner["image"];
const srcSet = (sizes: Sizes) => sizes.map((s) => `${s.url} ${s.width}w`).join(", ");
const sorted = (sizes: Sizes) => [...sizes].sort((a, b) => a.width - b.width);

/** The link wrapper: an address on this site opens in place, a full address in a new tab. */
export function BannerLink({
  link,
  className,
  children,
}: {
  link: string;
  className?: string;
  children: React.ReactNode;
}) {
  const target = bannerLink(link);
  if (!target) return <div className={className}>{children}</div>;
  return (
    <a
      href={target.href}
      {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn("block", className)}
    >
      {children}
    </a>
  );
}

/**
 * One Banner image. The box is reserved by `className` (an aspect ratio), so the page never
 * jumps; the picture covers it. Phones get the mobile image when there is one.
 */
export function PictureBannerImage({
  banner,
  eager = false,
  className,
}: {
  banner: Banner;
  eager?: boolean;
  className?: string;
}) {
  const desktop = sorted(banner.image);
  const mobile = banner.mobile_image ? sorted(banner.mobile_image) : [];
  const largest = desktop[desktop.length - 1];
  return (
    <picture>
      {mobile.length > 0 && (
        <source media="(max-width: 767px)" srcSet={srcSet(mobile)} sizes="100vw" />
      )}
      <img
        src={largest?.url}
        srcSet={srcSet(desktop)}
        sizes="100vw"
        alt={banner.alt}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className={cn("w-full bg-muted object-cover", className)}
      />
    </picture>
  );
}

/** A still banner (home mid-page, Category top). An empty slot renders nothing. */
export function BannerStrip({
  banners,
  label,
  className,
  eager = false,
}: {
  banners: Banner[];
  label: string;
  className?: string;
  eager?: boolean;
}) {
  if (banners.length === 0) return null;
  return (
    <section aria-label={label} className={cn("space-y-4", className)}>
      {banners.map((b, n) => (
        <BannerLink key={b.id} link={b.link} className="overflow-hidden rounded-md">
          <PictureBannerImage
            banner={b}
            eager={eager && n === 0}
            className="aspect-[3/2] md:aspect-[16/4]"
          />
        </BannerLink>
      ))}
    </section>
  );
}
