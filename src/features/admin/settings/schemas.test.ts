import { expect, it } from "vitest";
import { settingsFormSchema, splitEmails, toSettingsPatch } from "./schemas";

const valid = {
  shipping_fee: "49.90",
  free_shipping_threshold: "",
  cod_fee: "15.00",
  fee_kdv_rate: "20",
  low_stock_default: "3",
  notification_emails: "a@b.com\nc@d.com, e@f.com",
  bank_name: "",
  bank_account_holder: "",
  bank_iban: "",
  banner_image_url: "",
  banner_link: "",
  banner_alt: "",
  seller_name: "",
  seller_tax_number: "",
  seller_address: "",
  seller_email: "",
  seller_phone: "",
  return_carrier: "",
  complaint_contact: "",
};

it("splits recipients on lines and commas", () => {
  expect(splitEmails("a@b.com\nc@d.com, e@f.com")).toEqual(["a@b.com", "c@d.com", "e@f.com"]);
});

it("clears the free-shipping threshold when blank and converts numbers", () => {
  const patch = toSettingsPatch(settingsFormSchema.parse(valid));
  expect(patch.free_shipping_threshold).toBeNull();
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
