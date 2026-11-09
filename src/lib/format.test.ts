import { describe, expect, it } from "vitest";
import { formatDate, formatTry } from "./format";

describe("formatTry", () => {
  it("formats a decimal string in tr-TR without float arithmetic", () => {
    expect(formatTry("1299.90")).toBe("₺1.299,90");
    expect(formatTry("0.10")).toBe("₺0,10");
  });
  it("keeps precision beyond a double", () => {
    expect(formatTry("9007199254740993.01")).toContain("9.007.199.254.740.993,01");
  });
  it("shows a dash for null or empty", () => {
    expect(formatTry(null)).toBe("—");
    expect(formatTry("")).toBe("—");
  });
});

describe("formatDate", () => {
  it("uses Europe/Istanbul", () => {
    expect(formatDate("2026-11-09T22:30:00Z")).toBe("10.11.2026 01:30");
  });
});
