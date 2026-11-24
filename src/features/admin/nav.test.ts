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

it("shows the Menus entry only with the manage_menus permission (Owner, not Staff)", () => {
  const staff = visibleNav(me(["view_products", "manage_products"])).map((i) => i.to);
  expect(staff).not.toContain("/admin/menus");
  const owner = visibleNav(me(["manage_menus"])).map((i) => i.to);
  expect(owner).toContain("/admin/menus");
});

it("shows the Vitrin entry only with the manage_homepage permission (Owner, not Staff)", () => {
  const staff = visibleNav(me(["view_products", "manage_products"])).map((i) => i.to);
  expect(staff).not.toContain("/admin/homepage");
  const owner = visibleNav(me(["manage_homepage"])).map((i) => i.to);
  expect(owner).toContain("/admin/homepage");
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

it("shows Vouchers in Satış, after Customers, only with the voucher permission", () => {
  const owner = visibleGroups(me(["view_orders", "view_customers", "manage_vouchers"]));
  expect(owner[0]?.items.map((i) => i.label)).toEqual([
    "Ana sayfa",
    "Siparişler",
    "İadeler",
    "Müşteriler",
    "Kuponlar",
  ]);
  const staff = visibleNav(me(["view_orders", "view_customers", "view_products"]));
  expect(staff.map((i) => i.label)).not.toContain("Kuponlar");
});

it("gives Vouchers its own route and an icon", () => {
  const item = visibleNav(me(["manage_vouchers"])).find((i) => i.label === "Kuponlar");
  expect(item?.to).toBe("/admin/vouchers");
  expect(item?.icon).toBeTruthy();
});

it("builds breadcrumbs for the vouchers area", () => {
  expect(breadcrumbs("/admin/vouchers")).toEqual([{ label: "Satış" }, { label: "Kuponlar" }]);
});

it("puts the pending-Collection badge on the Koleksiyonlar item, which Staff also see", () => {
  const item = (permissions: string[]) =>
    visibleNav(me(permissions)).find((i) => i.to === "/admin/collections");
  expect(item(["edit_collections"])?.badge).toBe("pendingCollections");
  expect(item(["edit_collections", "manage_collections"])?.badge).toBe("pendingCollections");
  expect(
    visibleNav(me(["edit_collections", "manage_collections"])).map((i) => i.label),
  ).not.toContain("Onay bekleyenler");
});

it("shows one Kampanyalar entry to anyone who may manage Campaigns or edit Campaign pages", () => {
  const entries = (permissions: string[]) =>
    visibleNav(me(permissions)).filter((i) => i.to === "/admin/campaigns");
  expect(entries(["edit_campaign_pages"])).toHaveLength(1); // Staff: pages only
  expect(entries(["manage_campaigns"])).toHaveLength(1); // the Owner
  expect(entries(["manage_campaigns", "edit_campaign_pages"])).toHaveLength(1);
  expect(entries(["view_products", "manage_vouchers"])).toHaveLength(0);
  expect(entries(["manage_campaigns"])[0]?.label).toBe("Kampanyalar");
  // The old second entry is gone.
  expect(
    visibleNav(me(["edit_campaign_pages", "manage_campaigns"])).map((i) => i.to),
  ).not.toContain("/admin/campaign-pages");
});

it("keeps breadcrumbs for the Campaign page editor under Kampanyalar", () => {
  expect(breadcrumbs("/admin/campaign-pages/7", { "7": "Yaz" }).map((c) => c.label)).toEqual([
    "Satış",
    "Kampanyalar",
    "Yaz",
  ]);
});

const owner = (over: Partial<Me> = {}): Me => ({
  ...me(["manage_settings", "view_orders"]),
  role: "owner",
  mfa_required: true,
  mfa_enrolled: true,
  ...over,
});

it("shows Raporlar to the Owner only, as it is not a grantable permission", () => {
  const entry = (m: Me | null) => visibleNav(m).find((i) => i.to === "/admin/reports");
  expect(entry(owner())?.label).toBe("Raporlar");
  // Staff get no entry, whatever permissions they hold.
  expect(entry(me(["view_orders", "manage_settings", "export_accountant_csv"]))).toBeUndefined();
  expect(entry(null)).toBeUndefined();
});

it("hides Raporlar from an Owner who has not enrolled 2FA yet (the API refuses them)", () => {
  const blocked = owner({ mfa_enrolled: false, permissions: [] });
  expect(visibleNav(blocked).map((i) => i.label)).toEqual(["Ana sayfa", "Güvenlik"]);
});

it("labels the Raporlar breadcrumb", () => {
  expect(breadcrumbs("/admin/reports")).toEqual([{ label: "Satış" }, { label: "Raporlar" }]);
});

it("shows Onay bekleyenler, with the approvals badge, to the Owner only", () => {
  const owner: Me = { ...me(["edit_collections", "manage_collections"]), role: "owner" };
  const item = visibleNav(owner).find((i) => i.to === "/admin/approvals");
  expect(item?.label).toBe("Onay bekleyenler");
  expect(item?.badge).toBe("approvals");
  const staff = visibleNav(me(["edit_collections"])).map((i) => i.to);
  expect(staff).not.toContain("/admin/approvals");
});

it("hides Onay bekleyenler from an Owner who has not enrolled two-factor yet", () => {
  const unenrolled: Me = { ...me([]), role: "owner", mfa_required: true, mfa_enrolled: false };
  expect(visibleNav(unenrolled).map((i) => i.to)).not.toContain("/admin/approvals");
});
