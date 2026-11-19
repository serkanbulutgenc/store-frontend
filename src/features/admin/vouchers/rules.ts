import { formatDate, formatPercent, formatTry } from "@/lib/format";

const STATUS: Record<string, string> = {
  active: "Aktif",
  scheduled: "Planlandı",
  exhausted: "Tükendi",
  expired: "Süresi doldu",
  inactive: "Kapalı",
};

/** The statuses the vouchers API can filter by. */
export const VOUCHER_STATUSES = Object.keys(STATUS);
export const voucherStatusLabel = (s: string) => STATUS[s] ?? s;

export function voucherStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "active") return "good";
  if (s === "expired" || s === "exhausted") return "warn";
  return "neutral";
}

/** What the code takes off: "%10 indirim", "%12,5 indirim" or "₺50,00 indirim". */
export function benefitText(kind: string, value: string): string {
  if (kind === "percentage") {
    return `%${formatPercent(value)} indirim`;
  }
  return `${formatTry(value)} indirim`;
}

/** The uses so far against the cap ("3 / 100"), or just the uses when there is no cap. */
export function redemptionsText(redemptions: number, cap: number | null): string {
  return cap === null ? String(redemptions) : `${redemptions} / ${cap}`;
}

/** The end as shop time, or "Süresiz" when the voucher has no expiry. */
export const expiryText = (endsAt: string | null) => (endsAt ? formatDate(endsAt) : "Süresiz");

export type VoucherToggle = {
  action: "activate" | "deactivate";
  label: string;
  success: string;
};

/** The one switch a row offers: "Aç" for a closed voucher, "Kapat" for any other. A voucher
 * that is expired or used up can still be closed, so it does not come back by itself. */
export function voucherToggle(status: string): VoucherToggle {
  return status === "inactive"
    ? { action: "activate", label: "Aç", success: "Kupon açıldı." }
    : { action: "deactivate", label: "Kapat", success: "Kupon kapatıldı." };
}
