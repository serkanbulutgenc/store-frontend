import { describe, expect, it } from "vitest";
import { onOffToggle, statusLabel, statusTone } from "./on-off";

const wording = { opened: "Kayıt açıldı.", closed: "Kayıt kapatıldı." };

describe("onOffToggle", () => {
  it("opens a closed row and closes any other, so a lapsed one is not brought back by itself", () => {
    expect(onOffToggle("inactive", wording)).toEqual({
      action: "activate",
      label: "Aç",
      success: "Kayıt açıldı.",
    });
    for (const status of ["active", "scheduled", "ended", "expired", "exhausted"]) {
      expect(onOffToggle(status, wording)).toEqual({
        action: "deactivate",
        label: "Kapat",
        success: "Kayıt kapatıldı.",
      });
    }
  });
});

describe("statusLabel", () => {
  it("looks the status up and passes an unknown one through rather than hiding it", () => {
    expect(statusLabel({ active: "Aktif" }, "active")).toBe("Aktif");
    expect(statusLabel({ active: "Aktif" }, "weird")).toBe("weird");
  });
});

describe("statusTone", () => {
  it("is good for active, a warning for the lapsed statuses it is given, neutral otherwise", () => {
    expect(statusTone("active", ["ended"])).toBe("good");
    expect(statusTone("ended", ["ended"])).toBe("warn");
    expect(statusTone("scheduled", ["ended"])).toBe("neutral");
    expect(statusTone("unknown", [])).toBe("neutral");
  });
});
