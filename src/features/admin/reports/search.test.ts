import { describe, expect, it } from "vitest";
import { reportSearchSchema } from "./search";

describe("reportSearchSchema report", () => {
  it("opens on Sales when the URL names no report", () => {
    expect(reportSearchSchema.parse({}).report).toBe("sales");
  });

  it("takes either report the screen has", () => {
    expect(reportSearchSchema.parse({ report: "products" }).report).toBe("products");
    expect(reportSearchSchema.parse({ report: "sales" }).report).toBe("sales");
  });

  it("falls back to Sales for a report that does not exist (yet)", () => {
    for (const bad of ["returns", "", 3, null]) {
      expect(reportSearchSchema.parse({ report: bad }).report).toBe("sales");
    }
  });
});

describe("reportSearchSchema period", () => {
  it("defaults to the last 30 days, as the API does", () => {
    expect(reportSearchSchema.parse({}).preset).toBe("30d");
  });

  it("takes every preset the API has", () => {
    for (const preset of ["today", "7d", "30d", "this_month", "last_month"]) {
      expect(reportSearchSchema.parse({ preset }).preset).toBe(preset);
    }
  });

  it("falls back to 30 days for a preset the API would refuse", () => {
    for (const bad of ["90d", "", 7, null]) {
      expect(reportSearchSchema.parse({ preset: bad }).preset).toBe("30d");
    }
  });
});

describe("reportSearchSchema custom range", () => {
  it("is absent by default", () => {
    const parsed = reportSearchSchema.parse({});
    expect(parsed.date_from).toBeUndefined();
    expect(parsed.date_to).toBeUndefined();
  });

  it("keeps a range of two real dates, one day or up to 366 days", () => {
    expect(
      reportSearchSchema.parse({ date_from: "2026-11-01", date_to: "2026-11-21" }),
    ).toMatchObject({
      date_from: "2026-11-01",
      date_to: "2026-11-21",
    });
    expect(
      reportSearchSchema.parse({ date_from: "2026-11-01", date_to: "2026-11-01" }).date_to,
    ).toBe("2026-11-01");
    // 2024 is a leap year: 2024-01-01..2024-12-31 is exactly 366 days.
    expect(
      reportSearchSchema.parse({ date_from: "2024-01-01", date_to: "2024-12-31" }).date_to,
    ).toBe("2024-12-31");
  });

  it("drops the whole range when only one end is given", () => {
    for (const half of [{ date_from: "2026-11-01" }, { date_to: "2026-11-21" }]) {
      const parsed = reportSearchSchema.parse(half);
      expect(parsed.date_from).toBeUndefined();
      expect(parsed.date_to).toBeUndefined();
    }
  });

  it("drops a range the API would refuse", () => {
    const refused = [
      { date_from: "2026-11-21", date_to: "2026-11-01" }, // backwards
      { date_from: "2026-02-30", date_to: "2026-03-05" }, // not a real day
      { date_from: "01.11.2026", date_to: "21.11.2026" }, // not ISO
      { date_from: "2026-11-01", date_to: "" },
      { date_from: "2025-01-01", date_to: "2026-01-02" }, // 367 days
    ];
    for (const range of refused) {
      const parsed = reportSearchSchema.parse(range);
      expect(parsed.date_from).toBeUndefined();
      expect(parsed.date_to).toBeUndefined();
    }
  });
});

describe("reportSearchSchema options", () => {
  it("defaults to prices with KDV, by day, ranked by revenue, as the API does", () => {
    expect(reportSearchSchema.parse({})).toMatchObject({
      kdv: "incl",
      group: "day",
      sort: "revenue",
    });
  });

  it("takes every value the API has", () => {
    expect(reportSearchSchema.parse({ kdv: "excl" }).kdv).toBe("excl");
    for (const group of ["day", "week", "month"]) {
      expect(reportSearchSchema.parse({ group }).group).toBe(group);
    }
    expect(reportSearchSchema.parse({ sort: "units" }).sort).toBe("units");
  });

  it("falls back to the default for a value the API would refuse", () => {
    const parsed = reportSearchSchema.parse({ kdv: "net", group: "year", sort: "name" });
    expect(parsed).toMatchObject({ kdv: "incl", group: "day", sort: "revenue" });
  });
});
