import type { CategoryOut, ProductStatus } from "./queries";

type Labelled = Pick<CategoryOut, "id" | "name" | "parent_id"> & { slug?: string };

export function categoryLabels(categories: Labelled[]): { id: number; label: string }[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const label = (c: Labelled) => {
    const parent = c.parent_id == null ? undefined : byId.get(c.parent_id);
    return parent ? `${parent.name} › ${c.name}` : c.name;
  };
  // Parents before children, then by name, so the select reads as a tree.
  const sorted = [...categories].sort((a, b) => label(a).localeCompare(label(b), "tr"));
  return sorted.map((c) => ({ id: c.id, label: label(c) }));
}

const STATUS: Record<ProductStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  archived: "Arşivlenmiş",
};
export const statusLabel = (s: ProductStatus) => STATUS[s];

export const statusTone = { draft: "neutral", published: "good", archived: "warn" } as const;

/** Whether `term` is exactly one of the product's SKUs (any case) or barcodes. */
export function isExactCode(
  variants: { sku: string; barcode: string | null }[],
  term: string,
): boolean {
  const t = term.trim();
  return variants.some((v) => v.sku.toLowerCase() === t.toLowerCase() || v.barcode === t);
}
