import { useState } from "react";
import type { VoucherFieldProps } from "./components/voucher-field";
import { type Basket, useApplyVoucher, useRemoveVoucher } from "./queries";
import { applyErrorMessage, voucherMessage, voucherReason } from "./voucher";

/**
 * Everything `VoucherField` needs, for the cart and the checkout alike. `placeError` is the
 * error of placing the Order: a refused code there is shown next to the code, with a way to
 * carry on without it. A refused apply is kept here, in the page, and clears on the next try.
 */
export function useVoucherField(
  voucher: Basket["voucher"],
  placeError?: unknown,
): VoucherFieldProps {
  const apply = useApplyVoucher();
  const remove = useRemoveVoucher();
  const [error, setError] = useState<string | null>(null);

  const reason = voucherReason(placeError);
  const refusedAtCheckout = reason ? voucherMessage(reason, voucher?.minimum ?? null) : null;
  const drop = () => {
    setError(null);
    remove.mutate();
  };

  return {
    voucher: voucher ?? null,
    error: error ?? refusedAtCheckout,
    pending: apply.isPending || remove.isPending,
    onApply: (code) => {
      setError(null);
      apply.mutate(code, { onError: (e) => setError(applyErrorMessage(e)) });
    },
    onRemove: drop,
    onContinueWithout: refusedAtCheckout ? drop : undefined,
  };
}
