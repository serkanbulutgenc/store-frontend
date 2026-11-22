import { describe, expect, it } from "vitest";
import { compare, csvDownload, reportQuery, salesSeries } from "./rules";
import { reportSearchSchema } from "./search";

const search = (raw: object) => reportSearchSchema.parse(raw);

describe("reportQuery", () => {
  it("asks Sales for the preset, KDV and grouping, but not the Products sort", () => {
    expect(
      reportQuery(
        search({ report: "sales", preset: "7d", kdv: "excl", group: "week", sort: "units" }),
      ),
    ).toEqual({
      preset: "7d",
      kdv: "excl",
      group: "week",
    });
  });

  it("asks Products for the sort, but not the Sales grouping", () => {
    expect(reportQuery(search({ report: "products", sort: "units" }))).toEqual({
      preset: "30d",
      kdv: "incl",
      sort: "units",
    });
  });

  it("sends a custom range instead of the preset, never both", () => {
    expect(
      reportQuery(search({ preset: "7d", date_from: "2026-11-01", date_to: "2026-11-21" })),
    ).toEqual({
      date_from: "2026-11-01",
      date_to: "2026-11-21",
      kdv: "incl",
      group: "day",
    });
  });
});

describe("compare", () => {
  it("says how much more than the period before", () => {
    expect(compare("120.00", "100.00")).toEqual({ direction: "up", text: "%20 artış" });
    expect(compare("112.50", "100")).toEqual({ direction: "up", text: "%12,5 artış" });
  });

  it("says how much less than the period before", () => {
    expect(compare("80.00", "100.00")).toEqual({ direction: "down", text: "%20 azalış" });
  });

  it("says nothing changed when the two are the same, or too close to tell at one decimal", () => {
    expect(compare("100.00", "100")).toEqual({ direction: "flat", text: "Değişmedi" });
    expect(compare("0", "0.00")).toEqual({ direction: "flat", text: "Değişmedi" });
    expect(compare("100.04", "100")).toEqual({ direction: "flat", text: "Değişmedi" });
  });

  it("gives no percentage when the period before had nothing to compare to", () => {
    expect(compare("50.00", "0.00")).toEqual({
      direction: "none",
      text: "Önceki dönemde veri yok",
    });
  });

  it("counts a drop to nothing as a full drop", () => {
    expect(compare("0", "40")).toEqual({ direction: "down", text: "%100 azalış" });
  });
});

const row = (period: string, revenue: string) => ({
  period,
  revenue,
  orders: 1,
  items: 1,
  average_order: revenue,
});

describe("salesSeries", () => {
  it("makes a point per row, in order, with the revenue as a number and a short day label", () => {
    expect(salesSeries([row("2026-11-01", "100.50"), row("2026-11-02", "0.00")], "day")).toEqual([
      { period: "2026-11-01", label: "1 Kas", value: 100.5 },
      { period: "2026-11-02", label: "2 Kas", value: 0 },
    ]);
  });

  it("labels a week by the Monday it starts on", () => {
    expect(salesSeries([row("2026-11-16", "10")], "week")[0]?.label).toBe("16 Kas");
  });

  it("labels a month by its name and year", () => {
    expect(salesSeries([row("2026-01-01", "10")], "month")[0]?.label).toBe("Oca 2026");
    expect(salesSeries([row("2026-12-01", "10")], "month")[0]?.label).toBe("Ara 2026");
  });

  it("is empty for no rows", () => {
    expect(salesSeries([], "day")).toEqual([]);
  });
});

describe("csvDownload", () => {
  const range = { start: "2026-10-23", end: "2026-11-21" };

  it("asks the Sales CSV for what the screen shows, and names the file after the range it covers", () => {
    const download = csvDownload(search({ report: "sales", kdv: "excl", group: "month" }), range);
    expect(download).toEqual({
      path: "/api/admin/reports/sales.csv",
      query: { preset: "30d", kdv: "excl", group: "month" },
      filename: "rapor-satis-2026-10-23-2026-11-21.csv",
    });
  });

  it("does the same for Products", () => {
    const download = csvDownload(search({ report: "products", sort: "units" }), range);
    expect(download.path).toBe("/api/admin/reports/products.csv");
    expect(download.query).toEqual({ preset: "30d", kdv: "incl", sort: "units" });
    expect(download.filename).toBe("rapor-urunler-2026-10-23-2026-11-21.csv");
  });
});
