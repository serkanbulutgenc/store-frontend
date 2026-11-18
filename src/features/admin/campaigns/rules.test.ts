import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_STATUSES,
  campaignStatusLabel,
  campaignStatusTone,
  campaignToggle,
  percentageText,
  scheduleText,
} from "./rules";

describe("campaign status", () => {
  it("offers the four statuses the API filters by, with Turkish labels", () => {
    expect(CAMPAIGN_STATUSES).toEqual(["active", "scheduled", "ended", "inactive"]);
    expect(CAMPAIGN_STATUSES.map(campaignStatusLabel)).toEqual([
      "Aktif",
      "Planlandı",
      "Sona erdi",
      "Kapalı",
    ]);
  });

  it("passes an unknown status through rather than hiding it", () => {
    expect(campaignStatusLabel("weird")).toBe("weird");
  });

  it("marks only a running Campaign good and an ended one as a warning", () => {
    expect(campaignStatusTone("active")).toBe("good");
    expect(campaignStatusTone("ended")).toBe("warn");
    expect(campaignStatusTone("scheduled")).toBe("neutral");
    expect(campaignStatusTone("inactive")).toBe("neutral");
  });
});

describe("campaignToggle", () => {
  it("opens a closed Campaign and closes any other, so an ended one is not brought back by itself", () => {
    expect(campaignToggle("inactive")).toMatchObject({ action: "activate", label: "Aç" });
    for (const s of ["active", "scheduled", "ended"]) {
      expect(campaignToggle(s)).toMatchObject({ action: "deactivate", label: "Kapat" });
    }
  });
});

describe("percentageText", () => {
  it("drops zero decimals and uses a Turkish comma for fractions", () => {
    expect(percentageText("20.00")).toBe("%20");
    expect(percentageText("12.50")).toBe("%12,5");
    expect(percentageText("33.33")).toBe("%33,33");
  });
});

describe("scheduleText", () => {
  it("says when there is no schedule", () => {
    expect(scheduleText(null, null)).toBe("Süresiz");
  });
  it("shows an open start and an open end in words", () => {
    expect(scheduleText(null, "2026-11-30T20:59:00Z")).toBe("Hemen – 30.11.2026 23:59");
    expect(scheduleText("2026-11-20T21:00:00Z", null)).toBe("21.11.2026 00:00 – Süresiz");
  });
  it("shows both ends in shop time", () => {
    expect(scheduleText("2026-11-20T21:00:00Z", "2026-11-30T20:59:00Z")).toBe(
      "21.11.2026 00:00 – 30.11.2026 23:59",
    );
  });
});
