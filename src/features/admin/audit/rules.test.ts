import { describe, expect, it } from "vitest";
import { auditActionLabel, formatSnapshot } from "./rules";

describe("auditActionLabel", () => {
  it("labels known actions and falls back to the raw name", () => {
    expect(auditActionLabel("mark_paid")).toBe("Ödendi işaretlendi");
    expect(auditActionLabel("brand_new_action")).toBe("brand_new_action");
  });
});

describe("formatSnapshot", () => {
  it("pretty-prints objects and treats null as empty", () => {
    expect(formatSnapshot({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatSnapshot(null)).toBeNull();
  });
});
