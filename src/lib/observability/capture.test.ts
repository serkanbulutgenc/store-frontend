import { expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { shouldReport } from "./capture";

it("skips expected API errors and reports server faults", () => {
  expect(shouldReport(new ApiError(404, "not_found", "x"))).toBe(false);
  expect(shouldReport(new ApiError(422, "invalid", "x"))).toBe(false);
  expect(shouldReport(new ApiError(502, "error", "x"))).toBe(true);
  expect(shouldReport(new TypeError("fetch failed"))).toBe(true);
});
