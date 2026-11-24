import { Link } from "@tanstack/react-router";
import { formatTry } from "@/lib/format";
import type { HomeData } from "../returns/queries";
import { WidgetCard } from "./widget-card";

type Summary = NonNullable<HomeData["report_summary"]>;

const LABELS: Record<Summary["periods"][number]["preset"], string> = {
  today: "Bugün",
  "7d": "Son 7 gün",
  "30d": "Son 30 gün",
};

/** Orders and revenue for three windows: the Sales report's own figures (KDV dahil), Owner only.
 * Read-only, so no Quick action; Raporlar has the detail. */
export function ReportSummaryWidget({ data }: { data: Summary }) {
  return (
    <WidgetCard
      id="widget-report-summary"
      title="Satış özeti"
      seeAll={
        <Link
          to="/admin/reports"
          search={{ report: "sales", preset: "30d", kdv: "incl", group: "day", sort: "revenue" }}
          className="text-primary underline"
        >
          Raporlar
        </Link>
      }
    >
      <dl className="grid grid-cols-3 gap-2">
        {data.periods.map((p) => (
          <div key={p.preset}>
            <dt className="text-muted-foreground">{LABELS[p.preset]}</dt>
            <dd className="font-semibold">{formatTry(p.revenue)}</dd>
            <dd className="text-muted-foreground">{p.orders} sipariş</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}
