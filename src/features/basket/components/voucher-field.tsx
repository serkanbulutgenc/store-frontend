import { X } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTry } from "@/lib/format";
import type { Basket } from "../queries";
import { voucherMessage } from "../voucher";

type AppliedVoucher = NonNullable<Basket["voucher"]>;

export type VoucherFieldProps = {
  /** What the basket carries, or null when no code is applied. */
  voucher: AppliedVoucher | null;
  /** Why the last attempt failed, in Turkish; null when nothing failed. */
  error: string | null;
  pending: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
  /** Given only after checkout refused the code: drop it so the Order can be placed again. */
  onContinueWithout?: () => void;
};

/** The "Kupon kodu" block of the cart and the checkout summary. It does no fetching. */
export function VoucherField({
  voucher,
  error,
  pending,
  onApply,
  onRemove,
  onContinueWithout,
}: VoucherFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const apply = () => {
    const code = input.current?.value.trim();
    if (code) onApply(code);
  };
  if (voucher) {
    // A refusal from checkout is newer news than the cart's own flag.
    const refusal =
      error ?? (voucher.problem ? voucherMessage(voucher.problem, voucher.minimum ?? null) : null);
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span>{`Kupon (${voucher.code})`}</span>
          {!refusal && <span>{`−${formatTry(voucher.discount)}`}</span>}
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="inline-flex items-center gap-1 disabled:opacity-40"
          >
            <X className="size-4" aria-hidden="true" />
            Kaldır
          </button>
        </div>
        {refusal && (
          <p role="alert" className="text-red-700">
            {refusal}
          </p>
        )}
        {onContinueWithout && (
          <Button type="button" variant="outline" disabled={pending} onClick={onContinueWithout}>
            Kuponsuz devam et
          </Button>
        )}
      </div>
    );
  }
  return (
    // Not a <form>: the checkout page puts this inside its own form, and a form inside a
    // form is invalid HTML (the browser drops it and "Uygula" would submit the page).
    <div className="space-y-1 text-sm">
      <label htmlFor={id}>Kupon kodu</label>
      <div className="flex gap-2">
        <Input
          ref={input}
          id={id}
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault(); // Enter must apply the code, not submit the surrounding form
            apply();
          }}
        />
        <Button type="button" variant="outline" disabled={pending} onClick={apply}>
          Uygula
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
