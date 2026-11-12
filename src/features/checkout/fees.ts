/**
 * Preview of the fees checkout will charge, so the summary can show them before the Order
 * exists. Same rule as the backend: shipping is free once the items reach the threshold.
 * Amounts are decimal strings; the sum runs on whole kuruş so there is no float drift. The
 * placed Order's own totals are what the confirmation page shows.
 *
 * `feeSummary` prefers the backend's quote, which knows the destination province and the
 * parcel size; `previewFees` is only what shows while that quote is on its way.
 */
import type { CheckoutQuote } from "./queries";

export type FeeSettings = {
  shipping_fee: string;
  free_shipping_threshold: string | null;
  cod_fee: string;
};

export type PaymentChoice = "bank_transfer" | "cod";

const toKurus = (amount: string): number => {
  const [lira = "0", frac = ""] = amount.split(".");
  return Number(lira) * 100 + Number(frac.padEnd(2, "0").slice(0, 2));
};

const fromKurus = (kurus: number): string =>
  `${Math.floor(kurus / 100)}.${String(kurus % 100).padStart(2, "0")}`;

export function previewFees(subtotal: string, settings: FeeSettings, method: PaymentChoice) {
  const items = toKurus(subtotal);
  const threshold = settings.free_shipping_threshold;
  const free = threshold !== null && items >= toKurus(threshold);
  const shipping = free ? 0 : toKurus(settings.shipping_fee);
  const cod = method === "cod" ? toKurus(settings.cod_fee) : 0;
  return {
    shipping: fromKurus(shipping),
    cod: fromKurus(cod),
    total: fromKurus(items + shipping + cod),
    freeShipping: free,
  };
}

export function feeSummary(
  subtotal: string,
  settings: FeeSettings,
  method: PaymentChoice,
  quote: CheckoutQuote | undefined,
) {
  if (!quote) return { ...previewFees(subtotal, settings, method), calculated: false };
  return {
    shipping: quote.shipping_fee,
    cod: quote.cod_fee,
    total: quote.total,
    freeShipping: quote.free_shipping,
    calculated: true,
  };
}
