import { describe, expect, it } from "vitest";
import { receiveBody, returnReasonLabel, returnStatusLabel, returnSteps } from "./rules";

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
