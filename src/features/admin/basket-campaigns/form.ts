import { z } from "zod";
import { isoToShopTime, shopTimeToIso } from "@/lib/shop-time";
import type { components } from "../../../../api/specs/openapi-admin";
import type { BasketCampaignRow } from "./rules";

type BasketCampaignIn = components["schemas"]["BasketCampaignIn"];
type BasketCampaignPatch = components["schemas"]["BasketCampaignPatch"];

const NAME_MAX = 200;
const MAX_AMOUNT = 99_999_999.99;

/** "12,5" becomes "12.5"; null when it is not a plain number with at most two decimals. */
function amount(raw: string): string | null {
  const v = raw.trim().replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(v) ? v : null;
}

const moment = (raw: string): number | null => {
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
};

/** The form's rules, the same the API enforces: a name, a minimum above zero, and a value that
 * fits the benefit (a TL amount below the minimum, or 1 to 99 percent, or none for free
 * shipping), with an end after the start. */
export const basketCampaignFormSchema = z
  .object({
    name: z.string(),
    minimum_amount: z.string(),
    benefit: z.enum(["fixed", "percentage", "free_shipping"]),
    value: z.string(),
    starts_at: z.string(),
    ends_at: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const refuse = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const name = v.name.trim();
    if (name === "" || name.length > NAME_MAX) {
      refuse("name", `Kampanya adı 1-${NAME_MAX} karakter olmalı.`);
    }
    const minimum = amount(v.minimum_amount);
    const min = minimum === null ? Number.NaN : Number(minimum);
    if (!(min > 0 && min <= MAX_AMOUNT))
      refuse("minimum_amount", "Sepet tutarı 0'dan büyük olmalı.");
    const value = amount(v.value);
    const n = value === null ? Number.NaN : Number(value);
    if (v.benefit === "percentage" && !(n >= 1 && n <= 99)) {
      refuse("value", "İndirim yüzdesi 1 ile 99 arasında olmalı.");
    }
    if (v.benefit === "fixed") {
      if (!(n > 0)) refuse("value", "İndirim tutarı 0'dan büyük olmalı.");
      else if (min > 0 && n >= min)
        refuse("value", "İndirim tutarı sepet tutarından küçük olmalı.");
    }
    const start = v.starts_at.trim() === "" ? null : moment(v.starts_at);
    const end = v.ends_at.trim() === "" ? null : moment(v.ends_at);
    if (v.starts_at.trim() !== "" && start === null)
      refuse("starts_at", "Geçerli bir tarih girin.");
    if (v.ends_at.trim() !== "" && end === null) refuse("ends_at", "Geçerli bir tarih girin.");
    if (start !== null && end !== null && end <= start) {
      refuse("ends_at", "Bitiş, başlangıçtan sonra olmalı.");
    }
  })
  .transform((v) => ({
    ...v,
    name: v.name.trim(),
    minimum_amount: amount(v.minimum_amount) ?? v.minimum_amount.trim(),
    // Free shipping takes no amount, whatever was typed before the benefit was switched.
    value: v.benefit === "free_shipping" ? "" : (amount(v.value) ?? v.value.trim()),
  }));

export type BasketCampaignForm = z.input<typeof basketCampaignFormSchema>;
export type BasketCampaignValues = z.output<typeof basketCampaignFormSchema>;

const sentValue = (v: BasketCampaignValues) => (v.benefit === "free_shipping" ? null : v.value);

export function createBody(v: BasketCampaignValues): BasketCampaignIn {
  return {
    name: v.name,
    minimum_amount: v.minimum_amount,
    benefit: v.benefit,
    value: sentValue(v),
    starts_at: shopTimeToIso(v.starts_at),
    ends_at: shopTimeToIso(v.ends_at),
    is_active: v.is_active,
  };
}

/** Blank for a new Basket Campaign (on, TL off), the Campaign's own when editing. */
export function basketCampaignDefaults(row?: BasketCampaignRow): BasketCampaignForm {
  if (!row) {
    return {
      name: "",
      minimum_amount: "",
      benefit: "fixed",
      value: "",
      starts_at: "",
      ends_at: "",
      is_active: true,
    };
  }
  return {
    name: row.name,
    minimum_amount: row.minimum_amount,
    benefit: row.benefit,
    value: row.value ?? "",
    starts_at: row.starts_at === null ? "" : isoToShopTime(row.starts_at),
    ends_at: row.ends_at === null ? "" : isoToShopTime(row.ends_at),
    is_active: row.is_active,
  };
}

/** The body for editing: only what differs. The rule is checked as a whole on the server, so a
 * changed benefit always sends its value with it (null for free shipping). The on/off switch has
 * its own endpoints. */
export function editBody(v: BasketCampaignValues, row: BasketCampaignRow): BasketCampaignPatch {
  const was = basketCampaignDefaults(row);
  const body: BasketCampaignPatch = {};
  if (v.name !== was.name) body.name = v.name;
  if (Number(v.minimum_amount) !== Number(was.minimum_amount)) {
    body.minimum_amount = v.minimum_amount;
  }
  const valueChanged =
    v.benefit === "free_shipping" ? row.value !== null : Number(v.value) !== Number(was.value);
  if (v.benefit !== was.benefit) {
    body.benefit = v.benefit;
    body.value = sentValue(v);
  } else if (valueChanged) {
    body.value = sentValue(v);
  }
  if (v.starts_at !== was.starts_at) body.starts_at = shopTimeToIso(v.starts_at);
  if (v.ends_at !== was.ends_at) body.ends_at = shopTimeToIso(v.ends_at);
  return body;
}

/** Which on/off endpoint an edit needs, if the switch was moved. */
export function activationChange(
  v: BasketCampaignValues,
  row: BasketCampaignRow,
): "activate" | "deactivate" | null {
  if (v.is_active === row.is_active) return null;
  return v.is_active ? "activate" : "deactivate";
}
