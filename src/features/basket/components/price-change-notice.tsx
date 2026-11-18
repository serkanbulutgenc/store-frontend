import { formatTry } from "@/lib/format";
import type { BasketLine } from "../queries";

/**
 * Tells the Shopper a line is priced differently from when they last saw it, for example a
 * Campaign started or ended. The basket always charges the current price; this is the warning.
 * Comparing the two money strings only picks the wording, nothing is calculated on them.
 */
export function PriceChangeNotice({
  line,
}: {
  line: Pick<BasketLine, "price_changed" | "previous_unit_price" | "unit_price">;
}) {
  if (!line.price_changed) return null;
  const before = line.previous_unit_price;
  const verb = !before
    ? "Fiyatı değişti"
    : Number(line.unit_price) < Number(before)
      ? "Fiyatı düştü"
      : "Fiyatı arttı";
  return (
    <p role="status" className="text-sm font-medium text-amber-800">
      {verb}
      {before ? `: ${formatTry(before)} → ${formatTry(line.unit_price)} / adet` : "."}
    </p>
  );
}
