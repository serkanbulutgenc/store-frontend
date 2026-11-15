import { X } from "lucide-react";
import { useId } from "react";
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
  if (voucher)
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span>{`Kupon (${voucher.code})`}</span>
          {!voucher.problem && <span>{`−${formatTry(voucher.discount)}`}</span>}
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
        {voucher.problem && (
          <p role="alert" className="text-red-700">
            {voucherMessage(voucher.problem, voucher.minimum ?? null)}
          </p>
        )}
        {onContinueWithout && (
          <Button type="button" variant="outline" disabled={pending} onClick={onContinueWithout}>
            Kuponsuz devam et
          </Button>
        )}
      </div>
    );
  return (
    <form
      className="space-y-1 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const code = new FormData(e.currentTarget).get("code");
        if (typeof code === "string" && code.trim()) onApply(code.trim());
      }}
    >
      <label htmlFor={id}>Kupon kodu</label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          Uygula
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
