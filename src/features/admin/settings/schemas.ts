import { z } from "zod";
import { moneySchema } from "../catalog/schemas";

const email = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir e-posta girin.");

/** One bank account as typed. IBANs are checked on the server too, which also drops spaces. */
export type BankAccountValue = { name: string; account_holder: string; iban: string };

export const MAX_BANK_ACCOUNTS = 10;
const IBAN = /^TR\d{24}$/;

/** An IBAN as the API stores it: no spaces, upper case. */
export const normaliseIban = (iban: string): string => iban.replace(/\s+/g, "").toUpperCase();

/** The first thing wrong with a list of accounts, named by its row, or null. */
export function bankAccountsError(accounts: BankAccountValue[]): string | null {
  if (accounts.length > MAX_BANK_ACCOUNTS)
    return `En fazla ${MAX_BANK_ACCOUNTS} hesap girilebilir.`;
  for (const [i, a] of accounts.entries()) {
    const row = `${i + 1}. hesap: `;
    if (!a.name.trim()) return `${row}Banka adı gerekli.`;
    if (!a.account_holder.trim()) return `${row}Hesap sahibi gerekli.`;
    if (!IBAN.test(normaliseIban(a.iban)))
      return `${row}Geçerli bir IBAN girin (TR ile başlayan 26 karakter).`;
  }
  const ibans = accounts.map((a) => normaliseIban(a.iban));
  return new Set(ibans).size === ibans.length ? null : "Aynı IBAN birden fazla kez girilemez.";
}

const bankAccounts = z
  .array(z.object({ name: z.string(), account_holder: z.string(), iban: z.string() }))
  .superRefine((accounts, ctx) => {
    const message = bankAccountsError(accounts);
    if (message) ctx.addIssue({ code: "custom", message });
  });

export const settingsFormSchema = z.object({
  shipping_fee: moneySchema,
  cod_fee: moneySchema,
  fee_kdv_rate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir oran girin (örn. 20)."),
  low_stock_default: z.string().regex(/^\d+$/, "Tam sayı girin."),
  bank_accounts: bankAccounts,
  notification_emails: z
    .string()
    .refine((v) => splitEmails(v).every((e) => email.safeParse(e).success), {
      message: "Her satırda geçerli bir e-posta olmalı.",
    }),
  seller_name: z.string().trim(),
  seller_tax_number: z.string().trim(),
  seller_address: z.string().trim(),
  seller_email: z.union([z.literal(""), email]),
  seller_phone: z.string().trim(),
  return_carrier: z.string().trim(),
  complaint_contact: z.string().trim(),
  stock_alerts_enabled: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

/** Recipients are typed one per line or comma-separated. */
export function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

/** The PATCH body: every field is sent as typed, with the numbers converted. */
export function toSettingsPatch(v: SettingsFormValues) {
  const { notification_emails, low_stock_default, bank_accounts, ...rest } = v;
  return {
    ...rest,
    bank_accounts: bank_accounts.map((a) => ({
      name: a.name.trim(),
      account_holder: a.account_holder.trim(),
      iban: normaliseIban(a.iban),
    })),
    low_stock_default: Number(low_stock_default),
    notification_emails: splitEmails(notification_emails),
  };
}
