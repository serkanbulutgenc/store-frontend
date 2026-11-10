import { describe, expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import { allowedActions, canBulkMarkPaid, canBulkShip, canDo } from "./rules";

const me = (permissions: string[]): Me => ({
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions,
  mfa_required: false,
  mfa_enrolled: true,
});
const staff = me(["view_orders", "manage_orders", "mark_paid"]);
const owner = me([...staff.permissions, "record_refunds", "cancel_paid_orders"]);

describe("canDo", () => {
  it("lets Staff cancel an unpaid order but not a paid one", () => {
    expect(canDo(staff, "cancel", { payment_status: "unpaid" })).toBe(true);
    expect(canDo(staff, "cancel", { payment_status: "paid" })).toBe(false);
    expect(canDo(owner, "cancel", { payment_status: "paid" })).toBe(true);
  });
  it("keeps refunds Owner-only", () => {
    expect(canDo(staff, "refund", { payment_status: "paid" })).toBe(false);
    expect(canDo(owner, "refund", { payment_status: "paid" })).toBe(true);
  });
  it("denies everything when signed out", () => {
    expect(canDo(null, "ship", { payment_status: "paid" })).toBe(false);
  });
});

describe("allowedActions", () => {
  it("hides Owner-only actions from Staff", () => {
    const order = {
      actions: ["mark_paid", "cancel", "edit_shipping", "refund"],
      payment_status: "paid" as const,
    };
    expect(allowedActions(staff, order)).toEqual(["mark_paid", "edit_shipping"]);
    expect(allowedActions(owner, order)).toEqual([
      "mark_paid",
      "cancel",
      "edit_shipping",
      "refund",
    ]);
  });
  it("ignores actions this screen does not know", () => {
    expect(allowedActions(owner, { actions: ["mystery"], payment_status: "paid" })).toEqual([]);
  });
});

describe("bulk validity", () => {
  it("marks paid only unpaid, payable orders", () => {
    expect(canBulkMarkPaid({ status: "new", payment_status: "unpaid" })).toBe(true);
    expect(canBulkMarkPaid({ status: "cancelled", payment_status: "unpaid" })).toBe(false);
    expect(canBulkMarkPaid({ status: "new", payment_status: "paid" })).toBe(false);
  });
  it("ships only preparing orders", () => {
    expect(canBulkShip({ status: "preparing", payment_status: "paid" })).toBe(true);
    expect(canBulkShip({ status: "new", payment_status: "paid" })).toBe(false);
  });
});
