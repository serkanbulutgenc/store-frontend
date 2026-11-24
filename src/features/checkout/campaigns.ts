/** The Basket Campaigns a basket or Order has, as the API sends them: at most one discount
 * and one free shipping, discount first. */
export type AppliedCampaign = { label: string; discount: string; free_shipping: boolean };

const toKurus = (amount: string): number => {
  const [lira = "0", frac = ""] = amount.split(".");
  return Number(lira) * 100 + Number(frac.padEnd(2, "0").slice(0, 2));
};

export const kurusToAmount = (kurus: number): string =>
  `${Math.floor(kurus / 100)}.${String(kurus % 100).padStart(2, "0")}`;

export { toKurus };

/** The ones that take an amount off the items. */
export const discountCampaigns = (list: readonly AppliedCampaign[]) =>
  list.filter((c) => !c.free_shipping);

/** The one that waives the shipping fee, if any. */
export const freeShippingCampaign = (list: readonly AppliedCampaign[]) =>
  list.find((c) => c.free_shipping);

/** What the Basket Campaigns take off the items, in whole kuruş. */
export const campaignDiscountKurus = (list: readonly AppliedCampaign[]): number =>
  list.reduce((sum, c) => sum + toKurus(c.discount), 0);
