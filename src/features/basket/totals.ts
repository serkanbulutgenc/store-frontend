import {
  type AppliedCampaign,
  campaignDiscountKurus,
  kurusToAmount,
  toKurus,
} from "../checkout/campaigns";

type BasketLike = {
  subtotal: string;
  campaigns?: readonly AppliedCampaign[];
  voucher?: { discount: string; problem?: string | null } | null;
};

/** What the Voucher takes off, or nothing when it is refused. */
const voucherKurus = (b: BasketLike): number =>
  b.voucher && !b.voucher.problem ? toKurus(b.voucher.discount) : 0;

/** Whether anything is taken off the items. */
export const hasDiscounts = (b: BasketLike): boolean =>
  campaignDiscountKurus(b.campaigns ?? []) + voucherKurus(b) > 0;

/** The items after every discount, shipping not yet counted: what the Shopper sees under the
 * discount lines. A free-shipping Basket Campaign takes nothing off the items. */
export function afterDiscounts(b: BasketLike): string {
  const off = campaignDiscountKurus(b.campaigns ?? []) + voucherKurus(b);
  return kurusToAmount(Math.max(0, toKurus(b.subtotal) - off));
}
