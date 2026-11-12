import type { components } from "../../../../api/specs/openapi-admin";

export type ImportPlan = components["schemas"]["ImportPlanOut"];
export type ImportCounts = components["schemas"]["ImportCountsOut"];

/** Client-side mirror of the upload limit; the API stays the authority. */
export const MAX_BYTES = 2 * 1024 * 1024;

export function validateCsvFile(file: Pick<File, "name" | "size">): string | null {
  if (!/\.(csv|txt)$/i.test(file.name)) return "Yalnızca CSV dosyası yüklenebilir.";
  if (file.size === 0) return "Dosya boş.";
  if (file.size > MAX_BYTES) return "Dosya 2 MB'tan büyük olamaz.";
  return null;
}

/** Number of variants a confirm would change. */
export function changeCount(c: ImportCounts): number {
  return c.variants_to_create + c.variants_to_update;
}

/** A preview with any row error blocks confirm; so does one that would change nothing. */
export function confirmBlocker(plan: ImportPlan): string | null {
  if (plan.errors.length > 0)
    return "Dosyadaki hataları düzeltip yeniden yükleyin; hata varken onaylanamaz.";
  if (changeCount(plan.counts) === 0)
    return "Bu dosya kayıtlı verilerle aynı; değişecek bir şey yok.";
  return null;
}

export const ACTION_LABEL: Record<string, string> = {
  create: "Yeni",
  update: "Güncellenecek",
  unchanged: "Değişmedi",
};

/** One line describing what a run did or would do, for the result and the preview. */
export function describeCounts(c: ImportCounts): string {
  const parts = [
    `${c.products_to_create} yeni ürün`,
    `${c.products_to_update} güncellenen ürün`,
    `${c.variants_to_create} yeni varyant`,
    `${c.variants_to_update} güncellenen varyant`,
    `${c.variants_unchanged} değişmeyen varyant`,
  ];
  return parts.join(", ");
}

/** What will be created beyond the products themselves, as labelled non-empty lists. */
export function createdLists(plan: ImportPlan): { label: string; items: string[] }[] {
  return [
    { label: "Yeni kategoriler", items: plan.new_categories },
    { label: "Yeni markalar", items: plan.new_brands },
    { label: "Yeni tedarikçiler", items: plan.new_suppliers },
  ].filter((l) => l.items.length > 0);
}
