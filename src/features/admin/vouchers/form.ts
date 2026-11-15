import { z } from "zod";
import type { components } from "../../../../api/specs/openapi-admin";

type VoucherIn = components["schemas"]["VoucherIn"];
type VoucherPatch = components["schemas"]["VoucherPatch"];
export type VoucherRow = components["schemas"]["VoucherAdminOut"];

const CODE_SHAPE = /^[A-Z0-9-]{3,20}$/;

/** The code as the API tidies it up: spaces trimmed, capitals. */
const tidyCode = (raw: string) => raw.trim().toUpperCase();

/** "12,5" becomes "12.5"; null when it is not a plain number with at most two decimals. */
function amount(raw: string): string | null {
  const v = raw.trim().replace(",", ".");
  return /^-?\d+(\.\d{1,2})?$/.test(v) ? v : null;
}

/** A `datetime-local` value as a number to compare, or null when it is not a date. */
const moment = (raw: string): number | null => {
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
};

const whole = (raw: string): number | null => (/^-?\d+$/.test(raw.trim()) ? Number(raw) : null);

/** The form's rules; `redemptions` is how often the voucher was used, which the cap
 * cannot go below. */
export const voucherFormSchemaFor = (redemptions = 0) =>
  z
    .object({
      code: z.string(),
      kind: z.enum(["percentage", "fixed"]),
      value: z.string(),
      minimum: z.string(),
      cap: z.string(),
      starts_at: z.string(),
      ends_at: z.string(),
      once_per_customer: z.boolean(),
    })
    .superRefine((v, ctx) => {
      const refuse = (path: string, message: string) =>
        ctx.addIssue({ code: "custom", path: [path], message });
      if (!CODE_SHAPE.test(tidyCode(v.code))) {
        refuse(
          "code",
          "Kupon kodu 3-20 karakter olmalı; yalnızca A-Z, 0-9 ve tire kullanılabilir.",
        );
      }
      const value = amount(v.value);
      const n = value === null ? Number.NaN : Number(value);
      if (v.kind === "percentage" && !(n >= 1 && n <= 100)) {
        refuse("value", "Yüzde 1 ile 100 arasında olmalı.");
      } else if (v.kind === "fixed" && !(n > 0)) {
        refuse("value", "Tutar sıfırdan büyük olmalı.");
      }
      if (v.minimum.trim() !== "") {
        const minimum = amount(v.minimum);
        if (minimum === null || Number(minimum) < 0) {
          refuse("minimum", "Alt sınır sıfırdan küçük olamaz.");
        }
      }
      if (v.cap.trim() !== "") {
        const cap = whole(v.cap);
        if (cap === null || cap < 1) refuse("cap", "Kullanım sınırı en az 1 olmalı.");
        else if (cap < redemptions) {
          refuse("cap", `Kullanım sınırı, şimdiye kadarki kullanımdan (${redemptions}) az olamaz.`);
        }
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
      code: tidyCode(v.code),
      value: amount(v.value) ?? v.value.trim(),
      minimum: v.minimum.trim() === "" ? "" : (amount(v.minimum) ?? v.minimum.trim()),
      cap: v.cap.trim(),
    }));

export const voucherFormSchema = voucherFormSchemaFor();

export type VoucherForm = z.input<typeof voucherFormSchema>;

export type VoucherValues = z.output<typeof voucherFormSchema>;

/** Turkey has no daylight saving time, so shop time is always UTC+3. */
const SHOP_OFFSET = "+03:00";

/** A `datetime-local` value (shop time) as an ISO time with its offset; empty is null. */
export function shopTimeToIso(local: string): string | null {
  const v = local.trim();
  if (v === "") return null;
  return `${v.length === 16 ? `${v}:00` : v}${SHOP_OFFSET}`;
}

/** The body for creating a voucher; what was left empty goes as null. */
export function createBody(v: VoucherValues): VoucherIn {
  return {
    code: v.code,
    kind: v.kind,
    value: v.value,
    minimum: v.minimum === "" ? null : v.minimum,
    cap: v.cap === "" ? null : Number(v.cap),
    starts_at: shopTimeToIso(v.starts_at),
    ends_at: shopTimeToIso(v.ends_at),
    once_per_customer: v.once_per_customer,
  };
}

/** An ISO time as the shop's wall clock for a `datetime-local` input ("2026-07-01T00:30"). */
function isoToShopTime(iso: string): string {
  const shifted = new Date(Date.parse(iso) + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** The form's starting values: blank for a new voucher, the voucher's own when editing. */
export function voucherDefaults(row?: VoucherRow): VoucherForm {
  if (!row) {
    return {
      code: "",
      kind: "percentage",
      value: "",
      minimum: "",
      cap: "",
      starts_at: "",
      ends_at: "",
      once_per_customer: false,
    };
  }
  return {
    code: row.code,
    kind: row.kind,
    value: row.value,
    minimum: row.minimum ?? "",
    cap: row.cap === null ? "" : String(row.cap),
    starts_at: isoToShopTime(row.starts_at),
    ends_at: row.ends_at === null ? "" : isoToShopTime(row.ends_at),
    once_per_customer: row.once_per_customer,
  };
}

const sameAmount = (a: string, b: string) =>
  (a === "" && b === "") || (a !== "" && b !== "" && Number(a) === Number(b));

/** The body for editing a voucher: only what differs from the voucher as it is. Empty
 * limits go as null (which clears them); a cleared start is left alone, since a voucher
 * always has one. */
export function editBody(v: VoucherValues, row: VoucherRow): VoucherPatch {
  const was = voucherDefaults(row);
  const body: VoucherPatch = {};
  if (v.code !== was.code) body.code = v.code;
  if (!sameAmount(v.value, was.value)) body.value = v.value;
  if (!sameAmount(v.minimum, was.minimum)) body.minimum = v.minimum === "" ? null : v.minimum;
  if (v.cap !== was.cap) body.cap = v.cap === "" ? null : Number(v.cap);
  if (v.starts_at !== "" && v.starts_at !== was.starts_at)
    body.starts_at = shopTimeToIso(v.starts_at);
  if (v.ends_at !== was.ends_at) body.ends_at = shopTimeToIso(v.ends_at);
  if (v.once_per_customer !== was.once_per_customer) {
    body.once_per_customer = v.once_per_customer;
  }
  return body;
}

const LOCKED = "Kupon kullanıldığı için değiştirilemez.";

/** What the API will not change once the voucher was used, with the reason to show. */
export function voucherLocks(row: VoucherRow): Record<string, string> {
  return row.redemptions > 0 ? { code: LOCKED, once_per_customer: LOCKED } : {};
}

/** Why the cap cannot go lower, once the voucher was used. */
export function voucherCapHint(row: VoucherRow): string | undefined {
  return row.redemptions > 0
    ? `Şimdiye kadar ${row.redemptions} kez kullanıldı; sınır bundan az olamaz.`
    : undefined;
}
