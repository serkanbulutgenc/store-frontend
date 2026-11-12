import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../../data-table/data-table";
import { type ReturnRow, type ReturnsSearch, returnsQuery } from "../queries";
import { RETURN_STATUSES, returnReasonLabel, returnStatusLabel, returnStatusTone } from "../rules";

const helper = columnHelper<ReturnRow>();

const columns: Column<ReturnRow>[] = [
  helper.accessor("number", {
    header: "Sipariş",
    enableSorting: false,
    cell: (c) => (
      <Link
        to="/admin/orders/$number"
        params={{ number: c.getValue() }}
        className="font-mono text-xs underline-offset-2 hover:underline"
      >
        {c.getValue()}
      </Link>
    ),
  }),
  helper.accessor("requested_at", {
    header: "Talep tarihi",
    enableSorting: false,
    cell: (c) => formatDate(c.getValue()),
  }),
  helper.accessor("customer", { header: "Müşteri", enableSorting: false }),
  helper.accessor("item_count", { header: "Adet", enableSorting: false }),
  helper.accessor("reason", {
    header: "Neden",
    enableSorting: false,
    cell: (c) => returnReasonLabel(c.getValue()),
  }),
  helper.accessor("status", {
    header: "Durum",
    enableSorting: false,
    cell: (c) => (
      <Badge tone={returnStatusTone(c.getValue())}>{returnStatusLabel(c.getValue())}</Badge>
    ),
  }),
];

export function ReturnsScreen({
  search,
  onSearchChange,
}: {
  search: ReturnsSearch;
  onSearchChange: (patch: Partial<ReturnsSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(returnsQuery(search));
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">İade talepleri</h1>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={{ ...search, q: undefined, ordering: undefined }}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        searchable={false}
        emptyMessage="İade talebi yok."
        toolbar={
          <Select
            aria-label="Duruma göre filtrele"
            className="w-44"
            value={search.status ?? ""}
            onChange={(e) => onSearchChange({ status: e.target.value || undefined, page: 1 })}
          >
            <option value="">Tüm durumlar</option>
            {RETURN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {returnStatusLabel(s)}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}
