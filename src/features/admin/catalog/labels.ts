import type { CategoryOut, ProductStatus } from "./queries";

export function categoryLabels(categories: CategoryOut[]): { id: number; label: string }[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const label = (c: CategoryOut) => {
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
