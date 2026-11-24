import type { components } from "../../../../api/specs/openapi-admin";

export type BasketCampaignRow = components["schemas"]["BasketCampaignOut"];
export type Benefit = BasketCampaignRow["benefit"];

export const BENEFITS: { value: Benefit; label: string }[] = [
  { value: "fixed", label: "Tutar indirimi (₺)" },
  { value: "percentage", label: "Yüzde indirimi (%)" },
  { value: "free_shipping", label: "Ücretsiz kargo" },
];

export const benefitLabel = (b: Benefit): string => BENEFITS.find((x) => x.value === b)?.label ?? b;

/** "500", or "1.250,50": Turkish digits, cents only when there are any. Works on the API's
 * decimal strings ("500.00") so no float is involved. */
export function tl(amount: string): string {
  const [whole = "0", fraction = ""] = amount.trim().split(".");
  const cents = fraction.padEnd(2, "0").slice(0, 2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return cents === "00" ? grouped : `${grouped},${cents}`;
}

/** What the Shopper reads in the basket ("500 ₺ üzeri 50 ₺ indirim"), built from the rule the
 * same way the server builds it, so the Owner sees it before saving. */
export function ruleLabel(benefit: Benefit, minimum: string, value: string | null): string {
  const head = `${tl(minimum)} ₺ üzeri`;
  if (benefit === "fixed" && value) return `${head} ${tl(value)} ₺ indirim`;
  if (benefit === "percentage" && value) return `${head} %${tl(value)} indirim`;
  return `${head} ücretsiz kargo`;
}
