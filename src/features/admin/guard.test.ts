import { isRedirect } from "@tanstack/react-router";
import { expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { requireOwner, requirePermission } from "./guard";

const me = (permissions: string[]): Me => ({
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions,
  mfa_required: false,
  mfa_enrolled: false,
});

it("sends a user without manage_menus (Staff) away from the Menu screen, and lets the Owner in", () => {
  let thrown: unknown;
  try {
    requirePermission(me(["view_products", "manage_products"]), "manage_menus");
  } catch (e) {
    thrown = e;
  }
  expect(isRedirect(thrown)).toBe(true);
  expect(() => requirePermission(me(["manage_menus"]), "manage_menus")).not.toThrow();
});

const owner = (over: Partial<Me> = {}): Me => ({
  ...me(["manage_settings"]),
  role: "owner",
  mfa_required: true,
  mfa_enrolled: true,
  ...over,
});

function redirected(run: () => void): boolean {
  try {
    run();
  } catch (e) {
    return isRedirect(e);
  }
  return false;
}

it("lets only an enrolled Owner into an Owner-only screen such as Raporlar", () => {
  expect(redirected(() => requireOwner(owner()))).toBe(false);
  // Staff are sent away even with every permission an Owner has.
  expect(redirected(() => requireOwner(me(["manage_settings", "view_orders"])))).toBe(true);
  expect(redirected(() => requireOwner(null))).toBe(true);
  // An Owner who has not enrolled 2FA is refused by the API, so the screen sends them away.
  expect(redirected(() => requireOwner(owner({ mfa_enrolled: false, permissions: [] })))).toBe(
    true,
  );
});
