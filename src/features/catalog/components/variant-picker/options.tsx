import { Minus, Plus, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { sizesForColour } from "../../product-options";
import type { ProductDetail } from "../../queries";

/** The most one add-to-basket can ask for; the basket itself enforces real stock. */
const MAX_QTY = 10;

export function ColourChips({
  colours,
  colourId,
  onSelect,
}: {
  colours: ProductDetail["colours"];
  colourId: number | null;
  onSelect: (colourId: number) => void;
}) {
  const colour = colours.find((c) => c.id === colourId);
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 font-medium">Renk{colour ? `: ${colour.name}` : ""}</legend>
      <div className="flex flex-wrap gap-2">
        {colours.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.name}
            aria-label={c.name}
            aria-pressed={c.id === colourId}
            onClick={() => onSelect(c.id)}
            className={cn(
              "size-9 rounded-full border-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
              c.id === colourId ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
            style={{ backgroundColor: c.hex_code }}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** A sold-out Size stays selectable, so the Shopper can ask for a Stock alert on it. */
export function SizeChips({
  sizes,
  size,
  onSelect,
}: {
  sizes: ReturnType<typeof sizesForColour>;
  size: string | null;
  onSelect: (size: string) => void;
}) {
  // A one-size colour has nothing to choose.
  if (sizes.length <= 1) return null;
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 font-medium">Beden</legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s.variantId}
            type="button"
            aria-pressed={s.size === size}
            onClick={() => onSelect(s.size)}
            className={cn(
              "min-w-11 rounded-md border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              s.size === size
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card",
              !s.inStock && "text-muted-foreground line-through",
            )}
          >
            {s.size}
            {!s.inStock && <span className="sr-only"> (tükendi)</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <fieldset className="m-0 inline-flex h-12 shrink-0 items-center rounded-md border border-border bg-card p-0">
      <legend className="sr-only">Adet</legend>
      <button
        type="button"
        aria-label="Adedi azalt"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="grid h-full w-11 place-items-center rounded-l-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-medium">
        {quantity}
      </output>
      <button
        type="button"
        aria-label="Adedi artır"
        disabled={quantity >= MAX_QTY}
        onClick={() => onChange(quantity + 1)}
        className="grid h-full w-11 place-items-center rounded-r-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </fieldset>
  );
}

export function HygieneNotice() {
  return (
    <p className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Hijyen nedeniyle bu ürün, ambalajı açıldıktan sonra iade edilemez.
    </p>
  );
}
