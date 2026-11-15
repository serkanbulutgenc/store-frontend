import { describe, expect, it } from "vitest";
import { auditActionLabel, formatSnapshot } from "./rules";

describe("auditActionLabel", () => {
  it("labels known actions and falls back to the raw name", () => {
    expect(auditActionLabel("mark_paid")).toBe("Ödendi işaretlendi");
    expect(auditActionLabel("brand_new_action")).toBe("brand_new_action");
  });
});

describe("auditActionLabel for vouchers", () => {
  it("labels the five voucher actions the backend writes", () => {
    expect(auditActionLabel("voucher_created")).toBe("Kupon oluşturuldu");
    expect(auditActionLabel("voucher_edited")).toBe("Kupon düzenlendi");
    expect(auditActionLabel("voucher_deactivated")).toBe("Kupon kapatıldı");
    expect(auditActionLabel("voucher_activated")).toBe("Kupon açıldı");
    expect(auditActionLabel("voucher_deleted")).toBe("Kupon silindi");
  });
});

describe("formatSnapshot", () => {
  it("pretty-prints objects and treats null as empty", () => {
    expect(formatSnapshot({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatSnapshot(null)).toBeNull();
  });
});
