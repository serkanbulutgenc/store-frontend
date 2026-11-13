import { expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { breadcrumbs, visibleGroups, visibleNav } from "./nav";

const me = (permissions: string[]): Me => ({
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions,
  mfa_required: false,
  mfa_enrolled: false,
});

it("always shows Home and hides areas the user cannot use", () => {
  const labels = visibleNav(me(["view_products", "view_orders"])).map((i) => i.label);
  expect(labels).toEqual(["Ana sayfa", "Siparişler", "İadeler", "Ürünler", "Stok", "Güvenlik"]);
});

it("shows Owner areas only with their permission", () => {
  const labels = visibleNav(me(["manage_settings", "view_audit_log", "manage_staff_users"])).map(
    (i) => i.label,
  );
  expect(labels).toEqual([
    "Ana sayfa",
    "Ayarlar",
    "Kargo fiyatları",
    "Personel",
    "Denetim günlüğü",
    "Güvenlik",
  ]);
});

it("shows only Home and Security to an Owner who has not finished 2FA (empty permission list)", () => {
  expect(visibleNav(me([])).map((i) => i.label)).toEqual(["Ana sayfa", "Güvenlik"]);
});

it("shows the import entry only with the import permission (Owner, not Staff)", () => {
  const staff = visibleNav(me(["view_products", "manage_products"])).map((i) => i.label);
  expect(staff).not.toContain("İçe aktar");
  const owner = visibleNav(me(["view_products", "import_catalogue"])).map((i) => i.label);
  expect(owner).toContain("İçe aktar");
});

it("groups the sidebar as Satış, Katalog, Yönetim and drops groups left empty", () => {
  const all = visibleGroups(me(["view_orders", "view_products", "manage_settings"]));
  expect(all.map((g) => g.label)).toEqual(["Satış", "Katalog", "Yönetim"]);
  // Home and Security never need a permission, so only Satış, Yönetim survive for a bare user.
  expect(visibleGroups(me([])).map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
    ["Satış", ["Ana sayfa"]],
    ["Yönetim", ["Güvenlik"]],
  ]);
});

it("gives every nav item an icon", () => {
  for (const item of visibleNav(
    me(["view_orders", "view_customers", "view_products", "manage_settings"]),
  )) {
    expect(item.icon).toBeTruthy();
  }
});

it("builds breadcrumbs for areas, details and sub-pages", () => {
  expect(breadcrumbs("/admin")).toEqual([{ label: "Satış" }, { label: "Ana sayfa" }]);
  expect(breadcrumbs("/admin/orders")).toEqual([{ label: "Satış" }, { label: "Siparişler" }]);
  expect(breadcrumbs("/admin/products/new")).toEqual([
    { label: "Katalog" },
    { label: "Ürünler", to: "/admin/products" },
    { label: "Yeni" },
  ]);
  expect(breadcrumbs("/admin/products/12", { "12": "Pamuklu tişört" })).toEqual([
    { label: "Katalog" },
    { label: "Ürünler", to: "/admin/products" },
    { label: "Pamuklu tişört" },
  ]);
  expect(breadcrumbs("/admin/orders/A-1001")).toEqual([
    { label: "Satış" },
    { label: "Siparişler", to: "/admin/orders" },
    { label: "A-1001" },
  ]);
  expect(breadcrumbs("/admin/nope")).toEqual([]);
});

it("shows the Legal pages entry only with its permission (Owner, not Staff)", () => {
  expect(visibleNav(me(["view_products", "manage_products"])).map((i) => i.label)).not.toContain(
    "Yasal sayfalar",
  );
  expect(visibleNav(me(["manage_legal_pages"])).map((i) => i.label)).toContain("Yasal sayfalar");
});

it("shows the Product classes entry only with its permission (Owner, not Staff)", () => {
  expect(visibleNav(me(["view_products", "manage_products"])).map((i) => i.label)).not.toContain(
    "Ürün sınıfları",
  );
  expect(visibleNav(me(["manage_product_classes"])).map((i) => i.label)).toContain(
    "Ürün sınıfları",
  );
});
