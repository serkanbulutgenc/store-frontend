import { formatPercent } from "@/lib/format";
import { returnReasonLabel } from "../returns/rules";
import type { ReportSearch } from "./search";

/** The query the report endpoints take: a custom range replaces the preset, and KDV, the grouping and the sort go only
 * to the reports that have them (Returns counts units, so it has no KDV). */
export function reportQuery(search: ReportSearch) {
  const period =
    search.date_from && search.date_to
      ? { date_from: search.date_from, date_to: search.date_to }
      : { preset: search.preset };
  switch (search.report) {
    case "sales":
      return { ...period, kdv: search.kdv, group: search.group };
    case "products":
      return { ...period, kdv: search.kdv, sort: search.sort };
    case "returns":
      return period;
    case "campaigns-vouchers":
      return { ...period, kdv: search.kdv };
  }
}

export type Comparison = { direction: "up" | "down" | "flat" | "none"; text: string };

/** This period against the one just before it: "%20 artış", "%12,5 azalış", or why there is no percentage. Money
 * arrives as strings, and a figure is only compared, never summed, so Number is enough. */
export function compare(current: string, previous: string): Comparison {
  const before = Number(previous);
  const now = Number(current);
  if (before === 0) {
    return now === 0
      ? { direction: "flat", text: "Değişmedi" }
      : { direction: "none", text: "Önceki dönemde veri yok" };
  }
  const percent = Math.round(((now - before) / before) * 1000) / 10;
  if (percent === 0) return { direction: "flat", text: "Değişmedi" };
  const size = formatPercent(String(Math.abs(percent)));
  return percent > 0
    ? { direction: "up", text: `%${size} artış` }
    : { direction: "down", text: `%${size} azalış` };
}

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export type SeriesPoint = { period: string; label: string; value: number };

/** The Sales rows as chart points. The row's `period` is the day, the Monday or the first of the month, so the label is
 * read off the text itself: no time zone can shift it. */
export function salesSeries(
  rows: { period: string; revenue: string }[],
  group: "day" | "week" | "month",
): SeriesPoint[] {
  return rows.map(({ period, revenue }) => {
    const [year, month, day] = period.split("-");
    const name = MONTHS[Number(month) - 1];
    return {
      period,
      label: group === "month" ? `${name} ${year}` : `${Number(day)} ${name}`,
      value: Number(revenue),
    };
  });
}

const CSV: Record<
  ReportSearch["report"],
  {
    path:
      | "/api/admin/reports/sales.csv"
      | "/api/admin/reports/products.csv"
      | "/api/admin/reports/returns.csv"
      | "/api/admin/reports/campaigns-vouchers.csv";
    name: string;
  }
> = {
  sales: { path: "/api/admin/reports/sales.csv", name: "satis" },
  products: { path: "/api/admin/reports/products.csv", name: "urunler" },
  returns: { path: "/api/admin/reports/returns.csv", name: "iadeler" },
  "campaigns-vouchers": {
    path: "/api/admin/reports/campaigns-vouchers.csv",
    name: "kampanya-kupon",
  },
};

/** The CSV of the report on screen: the same query, and a file named after the range the report resolved to. */
export function csvDownload(search: ReportSearch, range: { start: string; end: string }) {
  const { path, name } = CSV[search.report];
  return {
    path,
    query: reportQuery(search),
    filename: `rapor-${name}-${range.start}-${range.end}.csv`,
  };
}

/** A rate (the API sends it as a percent) with the counts behind it. Under 5 shipped units the API sends no rate, and
 * the row shows its counts only. */
export function returnRateText(row: {
  shipped: number;
  returned: number;
  rate: number | null;
}): string {
  const counts = `${row.returned} / ${row.shipped} adet`;
  return row.rate === null ? counts : `%${formatPercent(String(row.rate))} (${counts})`;
}

const REASON_ORDER = [
  "wrong_size",
  "changed_mind",
  "defective",
  "wrong_item",
  "other",
  "unspecified",
] as const;

/** The reasons that happened, most first (ties keep the fixed order). "unspecified" is a whole-Order return, which
 * has no reason. */
export function reasonMix(reasons: Record<(typeof REASON_ORDER)[number], number>) {
  return REASON_ORDER.map((reason) => ({
    reason,
    label: reason === "unspecified" ? "Belirtilmedi" : returnReasonLabel(reason),
    count: reasons[reason],
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}
