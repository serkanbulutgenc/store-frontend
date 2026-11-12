import { Banknote, Bell, FileText, Image, type LucideIcon, Store, Truck } from "lucide-react";
import type { SettingsFormValues } from "./schemas";

export type FieldName = keyof SettingsFormValues;
export type FieldSpec = { name: FieldName; label: string; hint?: string; area?: boolean };
export type SettingsTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  fields: FieldSpec[];
};

/** Tabs of the Settings form. `legal` has no fields: it only shows the read-only versions. */
export const SETTINGS_TABS: SettingsTab[] = [
  {
    id: "shipping",
    label: "Kargo ve ücretler",
    icon: Truck,
    fields: [
      { name: "shipping_fee", label: "Kargo ücreti (₺)" },
      {
        name: "free_shipping_threshold",
        label: "Ücretsiz kargo eşiği (₺)",
        hint: "Boş bırakırsanız ücretsiz kargo kapalıdır.",
      },
      { name: "cod_fee", label: "Kapıda ödeme ücreti (₺)" },
      { name: "fee_kdv_rate", label: "Kargo ve kapıda ödeme KDV oranı (%)" },
      { name: "low_stock_default", label: "Varsayılan düşük stok eşiği" },
    ],
  },
  {
    id: "bank",
    label: "Banka bilgileri",
    icon: Banknote,
    fields: [
      { name: "bank_name", label: "Banka" },
      { name: "bank_account_holder", label: "Hesap sahibi" },
      { name: "bank_iban", label: "IBAN" },
    ],
  },
  {
    id: "notifications",
    label: "Bildirimler",
    icon: Bell,
    fields: [
      {
        name: "notification_emails",
        label: "Bildirim alıcıları",
        hint: "Her satıra bir e-posta.",
        area: true,
      },
    ],
  },
  {
    id: "banner",
    label: "Ana sayfa afişi",
    icon: Image,
    fields: [
      { name: "banner_image_url", label: "Görsel adresi" },
      { name: "banner_link", label: "Bağlantı" },
      { name: "banner_alt", label: "Alternatif metin" },
    ],
  },
  {
    id: "seller",
    label: "Satıcı bilgileri",
    icon: Store,
    fields: [
      { name: "seller_name", label: "Unvan" },
      { name: "seller_tax_number", label: "Vergi no" },
      { name: "seller_address", label: "Adres", area: true },
      { name: "seller_email", label: "E-posta" },
      { name: "seller_phone", label: "Telefon" },
      { name: "return_carrier", label: "İade kargo firması" },
      { name: "complaint_contact", label: "Şikayet iletişimi" },
    ],
  },
  { id: "legal", label: "Yasal metin sürümleri", icon: FileText, fields: [] },
];

/** Ids of the tabs that hold at least one field with an error. */
export function tabsWithErrors(
  tabs: SettingsTab[],
  hasError: (field: FieldName) => boolean,
): Set<string> {
  return new Set(tabs.filter((t) => t.fields.some((f) => hasError(f.name))).map((t) => t.id));
}
