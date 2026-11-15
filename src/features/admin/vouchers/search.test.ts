import { describe, expect, it } from "vitest";
import { VOUCHER_STATUSES } from "./rules";
import { voucherSearchSchema } from "./search";

describe("voucherSearchSchema", () => {
  it("keeps each status the API can filter by", () => {
    for (const status of VOUCHER_STATUSES) {
      expect(voucherSearchSchema.parse({ status }).status).toBe(status);
    }
  });

  it("falls back to all vouchers when the URL has no status or a bad one", () => {
    expect(voucherSearchSchema.parse({}).status).toBeUndefined();
    // The API refuses these with a 422, so they must never reach it.
    for (const status of ["", "nope", "ACTIVE", " active", 5, null, ["active"]]) {
      expect(voucherSearchSchema.parse({ status }).status, String(status)).toBeUndefined();
    }
  });
});
