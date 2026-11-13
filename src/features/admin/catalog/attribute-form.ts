import { z } from "zod";

const name = z.string().trim().min(1, "Ad gerekli.").max(64, "En fazla 64 karakter.");

/** "Pamuk, Viskon, Keten" → ["Pamuk", "Viskon", "Keten"]; blanks dropped. */
export function parseOptions(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const createSchema = z
  .object({
    name,
    kind: z.enum(["option", "text"]),
    is_multiple: z.enum(["false", "true"]),
    is_filterable: z.enum(["false", "true"]),
    options: z.string(),
  })
  .superRefine((v, ctx) => {
    const labels = parseOptions(v.options);
    const lower = labels.map((l) => l.toLocaleLowerCase("tr"));
    if (new Set(lower).size !== lower.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Aynı seçenek iki kez yazılmış.",
      });
    }
    if (labels.some((l) => l.length > 64)) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Seçenek en fazla 64 karakter." });
    }
    if (
      v.kind === "text" &&
      (v.is_multiple === "true" || v.is_filterable === "true" || labels.length)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["kind"],
        message: "Metin özelliği çoklu, filtrelenebilir ya da seçenekli olamaz.",
      });
    }
  });

export const editSchema = z.object({ name, is_filterable: z.enum(["false", "true"]) });
export const optionSchema = z.object({
  label: z.string().trim().min(1, "Seçenek adı gerekli.").max(64, "En fazla 64 karakter."),
});

export const kindLabel = (kind: string) => (kind === "text" ? "Metin" : "Seçenek listesi");
