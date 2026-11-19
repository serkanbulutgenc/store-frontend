/** Turkey has no daylight saving time, so shop time is always UTC+3. */
const SHOP_OFFSET = "+03:00";

/** A `datetime-local` value (shop time) as an ISO time with its offset; empty is null. */
export function shopTimeToIso(local: string): string | null {
  const v = local.trim();
  if (v === "") return null;
  return `${v.length === 16 ? `${v}:00` : v}${SHOP_OFFSET}`;
}

/** An ISO time as the shop's wall clock for a `datetime-local` input ("2026-07-01T00:30"). */
export function isoToShopTime(iso: string): string {
  const shifted = new Date(Date.parse(iso) + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}
