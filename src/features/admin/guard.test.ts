import { isRedirect } from "@tanstack/react-router";
import { expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { requirePermission } from "./guard";

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
