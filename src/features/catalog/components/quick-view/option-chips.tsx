import { cn } from "@/lib/utils";
import type { ProductDetail } from "../../queries";
import type { QuickPick } from "./use-quick-pick";

export function ColourChips({ product, pick }: { product: ProductDetail; pick: QuickPick }) {
  if (product.colours.length < 2) return null;
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Renk</legend>
      {product.colours.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.name}
          aria-label={c.name}
          aria-pressed={c.id === pick.colourId}
          onClick={() => pick.setColourId(c.id)}
          className={cn(
            "size-8 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            c.id === pick.colourId ? "border-primary ring-2 ring-primary/30" : "border-border",
          )}
          style={{ backgroundColor: c.hex_code }}
        />
      ))}
    </fieldset>
  );
}

/** With `onPick`, tapping a size acts at once (one-tap add); without it, the size is selected. */
export function SizeChips({
  pick,
  onPick,
}: {
  pick: QuickPick;
  onPick?: (variantId: number) => void;
}) {
  // A one-size colour has nothing to choose, except in the strip, where the lone size is shown.
  if (pick.sizes.length === 1 && !onPick) return null;
  return (
    <fieldset className="flex flex-wrap gap-1.5 border-0 p-0">
      <legend className="sr-only">Beden</legend>
      {pick.sizes.map((s) => (
        <button
          key={s.variantId}
          type="button"
          disabled={!s.inStock || pick.pending}
          aria-pressed={s.size === pick.size}
          onClick={() => (onPick ? onPick(s.variantId) : pick.setSize(s.size))}
          className={cn(
            "min-w-9 rounded-md border px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            s.size === pick.size
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
            !s.inStock && "text-muted-foreground line-through",
          )}
        >
          {s.size}
          {!s.inStock && <span className="sr-only"> (tükendi)</span>}
        </button>
      ))}
    </fieldset>
  );
}
