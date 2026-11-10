import { expect, it } from "vitest";
import { validateRange } from "./range";

it("accepts a valid range, inclusive of both ends", () => {
  expect(validateRange("2026-01-01", "2026-01-01")).toBeNull();
  expect(validateRange("2026-01-01", "2026-12-31")).toBeNull();
});

it("requires both dates", () => {
  expect(validateRange("", "2026-01-01")).not.toBeNull();
  expect(validateRange("2026-01-01", "")).not.toBeNull();
});

it("rejects an end before the start", () => {
  expect(validateRange("2026-02-01", "2026-01-01")).not.toBeNull();
});

it("rejects more than 366 days", () => {
  expect(validateRange("2026-01-01", "2027-01-02")).not.toBeNull();
  expect(validateRange("2026-01-01", "2027-01-01")).toBeNull();
});
