import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";
import {
  benefitText,
  expiryText,
  redemptionsText,
  VOUCHER_STATUSES,
  voucherStatusLabel,
  voucherStatusTone,
  voucherToggle,
} from "./rules";

describe("voucher status", () => {
  it("offers exactly the statuses the API filters by", () => {
    expect([...VOUCHER_STATUSES].sort()).toEqual(
      ["active", "exhausted", "expired", "inactive", "scheduled"].sort(),
    );
  });

  it("labels each status in Turkish and shows an unknown one as it is", () => {
    expect(voucherStatusLabel("active")).toBe("Aktif");
    expect(voucherStatusLabel("inactive")).toBe("Kapalı");
    expect(voucherStatusLabel("expired")).toBe("Süresi doldu");
    expect(voucherStatusLabel("scheduled")).toBe("Planlandı");
    expect(voucherStatusLabel("exhausted")).toBe("Tükendi");
    expect(voucherStatusLabel("brand_new")).toBe("brand_new");
  });

  it("marks a working code good and a code that stopped working a warning", () => {
    expect(voucherStatusTone("active")).toBe("good");
    expect(voucherStatusTone("expired")).toBe("warn");
    expect(voucherStatusTone("exhausted")).toBe("warn");
    expect(voucherStatusTone("inactive")).toBe("neutral");
    expect(voucherStatusTone("scheduled")).toBe("neutral");
    expect(voucherStatusTone("brand_new")).toBe("neutral");
  });
});

describe("benefitText", () => {
  it("shows a percentage without needless decimals and a fixed amount in lira", () => {
    expect(benefitText("percentage", "10.00")).toBe("%10 indirim");
    expect(benefitText("percentage", "12.50")).toBe("%12,5 indirim");
    expect(benefitText("percentage", "100.00")).toBe("%100 indirim");
    expect(benefitText("fixed", "50.00")).toBe("₺50,00 indirim");
    expect(benefitText("fixed", "1234.50")).toBe("₺1.234,50 indirim");
  });
});

describe("redemptionsText", () => {
  it("shows the uses against the cap, or just the uses when there is no cap", () => {
    expect(redemptionsText(3, 100)).toBe("3 / 100");
    expect(redemptionsText(0, 5)).toBe("0 / 5");
    expect(redemptionsText(3, null)).toBe("3");
    expect(redemptionsText(0, null)).toBe("0");
  });
});

describe("expiryText", () => {
  it("says there is no expiry for an empty end and shows the shop time otherwise", () => {
    expect(expiryText(null)).toBe("Süresiz");
    expect(expiryText("2026-06-30T20:59:00Z")).toBe(formatDate("2026-06-30T20:59:00Z"));
    expect(expiryText("2026-06-30T20:59:00Z")).toContain("23:59"); // Istanbul is UTC+3
  });
});

describe("voucherToggle", () => {
  it("offers to open only a closed voucher, and to close every other one", () => {
    expect(voucherToggle("inactive")).toEqual({
      action: "activate",
      label: "Aç",
      success: "Kupon açıldı.",
    });
    for (const status of ["active", "scheduled", "exhausted", "expired"]) {
      expect(voucherToggle(status), status).toEqual({
        action: "deactivate",
        label: "Kapat",
        success: "Kupon kapatıldı.",
      });
    }
  });
});
