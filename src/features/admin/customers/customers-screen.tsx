import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import type { ListSearch } from "../data-table/search";
import { type CustomerRow, customersQuery } from "./queries";

const helper = columnHelper<CustomerRow>();

export function AnonymisedBadge() {
  return <Badge tone="neutral">Anonimleştirildi</Badge>;
}

const columns: Column<CustomerRow>[] = [
  helper.accessor("name", {
    header: "Ad soyad",
    enableSorting: false,
    cell: (c) => (
      <Link
        to="/admin/customers/$id"
        params={{ id: String(c.row.original.id) }}
        className="underline-offset-2 hover:underline"
      >
        {c.row.original.anonymised ? <AnonymisedBadge /> : c.getValue() || "—"}
      </Link>
    ),
  }),
  helper.accessor("email", {
    header: "E-posta",
    enableSorting: false,
    cell: (c) => c.getValue() || "—",
  }),
  helper.accessor("phone", {
    header: "Telefon",
    enableSorting: false,
    cell: (c) => c.getValue() || "—",
  }),
  helper.accessor("order_count", { header: "Sipariş", enableSorting: false }),
  helper.accessor("joined_at", {
    header: "Kayıt tarihi",
    enableSorting: false,
    cell: (c) => formatDate(c.getValue()),
  }),
];

export function CustomersScreen({
  search,
  onSearchChange,
}: {
  search: ListSearch;
  onSearchChange: (patch: Partial<ListSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(customersQuery(search));
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Müşteriler</h1>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={search}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        emptyMessage="Müşteri bulunamadı."
      />
    </div>
  );
}
