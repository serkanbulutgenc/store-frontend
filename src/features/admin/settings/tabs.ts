import { Banknote, Bell, BellRing, FileText, type LucideIcon, Store, Truck } from "lucide-react";
import type { SettingsFormValues } from "./schemas";

export type FieldName = keyof SettingsFormValues;
export type FieldSpec = {
  name: FieldName;
  label: string;
  hint?: string;
  area?: boolean;
  kind?: "switch" | "accounts";
};
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
      {
        name: "shipping_fee",
        label: "Yedek kargo ücreti (₺)",
        hint: "Taşıyıcı tarifesi bulunamadığında (il veya ürün boyutu belli değilse) uygulanır. Normalde kargo ücreti Kargo fiyatları sayfasındaki tarifeden hesaplanır.",
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
    fields: [{ name: "bank_accounts", label: "Banka hesapları", kind: "accounts" }],
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
  {
    id: "stock_alerts",
    label: "Stok bildirimi",
    icon: BellRing,
    fields: [
      {
        name: "stock_alerts_enabled",
        label: "Stok bildirimini aç (Haber ver)",
        kind: "switch",
        hint: "Açmadan önce İYS kaydı tamamlanmış olmalıdır. Bildirim e-postaları ticari elektronik iletidir; İYS girişlerini siz elle yaparsınız.",
      },
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
