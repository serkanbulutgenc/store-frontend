import { describe, expect, it } from "vitest";
import { paymentLabel, statusLabel } from "./labels";

describe("tracking labels", () => {
  it("translates known statuses", () => {
    expect(statusLabel("shipped")).toBe("Kargoya verildi");
    expect(paymentLabel("unpaid")).toBe("Ödeme bekleniyor");
  });
  it("shows an unknown status rather than hiding it", () => {
    expect(statusLabel("weird")).toBe("weird");
    expect(paymentLabel("weird")).toBe("weird");
  });
});
