import { expect, it } from "vitest";
import {
  bankAccountsError,
  MAX_BANK_ACCOUNTS,
  normaliseIban,
  settingsFormSchema,
  splitEmails,
  toSettingsPatch,
} from "./schemas";

const valid = {
  shipping_fee: "49.90",
  cod_fee: "15.00",
  fee_kdv_rate: "20",
  low_stock_default: "3",
  notification_emails: "a@b.com\nc@d.com, e@f.com",
  bank_accounts: [],
  seller_name: "",
  seller_tax_number: "",
  seller_address: "",
  seller_email: "",
  seller_phone: "",
  return_carrier: "",
  complaint_contact: "",
  stock_alerts_enabled: false,
};

it("splits recipients on lines and commas", () => {
  expect(splitEmails("a@b.com\nc@d.com, e@f.com")).toEqual(["a@b.com", "c@d.com", "e@f.com"]);
});

it("converts the numbers and splits the recipients", () => {
  const patch = toSettingsPatch(settingsFormSchema.parse(valid));
  expect(patch.low_stock_default).toBe(3);
  expect(patch.notification_emails).toHaveLength(3);
});

it("rejects a bad recipient or fee", () => {
  expect(settingsFormSchema.safeParse({ ...valid, notification_emails: "nope" }).success).toBe(
    false,
  );
  expect(settingsFormSchema.safeParse({ ...valid, shipping_fee: "abc" }).success).toBe(false);
});

it("reports a bad seller e-mail in Turkish", () => {
  const r = settingsFormSchema.safeParse({ ...valid, seller_email: "not-an-email" });
  expect(r.success).toBe(false);
  expect(r.error?.issues[0]?.message).toBe("Geçerli bir e-posta girin.");
});

it("sends the Stock alerts switch as a boolean", () => {
  expect(toSettingsPatch(settingsFormSchema.parse(valid)).stock_alerts_enabled).toBe(false);
  expect(
    toSettingsPatch(settingsFormSchema.parse({ ...valid, stock_alerts_enabled: true }))
      .stock_alerts_enabled,
  ).toBe(true);
});

const IBAN_A = "TR330006100519786457841326";
const IBAN_B = "TR320010009999901234567890";
const account = (over: Partial<{ name: string; account_holder: string; iban: string }> = {}) => ({
  name: "Ziraat",
  account_holder: "Aura Tekstil",
  iban: IBAN_A,
  ...over,
});

it("drops spaces from an IBAN and upper-cases it", () => {
  expect(normaliseIban("tr33 0006 1005 1978 6457 8413 26")).toBe(IBAN_A);
});

it("accepts no account, one, or several with different IBANs", () => {
  expect(bankAccountsError([])).toBeNull();
  expect(bankAccountsError([account()])).toBeNull();
  expect(bankAccountsError([account(), account({ name: "İş Bankası", iban: IBAN_B })])).toBeNull();
});

it("names the row that is wrong", () => {
  expect(bankAccountsError([account(), account({ name: " " })])).toBe(
    "2. hesap: Banka adı gerekli.",
  );
  expect(bankAccountsError([account({ account_holder: "" })])).toBe(
    "1. hesap: Hesap sahibi gerekli.",
  );
  expect(bankAccountsError([account({ iban: "DE123" })])).toBe(
    "1. hesap: Geçerli bir IBAN girin (TR ile başlayan 26 karakter).",
  );
});

it("refuses the same IBAN twice, however it is typed, and too many accounts", () => {
  expect(
    bankAccountsError([account(), account({ iban: "tr33 0006 1005 1978 6457 8413 26" })]),
  ).toBe("Aynı IBAN birden fazla kez girilemez.");
  const many = Array.from({ length: MAX_BANK_ACCOUNTS + 1 }, () => account());
  expect(bankAccountsError(many)).toBe(`En fazla ${MAX_BANK_ACCOUNTS} hesap girilebilir.`);
});

it("shows the account error on the accounts field", () => {
  const r = settingsFormSchema.safeParse({ ...valid, bank_accounts: [account({ iban: "x" })] });
  expect(r.success).toBe(false);
  expect(r.error?.issues[0]?.path[0]).toBe("bank_accounts");
});

it("sends the accounts trimmed and with clean IBANs, in order", () => {
  const patch = toSettingsPatch(
    settingsFormSchema.parse({
      ...valid,
      bank_accounts: [
        account({ name: " Ziraat ", iban: "tr33 0006 1005 1978 6457 8413 26" }),
        account({ name: "İş Bankası", iban: IBAN_B }),
      ],
    }),
  );
  expect(patch.bank_accounts).toEqual([
    { name: "Ziraat", account_holder: "Aura Tekstil", iban: IBAN_A },
    { name: "İş Bankası", account_holder: "Aura Tekstil", iban: IBAN_B },
  ]);
});
