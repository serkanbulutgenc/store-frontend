import { expect, it } from "vitest";
import { can, type Me } from "./me";

const me: Me = {
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions: ["catalog.view"],
  mfa_required: false,
  mfa_enrolled: false,
};

it("checks the permission list", () => {
  expect(can(me, "catalog.view")).toBe(true);
  expect(can(me, "orders.view")).toBe(false);
  expect(can(null, "catalog.view")).toBe(false);
});
