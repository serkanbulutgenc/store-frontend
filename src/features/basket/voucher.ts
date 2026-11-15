import { ApiError } from "@/lib/api/errors";
import { formatTry } from "@/lib/format";

/**
 * What the Shopper reads when a Voucher code does not work. The backend names the reason; the
 * wording hides what a Shopper must not learn: whether a code exists, is switched off, used up or
 * already used by them all read as "invalid".
 */
export function voucherMessage(reason: string, minimum: string | null): string {
  if (reason === "expired") return "Bu kuponun süresi dolmuş.";
  if (reason === "minimum" && minimum)
    return `Bu kupon için sepet tutarı en az ${formatTry(minimum)} olmalı.`;
  return "Geçersiz kupon kodu.";
}

/** Why the backend refused a Voucher code (a 422 from the cart, a 409 from checkout); else null. */
export function voucherReason(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.code !== "voucher_invalid") return null;
  return error.fields.voucher_code?.[0] ?? null;
}
