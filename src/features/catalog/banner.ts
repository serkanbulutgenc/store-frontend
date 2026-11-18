import type { components } from "../../../api/specs/openapi-store";

export type Banner = components["schemas"]["BannerOut"];

/** The banner the home page shows: only one with an image. The Owner can leave the setting empty. */
export function shownBanner(banner: Banner | null | undefined): Banner | null {
  return banner && banner.image_url.trim() !== "" ? banner : null;
}

/** Where a banner click goes, or null for a banner that is not a link. An address on this site
 * (a path starting with one `/`) opens in place; a full address opens in a new tab. */
export function bannerLink(link: string): { href: string; external: boolean } | null {
  const href = link.trim();
  if (/^\/(?!\/)/.test(href)) return { href, external: false };
  if (/^https?:\/\//.test(href)) return { href, external: true };
  return null;
}
