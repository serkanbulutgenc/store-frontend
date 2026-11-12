import { can, type Me } from "@/lib/api/me";

export type NavItem = { label: string; to: string; permission?: string };

/** Dashboard areas. Paths for later tickets resolve to the not-found page until built. */
export const NAV: NavItem[] = [
  { label: "Ana sayfa", to: "/admin" },
  { label: "Ürünler", to: "/admin/products", permission: "view_products" },
  { label: "Stok", to: "/admin/stock", permission: "view_products" },
  { label: "İçe aktar", to: "/admin/import", permission: "import_catalogue" },
  { label: "Siparişler", to: "/admin/orders", permission: "view_orders" },
  { label: "Kategoriler", to: "/admin/categories", permission: "manage_categories" },
  { label: "Markalar", to: "/admin/brands", permission: "manage_brands" },
  { label: "Tedarikçiler", to: "/admin/suppliers", permission: "manage_suppliers" },
  { label: "Renkler", to: "/admin/colours", permission: "manage_colours" },
  { label: "Müşteriler", to: "/admin/customers", permission: "view_customers" },
  { label: "Personel", to: "/admin/staff", permission: "manage_staff_users" },
  { label: "Ayarlar", to: "/admin/settings", permission: "manage_settings" },
  {
    label: "Hesap silme talepleri",
    to: "/admin/account-deletions",
    permission: "manage_account_deletions",
  },
  { label: "Muhasebe dışa aktarımı", to: "/admin/export", permission: "export_accountant_csv" },
  { label: "Denetim günlüğü", to: "/admin/audit-log", permission: "view_audit_log" },
  // No permission on purpose: an Owner who has not enrolled 2FA has none, and this is the
  // only screen that lets them enrol. Do not guard this item or its route.
  { label: "Güvenlik", to: "/admin/security" },
];

/** Hide what the user cannot use. UX only: the API enforces every permission. */
export function visibleNav(me: Me | null): NavItem[] {
  return NAV.filter((item) => !item.permission || can(me, item.permission));
}
