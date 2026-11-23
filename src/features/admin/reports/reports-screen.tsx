import { useQuery } from "@tanstack/react-query";
import { ChartColumn, Check, Package, TicketPercent, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  campaignsVouchersReportQuery,
  productsReportQuery,
  returnsReportQuery,
  salesReportQuery,
  useDownloadReportCsv,
} from "./queries";
import {
  CampaignsTable,
  CsvButton,
  ProductsTable,
  ReportFailed,
  ReturnsTable,
  SalesChart,
  SalesSummary,
  VouchersTable,
} from "./report-parts";
import { salesSeries } from "./rules";
import { PRESETS, REPORTS, type ReportSearch } from "./search";

const REPORT_LABEL: Record<(typeof REPORTS)[number], string> = {
  sales: "Satışlar",
  products: "Ürünler",
  returns: "İadeler",
  "campaigns-vouchers": "Kampanya ve kuponlar",
};
const REPORT_ICON = {
  sales: ChartColumn,
  products: Package,
  returns: Undo2,
  "campaigns-vouchers": TicketPercent,
} as const;
const PRESET_LABEL: Record<(typeof PRESETS)[number], string> = {
  today: "Bugün",
  "7d": "Son 7 gün",
  "30d": "Son 30 gün",
  this_month: "Bu ay",
  last_month: "Geçen ay",
};

export function ReportsScreen({
  search,
  onSearchChange,
}: {
  search: ReportSearch;
  onSearchChange: (patch: Partial<ReportSearch>) => void;
}) {
  const custom = Boolean(search.date_from && search.date_to);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Raporlar</h1>
      <Tabs
        value={search.report}
        onValueChange={(report) => onSearchChange({ report: report as ReportSearch["report"] })}
      >
        <TabsList className="group-data-[orientation=horizontal]/tabs:h-auto flex-wrap justify-start">
          {REPORTS.map((r) => {
            const Icon = REPORT_ICON[r];
            return (
              <TabsTrigger key={r} value={r}>
                <Icon />
                {REPORT_LABEL[r]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-end gap-3">
        <Select
          aria-label="Dönem"
          className="w-40"
          value={custom ? "" : search.preset}
          onChange={(e) =>
            onSearchChange({
              preset: e.target.value as ReportSearch["preset"],
              date_from: undefined,
              date_to: undefined,
            })
          }
        >
          {custom && <option value="">Özel aralık</option>}
          {PRESETS.map((p) => (
            <option key={p} value={p}>
              {PRESET_LABEL[p]}
            </option>
          ))}
        </Select>
        <RangePicker
          key={`${search.date_from}-${search.date_to}`}
          from={search.date_from}
          to={search.date_to}
          onApply={(date_from, date_to) => onSearchChange({ date_from, date_to })}
        />
        {search.report !== "returns" && (
          <Select
            aria-label="KDV"
            className="w-40"
            value={search.kdv}
            onChange={(e) => onSearchChange({ kdv: e.target.value as ReportSearch["kdv"] })}
          >
            <option value="incl">KDV dahil</option>
            <option value="excl">KDV hariç</option>
          </Select>
        )}
        {search.report === "sales" && (
          <Select
            aria-label="Gruplama"
            className="w-32"
            value={search.group}
            onChange={(e) => onSearchChange({ group: e.target.value as ReportSearch["group"] })}
          >
            <option value="day">Günlük</option>
            <option value="week">Haftalık</option>
            <option value="month">Aylık</option>
          </Select>
        )}
        {search.report === "products" && (
          <Select
            aria-label="Sıralama"
            className="w-40"
            value={search.sort}
            onChange={(e) => onSearchChange({ sort: e.target.value as ReportSearch["sort"] })}
          >
            <option value="revenue">Ciroya göre</option>
            <option value="units">Adede göre</option>
          </Select>
        )}
      </div>
      {search.report === "sales" && <SalesPanel search={search} />}
      {search.report === "products" && <ProductsPanel search={search} />}
      {search.report === "returns" && <ReturnsPanel search={search} />}
      {search.report === "campaigns-vouchers" && <CampaignsVouchersPanel search={search} />}
    </div>
  );
}

/** A custom range: both ends, applied together. Anything the URL schema would drop is simply not applied. */
function RangePicker({
  from,
  to,
  onApply,
}: {
  from: string | undefined;
  to: string | undefined;
  onApply: (from: string, to: string) => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const a = String(data.get("from") ?? "");
        const b = String(data.get("to") ?? "");
        if (a && b) onApply(a, b);
      }}
    >
      <Input aria-label="Başlangıç" name="from" type="date" defaultValue={from} className="w-36" />
      <Input aria-label="Bitiş" name="to" type="date" defaultValue={to} className="w-36" />
      <Button type="submit" variant="outline" size="sm">
        <Check className="size-4" />
        Uygula
      </Button>
    </form>
  );
}

function SalesPanel({ search }: { search: ReportSearch }) {
  const { data, isPending, isError, refetch } = useQuery(salesReportQuery(search));
  const csv = useDownloadReportCsv();
  if (isError) return <ReportFailed onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      <SalesSummary report={data} />
      <SalesChart points={salesSeries(data.rows, data.group)} />
      <CsvButton
        pending={csv.isPending}
        failed={csv.isError}
        onClick={() => csv.mutate({ search, range: data.range })}
      />
    </div>
  );
}

function ProductsPanel({ search }: { search: ReportSearch }) {
  const { data, isPending, isError, refetch } = useQuery(productsReportQuery(search));
  const csv = useDownloadReportCsv();
  if (isError) return <ReportFailed onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      <ProductsTable rows={data.rows} />
      <CsvButton
        pending={csv.isPending}
        failed={csv.isError}
        onClick={() => csv.mutate({ search, range: data.range })}
      />
    </div>
  );
}

function ReturnsPanel({ search }: { search: ReportSearch }) {
  const { data, isPending, isError, refetch } = useQuery(returnsReportQuery(search));
  const csv = useDownloadReportCsv();
  if (isError) return <ReportFailed onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Ürüne göre</h2>
      <ReturnsTable
        nameHeader="Ürün"
        rows={data.by_product.map((r) => ({
          ...r,
          key: String(r.product_id ?? r.title),
          name: r.title,
        }))}
      />
      <h2 className="text-lg font-medium">Bedene göre</h2>
      <ReturnsTable
        nameHeader="Beden"
        rows={data.by_size.map((r) => ({ ...r, key: r.size, name: r.size }))}
      />
      <CsvButton
        pending={csv.isPending}
        failed={csv.isError}
        onClick={() => csv.mutate({ search, range: data.range })}
      />
    </div>
  );
}

function CampaignsVouchersPanel({ search }: { search: ReportSearch }) {
  const { data, isPending, isError, refetch } = useQuery(campaignsVouchersReportQuery(search));
  const csv = useDownloadReportCsv();
  if (isError) return <ReportFailed onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Kampanyalar</h2>
      <CampaignsTable rows={data.campaigns} />
      <h2 className="text-lg font-medium">Kuponlar</h2>
      <VouchersTable rows={data.vouchers} />
      <CsvButton
        pending={csv.isPending}
        failed={csv.isError}
        onClick={() => csv.mutate({ search, range: data.range })}
      />
    </div>
  );
}
