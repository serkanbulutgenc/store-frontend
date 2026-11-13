import { z } from "zod";
import type { components } from "../../../../api/specs/openapi-admin";
import { desiError } from "../shipping/desi";

type ProductClassOut = components["schemas"]["ProductClassOut"];

const SCHEMES = {
  letters: "Harf (XS–XXL)",
  numbers: "Sayı (34–50)",
  shoes: "Ayakkabı (35–42)",
  bra: "Sütyen (70A–100D)",
  one_size: "Tek ebat",
} as const;

export const CLASS_SCHEME_OPTIONS = Object.entries(SCHEMES).map(([value, label]) => ({
  value,
  label,
}));

export const schemeLabel = (scheme: string) =>
  (SCHEMES as Record<string, string>)[scheme] ?? scheme;

/** A KDV percentage typed as "10", "20,5" or "7.5": 0 to 100, at most two decimals. */
export function kdvError(value: string): string | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return "KDV oranı bir sayı olmalı (örn. 10 veya 20).";
  return Number(v) <= 100 ? null : "KDV oranı 0 ile 100 arasında olmalı.";
}

export const classFormSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli.").max(128, "En fazla 128 karakter."),
  size_scheme: z.enum(Object.keys(SCHEMES) as [string, ...string[]], {
    message: "Beden düzeni seçin.",
  }),
  default_kdv_rate: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      const e = kdvError(v);
      if (e) ctx.addIssue({ code: "custom", message: e });
    })
    .transform((v) => v.replace(",", ".")),
  is_hygiene: z.enum(["true", "false"]),
  default_desi: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      const e = desiError(v);
      if (e) ctx.addIssue({ code: "custom", message: e });
    }),
});

export type ProductClassForm = z.infer<typeof classFormSchema>;

/** The size scheme cannot change once the class has Products (the API refuses it too). */
export function classLocks(row: ProductClassOut): Record<string, string> {
  return row.product_count
    ? { size_scheme: `Bu sınıfta ${row.product_count} ürün var; beden düzeni değiştirilemez.` }
    : {};
}
