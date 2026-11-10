import type { BasketLine } from "./queries";

const PROBLEMS: Record<string, string> = {
  sold_out: "Bu ürün tükendi. Devam etmek için sepetinizden çıkarın.",
  unavailable: "Bu ürün artık satışta değil. Devam etmek için sepetinizden çıkarın.",
};

/** Turkish text for a line the Shopper has to fix before checkout; null when the line is fine. */
export function problemText(line: Pick<BasketLine, "problem" | "available">): string | null {
  if (!line.problem) return null;
  if (line.problem === "insufficient_stock")
    return `Stokta yalnızca ${line.available} adet var. Adedi düşürün.`;
  return PROBLEMS[line.problem] ?? "Bu ürün için bir sorun var.";
}
