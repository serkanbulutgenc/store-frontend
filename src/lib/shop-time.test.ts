import { describe, expect, it } from "vitest";
import { isoToShopTime, shopTimeToIso } from "./shop-time";

describe("shopTimeToIso", () => {
  it("adds the shop's +03:00 offset (and seconds) to a datetime-local value", () => {
    expect(shopTimeToIso("2026-07-01T00:30")).toBe("2026-07-01T00:30:00+03:00");
    expect(shopTimeToIso("2026-07-01T00:30:15")).toBe("2026-07-01T00:30:15+03:00");
  });

  it("is null for an empty value", () => {
    expect(shopTimeToIso("")).toBeNull();
    expect(shopTimeToIso("  ")).toBeNull();
  });
});

describe("isoToShopTime", () => {
  it("shows an instant as the shop's wall clock, across a day boundary too", () => {
    expect(isoToShopTime("2026-07-01T09:00:00Z")).toBe("2026-07-01T12:00");
    expect(isoToShopTime("2026-06-30T22:30:00Z")).toBe("2026-07-01T01:30");
  });

  it("round-trips with shopTimeToIso", () => {
    expect(isoToShopTime(shopTimeToIso("2026-11-20T10:00") as string)).toBe("2026-11-20T10:00");
  });
});
