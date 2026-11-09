const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const DATE = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Money arrives as a decimal string and is only ever formatted, never computed on. */
export function formatTry(amount: string | null | undefined): string {
  if (!amount) return "—";
  // Intl accepts a numeric string and formats it exactly, with no double rounding.
  return TRY.format(amount as unknown as number).replace(/\s/g, "");
}

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso)).replace(",", "");
}
