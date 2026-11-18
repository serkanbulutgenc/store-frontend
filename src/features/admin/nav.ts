import {
  Boxes,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  GalleryVerticalEnd,
  History,
  Home,
  Layers,
  type LucideIcon,
  Menu,
  MessageSquareText,
  Package,
  Palette,
  Plus,
  Scale,
  Settings,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  TicketPercent,
  Trash2,
  Truck,
  Undo2,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import { can, type Me } from "@/lib/api/me";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  /** A count shown beside the label; the sidebar looks the number up by this key. */
  badge?: "pendingCollections";
  /** Sub-items, shown under the item and folded away with it. The item itself still links to `to`. */
  children?: NavItem[];
};
export type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };

/** Dashboard areas, grouped as in the approved shell (phase 2, section 3). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Satış",
    icon: Store,
    items: [
      { label: "Ana sayfa", to: "/admin", icon: Home },
      { label: "Siparişler", to: "/admin/orders", icon: ShoppingCart, permission: "view_orders" },
      { label: "İadeler", to: "/admin/returns", icon: Undo2, permission: "view_orders" },
      { label: "Müşteriler", to: "/admin/customers", icon: Users, permission: "view_customers" },
      {
        label: "Kuponlar",
        to: "/admin/vouchers",
        icon: TicketPercent,
        permission: "manage_vouchers",
      },
    ],
  },
  {
    label: "Katalog",
    icon: Package,
    items: [
      { label: "Ürünler", to: "/admin/products", icon: Package, permission: "view_products" },
      { label: "Stok", to: "/admin/stock", icon: Boxes, permission: "view_products" },
      {
        label: "Kategoriler",
        to: "/admin/categories",
        icon: Layers,
        permission: "manage_categories",
      },
      {
        label: "Ürün sınıfları",
        to: "/admin/product-classes",
        icon: Shapes,
        permission: "manage_product_classes",
      },
      {
        label: "Yorumlar",
        to: "/admin/reviews",
        icon: MessageSquareText,
        permission: "manage_products",
      },
      {
        label: "Koleksiyonlar",
        to: "/admin/collections",
        icon: GalleryVerticalEnd,
        permission: "edit_collections",
        children: [
          {
            label: "Yeni koleksiyon",
            to: "/admin/collections/new",
            icon: Plus,
            permission: "edit_collections",
          },
          {
            label: "Onay bekleyenler",
            to: "/admin/collections/pending",
            icon: ClipboardCheck,
            permission: "manage_collections",
            badge: "pendingCollections",
          },
        ],
      },
      { label: "Markalar", to: "/admin/brands", icon: Tag, permission: "manage_brands" },
      {
        label: "Tedarikçiler",
        to: "/admin/suppliers",
        icon: Building2,
        permission: "manage_suppliers",
      },
      { label: "Renkler", to: "/admin/colours", icon: Palette, permission: "manage_colours" },
      { label: "İçe aktar", to: "/admin/import", icon: Upload, permission: "import_catalogue" },
    ],
  },
  {
    label: "Yönetim",
    icon: Settings,
    items: [
      { label: "Ayarlar", to: "/admin/settings", icon: Settings, permission: "manage_settings" },
      {
        label: "Kargo fiyatları",
        to: "/admin/shipping",
        icon: Truck,
        permission: "manage_settings",
      },
      {
        label: "Yasal sayfalar",
        to: "/admin/legal-pages",
        icon: Scale,
        permission: "manage_legal_pages",
      },
      { label: "Menüler", to: "/admin/menus", icon: Menu, permission: "manage_menus" },
      { label: "Personel", to: "/admin/staff", icon: UserCog, permission: "manage_staff_users" },
      {
        label: "Muhasebe dışa aktarımı",
        to: "/admin/export",
        icon: FileSpreadsheet,
        permission: "export_accountant_csv",
      },
      {
        label: "Denetim günlüğü",
        to: "/admin/audit-log",
        icon: History,
        permission: "view_audit_log",
      },
      {
        label: "Hesap silme talepleri",
        to: "/admin/account-deletions",
        icon: Trash2,
        permission: "manage_account_deletions",
      },
      // No permission on purpose: an Owner who has not enrolled 2FA has none, and this is the
      // only screen that lets them enrol. Do not guard this item or its route.
      { label: "Güvenlik", to: "/admin/security", icon: ShieldCheck },
    ],
  },
];

/** Hide what the user cannot use, and groups left empty. UX only: the API enforces every permission. */
export function visibleGroups(me: Me | null): NavGroup[] {
  const allowed = (item: NavItem) => !item.permission || can(me, item.permission);
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items
      .filter(allowed)
      .map((item) => (item.children ? { ...item, children: item.children.filter(allowed) } : item)),
  })).filter((g) => g.items.length > 0);
}

/** Flat view of `visibleGroups`: each item, then its sub-items. */
export function visibleNav(me: Me | null): NavItem[] {
  return visibleGroups(me).flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
}

export type Crumb = { label: string; to?: string };

/** Fixed words for sub-paths below a nav area. Anything else is an entity id/number. */
const SEGMENT_LABELS: Record<string, string> = { new: "Yeni", pending: "Onay bekleyenler" };

/**
 * Breadcrumbs for an /admin path: group, area, then one crumb per deeper segment.
 * `entityLabels` maps a raw segment (an id or order number) to a display name.
 * Home shows its own group and name. Unknown areas get no crumbs.
 */
export function breadcrumbs(pathname: string, entityLabels: Record<string, string> = {}): Crumb[] {
  const segments = pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);
  const [area, ...rest] = segments;
  if (!area) return [{ label: "Satış" }, { label: "Ana sayfa" }];
  const base = `/admin/${area}`;
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.to === base);
    if (!item) continue;
    const crumbs: Crumb[] = [{ label: group.label }];
    let path = base;
    crumbs.push({ label: item.label, to: rest.length ? path : undefined });
    rest.forEach((seg, i) => {
      path += `/${seg}`;
      const label = SEGMENT_LABELS[seg] ?? entityLabels[seg] ?? seg;
      crumbs.push({ label, to: i < rest.length - 1 ? path : undefined });
    });
    return crumbs;
  }
  return [];
}
