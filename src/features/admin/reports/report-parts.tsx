import {
  Banknote,
  CircleAlert,
  Download,
  Info,
  LoaderCircle,
  Minus,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatTry } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import { compare, pageOf, reasonMix, returnRateText, type SeriesPoint } from "./rules";

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

const DIRECTION_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
  none: Info,
} as const;

/** The change against the period before: an icon for a glance, and the words, so it never rests on colour or the icon
 * alone. */
export function Change({ current, previous }: { current: string; previous: string }) {
  const { direction, text } = compare(current, previous);
  const Icon = DIRECTION_ICON[direction];
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${TONE[direction]}`}>
      <Icon className="size-3.5 shrink-0" />
      {text}
    </span>
  );
}

const SIZE = 10;

/** A table that holds every row (the report endpoints send them all), shown a page at a time by the Dashboard's
 * DataTable. The page and size are local: there are several tables on a tab, so the URL cannot hold them all. */
function ReportTable<T extends { key: string }>({
  rows,
  columns,
}: {
  rows: T[];
  columns: Column<T>[];
}) {
  const [paging, setPaging] = useState({ page: 1, size: SIZE });
  const view = pageOf(rows, paging.page, paging.size);
  return (
    <DataTable
      data={view.rows}
      columns={columns}
      total={rows.length}
      search={{ page: view.page, size: paging.size as 10 }}
      onSearchChange={(patch) => setPaging((p) => ({ ...p, ...patch }))}
      searchable={false}
    />
  );
}

const right = (label: string) => () => <div className="text-right">{label}</div>;
const rightCell = (value: React.ReactNode) => <div className="text-right">{value}</div>;

type RankedProduct = ProductReportRow & { key: string; rank: number };
const productColumns = columnHelper<RankedProduct>();
const PRODUCT_COLUMNS: Column<RankedProduct>[] = [
  productColumns.accessor("rank", { header: "#", enableSorting: false }),
  productColumns.accessor("title", { header: "Ürün", enableSorting: false }),
  productColumns.display({
    id: "units",
    header: right("Adet"),
    cell: ({ row }) => rightCell(row.original.units),
  }),
  productColumns.display({
    id: "revenue",
    header: right("Ciro"),
    cell: ({ row }) => rightCell(formatTry(row.original.revenue)),
  }),
  productColumns.display({
    id: "change",
    header: "Önceki dönemle",
    cell: ({ row }) => (
      <Change current={row.original.revenue} previous={row.original.previous_revenue} />
    ),
  }),
];

/** The Products ranking, best first as the API sent it. The rank is fixed before paging, so page 2 starts at 11. */
export function ProductsTable({ rows }: { rows: ProductReportRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Bu dönemde satış yok.</p>;
  return (
    <ReportTable
      rows={rows.map(
        (r, i) => ({ ...r, key: r.product_id ?? `deleted-${i}`, rank: i + 1 }) as RankedProduct,
      )}
      columns={PRODUCT_COLUMNS}
    />
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
      icon: ShoppingCart,
      label: "Sipariş",
      value: String(totals.orders),
      now: String(totals.orders),
      was: String(before.orders),
    },
    {
      icon: Package,
      label: "Ürün adedi",
      value: String(totals.items),
      now: String(totals.items),
      was: String(before.items),
    },
    {
      icon: Banknote,
      label: "Ciro",
      value: formatTry(totals.revenue),
      now: totals.revenue,
      was: before.revenue,
    },
    {
      icon: Receipt,
      label: "Ortalama sepet",
      value: formatTry(totals.average_order),
      now: totals.average_order,
      was: before.average_order,
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="gap-2 py-4">
            <CardHeader className="gap-1">
              <CardDescription className="flex items-center gap-1.5">
                <c.icon className="size-4" />
                {c.label}
              </CardDescription>
              <CardTitle className="text-xl">{c.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Change current={c.now} previous={c.was} />
            </CardContent>
          </Card>
        ))}
      </div>
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

const CHART_CONFIG = { value: { label: "Ciro", color: "var(--primary)" } } satisfies ChartConfig;
const COMPACT = new Intl.NumberFormat("tr-TR", { notation: "compact" });

/** Revenue per day, week or month as bars (the shadcn chart, on Recharts). The drawing is hidden from a screen reader,
 * and the same figures sit beside it as a table that only a screen reader sees. */
export function SalesChart({ points }: { points: SeriesPoint[] }) {
  if (points.length === 0)
    return <p className="text-sm text-muted-foreground">Bu dönemde satış yok.</p>;
  return (
    <div>
      <ChartContainer config={CHART_CONFIG} className="aspect-auto h-64 w-full" aria-hidden="true">
        <BarChart data={points} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => COMPACT.format(v)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-medium">{formatTry(String(value))}</span>
                )}
              />
            }
          />
          <Bar dataKey="value" name="Ciro" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>Ciro</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.period}>
              <th scope="row">{p.label}</th>
              <td>{formatTry(String(p.value))}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
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
      <CircleAlert className="size-4" />
      <span>Rapor yüklenemedi.</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Tekrar dene
      </Button>
    </div>
  );
}

export type ReturnRow = {
  key: string;
  name: string;
  shipped: number;
  returned: number;
  rate: number | null;
  reasons: Parameters<typeof reasonMix>[0];
};

const returnColumns = columnHelper<ReturnRow>();

/** Returns by Product or by Size: the rate (counts only when the API sends none) and why they came back. */
export function ReturnsTable({ nameHeader, rows }: { nameHeader: string; rows: ReturnRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Bu dönemde iade verisi yok.</p>;
  const columns: Column<ReturnRow>[] = [
    returnColumns.accessor("name", { header: nameHeader, enableSorting: false }),
    returnColumns.display({
      id: "rate",
      header: "İade oranı",
      cell: ({ row }) => returnRateText(row.original),
    }),
    returnColumns.display({
      id: "reasons",
      header: "Nedenler",
      cell: ({ row }) =>
        reasonMix(row.original.reasons)
          .map((r) => `${r.label}: ${r.count}`)
          .join(", "),
    }),
  ];
  return <ReportTable rows={rows} columns={columns} />;
}

type DiscountRow = { orders: number; revenue: string; discount: string };
type NamedDiscountRow = DiscountRow & { key: string; name: string };
const discountColumns = columnHelper<NamedDiscountRow>();

function DiscountTable({
  nameHeader,
  rows,
  empty,
}: {
  nameHeader: string;
  rows: NamedDiscountRow[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const columns: Column<NamedDiscountRow>[] = [
    discountColumns.accessor("name", { header: nameHeader, enableSorting: false }),
    discountColumns.display({
      id: "orders",
      header: right("Sipariş"),
      cell: ({ row }) => rightCell(row.original.orders),
    }),
    discountColumns.display({
      id: "revenue",
      header: right("Ciro"),
      cell: ({ row }) => rightCell(formatTry(row.original.revenue)),
    }),
    discountColumns.display({
      id: "discount",
      header: right("Verilen indirim"),
      cell: ({ row }) => rightCell(formatTry(row.original.discount)),
    }),
  ];
  return <ReportTable rows={rows} columns={columns} />;
}

/** The discount each Campaign gave. */
export function CampaignsTable({
  rows,
}: {
  rows: (DiscountRow & { campaign_id: number; name: string })[];
}) {
  return (
    <DiscountTable
      nameHeader="Kampanya"
      empty="Bu dönemde kampanya satışı yok."
      rows={rows.map((r) => ({ ...r, key: String(r.campaign_id) }))}
    />
  );
}

/** The discount each Voucher gave. */
export function VouchersTable({ rows }: { rows: (DiscountRow & { code: string })[] }) {
  return (
    <DiscountTable
      nameHeader="Kupon"
      empty="Bu dönemde kupon kullanılmadı."
      rows={rows.map((r) => ({ ...r, key: r.code, name: r.code }))}
    />
  );
}
