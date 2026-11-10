import { z } from "zod";
import { moneySchema } from "../catalog/schemas";

export const payFormSchema = z.object({ amount: moneySchema });
export const cancelFormSchema = z.object({
  reason: z.string().trim().min(1, "Gerekçe gerekli.").max(500, "En fazla 500 karakter."),
});
export const shipFormSchema = z.object({
  carrier: z.string().trim().min(1, "Kargo firması gerekli.").max(100),
  tracking_number: z.string().trim().min(1, "Takip numarası gerekli.").max(100),
});
export const refundFormSchema = z
  .object({
    amount: moneySchema,
    method: z.enum(["bank_transfer", "cash"]),
    iban: z.string().trim().max(50),
  })
  .refine((v) => v.method !== "bank_transfer" || v.iban !== "", {
    path: ["iban"],
    message: "Havale için IBAN gerekli.",
  });
export const emailFormSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir e-posta girin."),
});
export const invoiceFormSchema = z.object({
  buyer_tax_number: z.string().trim().max(50),
  company_title: z.string().trim().max(200),
});
export const shippingFormSchema = z.object({
  phone: z.string().trim().min(1, "Telefon gerekli.").max(30),
  il: z.string().trim().min(1, "İl gerekli.").max(100),
  ilce: z.string().trim().min(1, "İlçe gerekli.").max(100),
  mahalle: z.string().trim().min(1, "Mahalle gerekli.").max(150),
  street: z.string().trim().min(1, "Adres gerekli.").max(200),
  postal_code: z.string().trim().max(10),
});
