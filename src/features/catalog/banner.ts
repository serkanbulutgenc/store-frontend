/** Where a banner click goes, or null for a banner that is not a link. An address on this site
 * (a path starting with one `/`) opens in place; a full address opens in a new tab. */
export function bannerLink(link: string): { href: string; external: boolean } | null {
  const href = link.trim();
  if (/^\/(?!\/)/.test(href)) return { href, external: false };
  if (/^https?:\/\//.test(href)) return { href, external: true };
  return null;
}
