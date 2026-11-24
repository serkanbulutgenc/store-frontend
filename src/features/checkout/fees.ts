/**
 * Preview of the fees checkout will charge, so the summary can show them before the Order
 * exists: the flat Settings shipping fee, which is what the backend charges until it knows the
 * destination. Amounts are decimal strings; the sum runs on whole kuruş so there is no float drift. The
 * placed Order's own totals are what the confirmation page shows.
 *
 * `feeSummary` prefers the backend's quote, which knows the destination province and the
 * parcel size; `previewFees` is only what shows while that quote is on its way.
 */
import { type AppliedCampaign, campaignDiscountKurus, freeShippingCampaign } from "./campaigns";
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

/** `discount` is the Voucher's, `campaigns` the basket's Basket Campaigns: the discount comes
 * off first and a free-shipping one waives the fee. Both are what the basket already worked out. */
export function previewFees(
  subtotal: string,
  settings: FeeSettings,
  method: PaymentChoice,
  discount = "0.00",
  campaigns: readonly AppliedCampaign[] = [],
) {
  const items = toKurus(subtotal);
  const shipping = freeShippingCampaign(campaigns) ? 0 : toKurus(settings.shipping_fee);
  const cod = method === "cod" ? toKurus(settings.cod_fee) : 0;
  const off = campaignDiscountKurus(campaigns);
  return {
    shipping: fromKurus(shipping),
    cod: fromKurus(cod),
    total: fromKurus(items - off - toKurus(discount) + shipping + cod),
  };
}

export function feeSummary(
  subtotal: string,
  settings: FeeSettings,
  method: PaymentChoice,
  quote: CheckoutQuote | undefined,
  basketDiscount = "0.00",
  basketCampaigns: readonly AppliedCampaign[] = [],
) {
  if (!quote)
    return {
      ...previewFees(subtotal, settings, method, basketDiscount, basketCampaigns),
      campaigns: basketCampaigns,
      discount: basketDiscount,
      voucherCode: null,
      voucherProblem: null,
      calculated: false,
    };
  return {
    shipping: quote.shipping_fee,
    cod: quote.cod_fee,
    total: quote.total,
    campaigns: quote.campaigns ?? [],
    discount: quote.discount,
    voucherCode: quote.voucher_code ?? null,
    voucherProblem: quote.voucher_problem ?? null,
    calculated: true,
  };
}
