import { moneySchema } from "../catalog/schemas";

export const PRICE_FIELDS = ["band_0_2", "band_3_5", "band_6_10", "per_extra_desi"] as const;
export type PriceField = (typeof PRICE_FIELDS)[number];
export type RateDraft = Record<PriceField, string>;

export const PRICE_LABELS: Record<PriceField, string> = {
  band_0_2: "0-2 desi",
  band_3_5: "3-5 desi",
  band_6_10: "6-10 desi",
  per_extra_desi: "10 üstü, her desi",
};

const BANDS = ["band_0_2", "band_3_5", "band_6_10"] as const;

const num = (s: string) => Number(s);

/**
 * Field errors for a rate row. Mirrors the API: every price above zero (a zero price would always
 * win the cheapest-carrier pick) and heavier bands never cheaper than lighter ones. The API is
 * still the authority; this only saves a round trip.
 */
export function rateErrors(draft: RateDraft): Partial<Record<PriceField, string>> {
  const errors: Partial<Record<PriceField, string>> = {};
  for (const f of PRICE_FIELDS) {
    const v = draft[f].trim();
    if (!moneySchema.safeParse(v).success) errors[f] = "Geçerli bir tutar girin (örn. 55.50).";
    else if (num(v) <= 0) errors[f] = "Tutar sıfırdan büyük olmalı.";
  }
  const [a, b, c] = BANDS;
  if (!errors[a] && !errors[b] && num(draft[a]) > num(draft[b]))
    errors[a] = "Fiyatlar desi aralığına göre artmalı.";
  if (!errors[b] && !errors[c] && num(draft[b]) > num(draft[c]))
    errors[c] = "Fiyatlar desi aralığına göre artmalı.";
  return errors;
}

export function rateDirty(saved: RateDraft, draft: RateDraft): boolean {
  return PRICE_FIELDS.some((f) => num(saved[f]) !== num(draft[f]));
}

/** Only the prices that changed, as the PATCH body. */
export function toRatePatch(saved: RateDraft, draft: RateDraft): Partial<RateDraft> {
  const patch: Partial<RateDraft> = {};
  for (const f of PRICE_FIELDS) if (num(saved[f]) !== num(draft[f])) patch[f] = draft[f].trim();
  return patch;
}

export { desiError } from "./desi";
