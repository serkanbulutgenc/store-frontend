import { apiErrorToFormErrors, type FormErrors } from "@/features/admin/forms/api-errors";
import { ApiError } from "@/lib/api/errors";

/**
 * What the checkout form keeps of a refused placement. A refused Voucher is not kept: the
 * Voucher field shows it next to the code, and the form has no `voucher_code` input, so an
 * error stored under that name could never be cleared and would block every later submit,
 * including "Kuponsuz devam et" followed by placing the order without the code.
 */
export function checkoutSubmitErrors(error: unknown): FormErrors | undefined {
  if (error instanceof ApiError && error.code === "voucher_invalid") return undefined;
  return apiErrorToFormErrors(error);
}
