import { describe, expect, it } from "vitest";
import {
  receiveBody,
  refundDefaults,
  refundDueText,
  returnReasonLabel,
  returnStatusLabel,
  returnSteps,
} from "./rules";

describe("returnSteps", () => {
  it("offers the next step for each status", () => {
    expect(returnSteps("requested")).toEqual(["approve", "reject"]);
    expect(returnSteps("approved")).toEqual(["receive"]);
    expect(returnSteps("received")).toEqual(["refund"]);
  });
  it("offers nothing once a request is closed", () => {
    expect(returnSteps("rejected")).toEqual([]);
    expect(returnSteps("refunded")).toEqual([]);
  });
});

describe("labels", () => {
  it("shows unknown values rather than hiding them", () => {
    expect(returnStatusLabel("approved")).toBe("Onaylandı");
    expect(returnStatusLabel("weird")).toBe("weird");
    expect(returnReasonLabel("defective")).toBe("Ürün kusurlu");
    expect(returnReasonLabel("weird")).toBe("weird");
  });
});

describe("receiveBody", () => {
  it("turns the per-line answers into restock choices", () => {
    expect(receiveBody({ line_4: "yes", line_9: "no" })).toEqual({
      lines: [
        { line_id: 4, restock: true },
        { line_id: 9, restock: false },
      ],
    });
  });
});

describe("refundDefaults", () => {
  it("starts the refund at what the Shopper paid for the returned units", () => {
    // 100.00 on the shelf, 10% off with a Voucher: 90.00 was paid.
    expect(refundDefaults({ refund_due: "90.00" })).toEqual({
      amount: "90.00",
      method: "bank_transfer",
      iban: "",
    });
  });

  it("leaves the amount empty when nothing is due, instead of offering 0.00", () => {
    expect(refundDefaults({ refund_due: "0.00" }).amount).toBe("");
  });
});

describe("refundDueText", () => {
  it("says what the customer paid for the items while the request is open", () => {
    for (const status of ["requested", "approved", "received"]) {
      expect(refundDueText({ status, refund_due: "90.00" })).toBe(
        "Müşterinin bu ürünler için ödediği tutar: ₺90,00",
      );
    }
  });

  it("says nothing once the request is closed or when nothing is due", () => {
    expect(refundDueText({ status: "rejected", refund_due: "0.00" })).toBeNull();
    // A refunded request already shows "Ödenen iade".
    expect(refundDueText({ status: "refunded", refund_due: "90.00" })).toBeNull();
    expect(refundDueText({ status: "received", refund_due: "0.00" })).toBeNull();
  });
});
