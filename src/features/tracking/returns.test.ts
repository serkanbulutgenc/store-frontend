import { describe, expect, it } from "vitest";
import {
  returnAvailability,
  returnBody,
  returnShippingNote,
  returnStatusLabel,
  shopPaysReturnShipping,
} from "./returns";

const now = new Date("2026-11-12T12:00:00Z");

describe("returnAvailability", () => {
  it("says nothing before delivery", () => {
    expect(returnAvailability({ return_deadline: null, lines: [] }, now)).toEqual({ kind: "none" });
  });
  it("closes after the deadline", () => {
    const order = { return_deadline: "2026-11-11T12:00:00Z", lines: [{ returnable_quantity: 1 }] };
    expect(returnAvailability(order, now).kind).toBe("closed");
  });
  it("reports when only hygiene or already requested lines remain", () => {
    const order = { return_deadline: "2026-11-20T12:00:00Z", lines: [{ returnable_quantity: 0 }] };
    expect(returnAvailability(order, now).kind).toBe("nothing_left");
  });
  it("opens with the deadline while something is returnable", () => {
    const order = { return_deadline: "2026-11-20T12:00:00Z", lines: [{ returnable_quantity: 2 }] };
    expect(returnAvailability(order, now)).toEqual({ kind: "open", until: order.return_deadline });
  });
});

describe("return shipping payer", () => {
  it("is the shop for its own mistakes only", () => {
    expect(shopPaysReturnShipping("defective")).toBe(true);
    expect(shopPaysReturnShipping("wrong_item")).toBe(true);
    expect(shopPaysReturnShipping("wrong_size")).toBe(false);
    expect(returnShippingNote("changed_mind")).toContain("siz ödersiniz");
  });
});

describe("returnBody", () => {
  it("drops unticked lines and trims the note", () => {
    expect(returnBody({ 1: 2, 2: 0 }, "wrong_size", "  küçük ")).toEqual({
      reason: "wrong_size",
      note: "küçük",
      lines: [{ line_id: 1, quantity: 2 }],
    });
  });
});

describe("returnStatusLabel", () => {
  it("shows an unknown status rather than hiding it", () => {
    expect(returnStatusLabel("approved")).toContain("Onaylandı");
    expect(returnStatusLabel("weird")).toBe("weird");
  });
});
