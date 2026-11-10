import { expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { visibleNav } from "./nav";

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
  expect(labels).toEqual(["Ana sayfa", "Ürünler", "Stok", "Siparişler", "Güvenlik"]);
});

it("shows Owner areas only with their permission", () => {
  const labels = visibleNav(me(["manage_settings", "view_audit_log", "manage_staff_users"])).map(
    (i) => i.label,
  );
  expect(labels).toEqual(["Ana sayfa", "Personel", "Ayarlar", "Denetim günlüğü", "Güvenlik"]);
});

it("shows only Home and Security to an Owner who has not finished 2FA (empty permission list)", () => {
  expect(visibleNav(me([])).map((i) => i.label)).toEqual(["Ana sayfa", "Güvenlik"]);
});
