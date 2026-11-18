import { type Banner, bannerLink, shownBanner } from "../banner";

/** The Owner's banner (a Store setting), full width above the slider. Without an image it is
 * not drawn at all. The image is wide and short, so it keeps its own shape rather than being cropped. */
export function HomeBanner({ banner }: { banner: Banner | null | undefined }) {
  const shown = shownBanner(banner);
  if (!shown) return null;
  const link = bannerLink(shown.link);
  const image = (
    <img
      src={shown.image_url}
      alt={shown.alt}
      draggable={false}
      className="mx-auto max-h-64 w-full object-cover"
    />
  );
  return (
    <section aria-label="Duyuru" className="bg-muted">
      {link ? (
        <a
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="block"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </section>
  );
}
