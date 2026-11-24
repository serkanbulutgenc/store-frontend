/**
 * Preview of the fees checkout will charge, so the summary can show them before the Order
 * exists: the flat Settings shipping fee, which is what the backend charges until it knows the
 * destination. Amounts are decimal strings; the sum runs on whole kuruş so there is no float drift. The
 * placed Order's own totals are what the confirmation page shows.
 *
 * `feeSummary` prefers the backend's quote, which knows the destination province and the
 * parcel size; `previewFees` is only what shows while that quote is on its way.
 */
import type { CheckoutQuote } from "./queries";

export type FeeSettings = {
  shipping_fee: string;
  cod_fee: string;
};

export type PaymentChoice = "bank_transfer" | "cod";

const toKurus = (amount: string): number => {
  const [lira = "0", frac = ""] = amount.split(".");
  return Number(lira) * 100 + Number(frac.padEnd(2, "0").slice(0, 2));
};

const fromKurus = (kurus: number): string =>
  `${Math.floor(kurus / 100)}.${String(kurus % 100).padStart(2, "0")}`;

export function previewFees(
  subtotal: string,
  settings: FeeSettings,
  method: PaymentChoice,
  discount = "0.00",
) {
  const items = toKurus(subtotal);
  const shipping = toKurus(settings.shipping_fee);
  const cod = method === "cod" ? toKurus(settings.cod_fee) : 0;
  return {
    shipping: fromKurus(shipping),
    cod: fromKurus(cod),
    total: fromKurus(items - toKurus(discount) + shipping + cod),
  };
}

export function feeSummary(
  subtotal: string,
  settings: FeeSettings,
  method: PaymentChoice,
  quote: CheckoutQuote | undefined,
  basketDiscount = "0.00",
) {
  if (!quote)
    return {
      ...previewFees(subtotal, settings, method, basketDiscount),
      discount: basketDiscount,
      voucherCode: null,
      voucherProblem: null,
      calculated: false,
    };
  return {
    shipping: quote.shipping_fee,
    cod: quote.cod_fee,
    total: quote.total,
    discount: quote.discount,
    voucherCode: quote.voucher_code ?? null,
    voucherProblem: quote.voucher_problem ?? null,
    calculated: true,
  };
}
