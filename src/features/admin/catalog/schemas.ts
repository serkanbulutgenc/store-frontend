import { z } from "zod";
import type { components } from "../../../../api/specs/openapi-admin";
import { desiError } from "../shipping/desi";

// openapi-typescript marks defaulted fields required; the API treats `supplier_code` as optional
// and rejects it from Staff when present, so it must be omittable.
type ProductIn = Omit<components["schemas"]["ProductIn"], "supplier_code"> & {
  supplier_code?: string;
};
export type ProductBody = ProductIn;

/** Money is a decimal string with up to two places. Never parsed to a number. */
export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir tutar girin (örn. 199.90).");
const optionalMoney = z.union([z.literal(""), moneySchema]);
const requiredId = (message: string) => z.string().regex(/^\d+$/, message);
const optionalId = z.union([z.literal(""), z.string().regex(/^\d+$/)]);
const nullIfEmpty = (v: string) => (v === "" ? null : v);
const toId = (v: string) => (v === "" ? null : Number(v));

/** Form values are strings (inputs); `toProductBody` turns them into the API body. */
export const productFormSchema = z.object({
  title: z.string().trim().min(1, "Ürün adı gerekli."),
  slug: z.string().trim(),
  category_id: requiredId("Kategori seçin."),
  brand_id: optionalId,
  product_class_id: requiredId("Ürün sınıfı seçin."),
  shelf_price: moneySchema,
  old_price: optionalMoney,
  cost_price: optionalMoney,
  supplier_id: optionalId,
  supplier_code: z.string().trim(),
  low_stock_threshold: z.union([z.literal(""), z.string().regex(/^\d+$/, "Tam sayı girin.")]),
  desi: z.string().superRefine((v, ctx) => {
    const message = desiError(v, { optional: true });
    if (message) ctx.addIssue({ code: "custom", message });
  }),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Cost price and Supplier data are Owner-only and the API rejects them from Staff, so they
 * are left out of the body unless the user may see them.
 */
export function toProductBody(
  v: ProductFormValues,
  can: { cost: boolean; supplier: boolean; desi: boolean },
  mode: "create" | "edit" = "create",
) {
  const body: ProductIn = {
    title: v.title,
    category_id: Number(v.category_id),
    brand_id: toId(v.brand_id),
    product_class_id: Number(v.product_class_id),
    shelf_price: v.shelf_price,
    old_price: nullIfEmpty(v.old_price),
  };
  // Blank means "use the default / generate it" on create. On edit the API reads null as a value
  // (slug "none", or an invalid threshold), so a blank field is simply left out of the PATCH.
  if (mode === "create" || v.slug !== "") body.slug = nullIfEmpty(v.slug);
  if (mode === "create" || v.low_stock_threshold !== "")
    body.low_stock_threshold = toId(v.low_stock_threshold);
  // Owner only: Blank clears the override, so the class default applies; null is a valid value here.
  if (can.desi) body.desi = v.desi.trim() === "" ? null : Number(v.desi);
  if (can.cost) body.cost_price = nullIfEmpty(v.cost_price);
  if (can.supplier) {
    body.supplier_id = toId(v.supplier_id);
    body.supplier_code = v.supplier_code;
  }
  return body;
}

export const variantFormSchema = z.object({
  colour_id: requiredId("Renk seçin."),
  size: z.string().trim().min(1, "Beden seçin."),
  sku: z.string().trim(),
  barcode: z.string().trim(),
  price_override: optionalMoney,
  stock: z.string().regex(/^\d+$/, "Sıfır veya pozitif tam sayı girin."),
});
export type VariantFormValues = z.infer<typeof variantFormSchema>;

export function toVariantBody(v: VariantFormValues) {
  return {
    colour_id: Number(v.colour_id),
    size: v.size,
    sku: nullIfEmpty(v.sku),
    barcode: nullIfEmpty(v.barcode),
    price_override: nullIfEmpty(v.price_override),
    stock: Number(v.stock),
  };
}

export const variantEditSchema = z.object({
  sku: z.string().trim().min(1, "SKU girin."),
  barcode: z.string().trim(),
  price_override: optionalMoney,
});

// Limits mirror the API (StockAdjustmentIn).
export const stockAdjustmentSchema = z.object({
  delta: z
    .string()
    .regex(/^-?\d+$/, "Tam sayı girin.")
    .transform(Number)
    .refine((n) => n !== 0, "Sıfırdan farklı olmalı.")
    .refine((n) => Math.abs(n) <= 100_000, "En fazla 100000 olabilir."),
  reason: z.string().trim().min(1, "Gerekçe gerekli.").max(200, "En fazla 200 karakter."),
});
