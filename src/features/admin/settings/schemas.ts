import { z } from "zod";
import { moneySchema } from "../catalog/schemas";

const optionalMoney = z.union([z.literal(""), moneySchema]);
const email = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir e-posta girin.");

export const settingsFormSchema = z.object({
  shipping_fee: moneySchema,
  free_shipping_threshold: optionalMoney,
  cod_fee: moneySchema,
  fee_kdv_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir oran girin (örn. 20)."),
  low_stock_default: z.string().regex(/^\d+$/, "Tam sayı girin."),
  bank_name: z.string().trim(),
  bank_account_holder: z.string().trim(),
  bank_iban: z.string().trim(),
  notification_emails: z
    .string()
    .refine((v) => splitEmails(v).every((e) => email.safeParse(e).success), {
      message: "Her satırda geçerli bir e-posta olmalı.",
    }),
  banner_image_url: z.string().trim(),
  banner_link: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
      "Bağlantı / veya http(s):// ile başlamalı.",
    ),
  banner_alt: z.string().trim(),
  seller_name: z.string().trim(),
  seller_tax_number: z.string().trim(),
  seller_address: z.string().trim(),
  seller_email: z.union([z.literal(""), email]),
  seller_phone: z.string().trim(),
  return_carrier: z.string().trim(),
  complaint_contact: z.string().trim(),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

/** Recipients are typed one per line or comma-separated. */
export function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

/** The PATCH body. A blank threshold clears free shipping (null); every other field is sent as typed. */
export function toSettingsPatch(v: SettingsFormValues) {
  const { notification_emails, free_shipping_threshold, low_stock_default, ...rest } = v;
  return {
    ...rest,
    free_shipping_threshold: free_shipping_threshold === "" ? null : free_shipping_threshold,
    low_stock_default: Number(low_stock_default),
    notification_emails: splitEmails(notification_emails),
  };
}
