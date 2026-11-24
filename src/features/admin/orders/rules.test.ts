import { describe, expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import {
  allowedActions,
  canBulkMarkPaid,
  canBulkShip,
  canDo,
  orderBasketCampaignRows,
  orderLineCampaign,
  orderVoucherRow,
} from "./rules";

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

describe("orderVoucherRow", () => {
  it("shows what the voucher took off, with a note that the lines are as charged", () => {
    expect(orderVoucherRow({ code: "YAZ10", discount: "20.00" })).toEqual({
      label: "Kupon (YAZ10)",
      amount: "−₺20,00",
      note: "Satır tutarları kupon düşüldükten sonraki, ödenen tutarlardır.",
    });
    expect(orderVoucherRow({ code: "KIS-50", discount: "1234.50" })?.amount).toBe("−₺1.234,50");
  });

  it("shows nothing for an order that used no voucher", () => {
    expect(orderVoucherRow(null)).toBeNull();
    expect(orderVoucherRow(undefined)).toBeNull();
  });
});

describe("orderLineCampaign", () => {
  const campaign = { id: 7, name: "Kara Cuma", percentage: "20.00", shelf_unit_price: "500.00" };
  const line = { unit_price: "400.00", campaign };
  const campaignOwner = me([...owner.permissions, "manage_campaigns"]);

  it("gives the Owner the Campaign's name, the frozen price and which Campaign to open", () => {
    expect(orderLineCampaign(campaignOwner, line)).toEqual({
      name: "Kara Cuma",
      price: "₺400,00",
      openId: 7,
    });
  });

  it("shows Staff the same Campaign but no way to the Campaign screen", () => {
    expect(orderLineCampaign(staff, line)).toEqual({
      name: "Kara Cuma",
      price: "₺400,00",
      openId: null,
    });
    expect(orderLineCampaign(null, line)?.openId).toBeNull();
  });

  it("shows nothing for a line no Campaign priced", () => {
    expect(orderLineCampaign(campaignOwner, { unit_price: "500.00", campaign: null })).toBeNull();
  });
});

describe("orderBasketCampaignRows", () => {
  const off = { label: "100 ₺ üzeri 50 ₺ indirim", discount: "50.00", free_shipping: false };
  const free = { label: "100 ₺ üzeri ücretsiz kargo", discount: "0.00", free_shipping: true };

  it("shows each Basket Campaign's amount, from the Order's own records, in order", () => {
    expect(orderBasketCampaignRows([off, free])).toEqual([
      { label: "Sepet kampanyası (100 ₺ üzeri 50 ₺ indirim)", amount: "−₺50,00" },
      { label: "Sepet kampanyası (100 ₺ üzeri ücretsiz kargo)", amount: "Ücretsiz kargo" },
    ]);
  });

  it("is nothing for an Order placed under none", () => {
    expect(orderBasketCampaignRows([])).toEqual([]);
    expect(orderBasketCampaignRows(undefined)).toEqual([]);
  });
});
