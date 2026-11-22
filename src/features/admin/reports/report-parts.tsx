import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTry } from "@/lib/format";
import { compare, type SeriesPoint } from "./rules";

export type ProductReportRow = {
  product_id: number | null;
  title: string;
  units: number;
  revenue: string;
  previous_units: number;
  previous_revenue: string;
};

const TONE = {
  up: "text-emerald-700",
  down: "text-destructive",
  flat: "text-muted-foreground",
  none: "text-muted-foreground",
} as const;

/** The change against the period before, as words, so it never rests on colour alone. */
export function Change({ current, previous }: { current: string; previous: string }) {
  const { direction, text } = compare(current, previous);
  return <span className={`text-xs ${TONE[direction]}`}>{text}</span>;
}

/** The Products ranking, best first as the API sent it. */
export function ProductsTable({ rows }: { rows: ProductReportRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Bu dönemde satış yok.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead className="text-right">Adet</TableHead>
          <TableHead className="text-right">Ciro</TableHead>
          <TableHead>Önceki dönemle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.product_id ?? `deleted-${i}`}>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell className="text-right">{row.units}</TableCell>
            <TableCell className="text-right">{formatTry(row.revenue)}</TableCell>
            <TableCell>
              <Change current={row.revenue} previous={row.previous_revenue} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type Totals = { orders: number; items: number; revenue: string; average_order: string };

export type SalesSummaryData = {
  totals: Totals;
  previous_totals: Totals;
  pending: { orders: number; revenue: string };
  fees: { shipping: string; cod: string };
};

/** The headline figures of Sales, each against the period before; unpaid transfers and fees sit apart, since neither
 * is in the revenue. */
export function SalesSummary({ report }: { report: SalesSummaryData }) {
  const { totals, previous_totals: before, pending, fees } = report;
  const cards = [
    {
      label: "Sipariş",
      value: String(totals.orders),
      now: String(totals.orders),
      was: String(before.orders),
    },
    {
      label: "Ürün adedi",
      value: String(totals.items),
      now: String(totals.items),
      was: String(before.items),
    },
    { label: "Ciro", value: formatTry(totals.revenue), now: totals.revenue, was: before.revenue },
    {
      label: "Ortalama sepet",
      value: formatTry(totals.average_order),
      now: totals.average_order,
      was: before.average_order,
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border p-3">
            <dt className="text-sm text-muted-foreground">{c.label}</dt>
            <dd className="text-xl font-semibold">{c.value}</dd>
            <Change current={c.now} previous={c.was} />
          </div>
        ))}
      </dl>
      {pending.orders > 0 && (
        <p className="text-sm text-muted-foreground">
          {`Ödeme bekleyen: ${pending.orders} sipariş, ${formatTry(pending.revenue)} (cirodan ayrı)`}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {`Kargo ücreti: ${formatTry(fees.shipping)} · Kapıda ödeme ücreti: ${formatTry(fees.cod)} (cirodan ayrı)`}
      </p>
    </div>
  );
}

const PLOT_HEIGHT = 160;
const BAR_WIDTH = 24;
const BAR_GAP = 8;
const LABEL_HEIGHT = 20;

/** Revenue per day, week or month as bars. Hand-rolled SVG: the tallest bar fills the plot, and each bar carries its
 * label and revenue as text. */
export function SalesChart({ points }: { points: SeriesPoint[] }) {
  if (points.length === 0)
    return <p className="text-sm text-muted-foreground">Bu dönemde satış yok.</p>;
  const max = Math.max(...points.map((p) => p.value));
  const step = BAR_WIDTH + BAR_GAP;
  const width = points.length * step;
  // About eight labels fit under the bars; the rest stay readable through the bar's own text.
  const every = Math.ceil(points.length / 8);
  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label="Ciro grafiği"
        viewBox={`0 0 ${width} ${PLOT_HEIGHT + LABEL_HEIGHT}`}
        width={width}
        height={PLOT_HEIGHT + LABEL_HEIGHT}
        className="text-primary"
      >
        {points.map((p, i) => {
          const height = max > 0 ? (p.value / max) * PLOT_HEIGHT : 0;
          return (
            <g key={p.period}>
              <rect
                data-bar
                x={i * step + BAR_GAP / 2}
                y={PLOT_HEIGHT - height}
                width={BAR_WIDTH}
                height={height}
                fill="currentColor"
              >
                <title>{`${p.label}: ${formatTry(String(p.value))}`}</title>
              </rect>
              {i % every === 0 && (
                <text
                  x={i * step + step / 2}
                  y={PLOT_HEIGHT + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** The CSV download of the report on screen. While it runs the button is off, and a failure is said out loud. */
export function CsvButton({
  pending,
  failed,
  onClick,
}: {
  pending: boolean;
  failed: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" disabled={pending} onClick={onClick}>
        {pending ? "İndiriliyor…" : "CSV indir"}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          CSV indirilemedi.
        </p>
      )}
    </div>
  );
}

/** A report that did not load, with a way to try again. */
export function ReportFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 text-sm text-destructive">
      <span>Rapor yüklenemedi.</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Tekrar dene
      </Button>
    </div>
  );
}
