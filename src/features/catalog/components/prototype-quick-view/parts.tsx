// PROTOTYPE: small shared bits only (chips). Layouts are per-variant.
import { cn } from "@/lib/utils";
import type { ProductDetail } from "../../queries";
import type { QuickPick } from "./use-quick-pick";

export function ColourChips({ product, pick }: { product: ProductDetail; pick: QuickPick }) {
  if (product.colours.length < 2) return null;
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0" aria-label="Renk">
      {product.colours.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.name}
          aria-label={c.name}
          aria-pressed={c.id === pick.colourId}
          onClick={() => pick.setColourId(c.id)}
          className={cn(
            "size-7 rounded-full border-2",
            c.id === pick.colourId ? "border-primary ring-2 ring-primary/30" : "border-border",
          )}
          style={{ backgroundColor: c.hex_code }}
        />
      ))}
    </fieldset>
  );
}

export function SizeChips({
  pick,
  onPick,
  className,
}: {
  pick: QuickPick;
  /** When set, tapping a size calls this instead of just selecting (one-tap add). */
  onPick?: (variantId: number) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-wrap gap-1.5 border-0 p-0", className)} aria-label="Beden">
      {pick.sizes.map((s) => (
        <button
          key={s.variantId}
          type="button"
          disabled={!s.inStock || pick.pending}
          aria-pressed={s.size === pick.size}
          onClick={() => (onPick ? onPick(s.variantId) : pick.setSize(s.size))}
          className={cn(
            "min-w-9 rounded-md border px-2 py-1 text-sm",
            s.size === pick.size
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
            !s.inStock && "text-muted-foreground line-through opacity-60",
          )}
        >
          {s.size}
        </button>
      ))}
    </fieldset>
  );
}
