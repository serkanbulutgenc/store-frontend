import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTry } from "@/lib/format";
import { useCrumbLabel } from "../components/crumb-labels";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import {
  orderStatusLabel,
  orderStatusTone,
  type PaymentStatus,
  paymentLabel,
  paymentTone,
} from "../orders/rules";
import { AnonymisedBadge } from "./customers-screen";
import { type CustomerDetail, customerQuery } from "./queries";

type OrderRow = CustomerDetail["orders"][number];
const helper = columnHelper<OrderRow>();

const columns: Column<OrderRow>[] = [
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
  helper.accessor("placed_at", {
    header: "Tarih",
    enableSorting: false,
    cell: (c) => formatDate(c.getValue()),
  }),
  helper.accessor("item_count", { header: "Adet", enableSorting: false }),
  helper.accessor("total", {
    header: "Toplam",
    enableSorting: false,
    cell: (c) => formatTry(c.getValue()),
  }),
  helper.accessor("status", {
    header: "Durum",
    enableSorting: false,
    cell: (c) => (
      <Badge tone={orderStatusTone(c.getValue())}>{orderStatusLabel(c.getValue())}</Badge>
    ),
  }),
  helper.accessor("payment_status", {
    header: "Ödeme",
    enableSorting: false,
    cell: (c) => {
      const p = c.getValue() as PaymentStatus;
      return <Badge tone={paymentTone[p]}>{paymentLabel(p)}</Badge>;
    },
  }),
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

export function CustomerDetailScreen({ id }: { id: number }) {
  const { data: c } = useSuspenseQuery(customerQuery(id));
  useCrumbLabel(String(id), c.anonymised ? "Anonimleştirildi" : c.name || c.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{c.anonymised ? "Müşteri" : c.name || c.email}</h1>
        {c.anonymised && <AnonymisedBadge />}
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Profil</h2>
        <dl className="space-y-1">
          <Row label="Ad soyad">{c.name}</Row>
          <Row label="E-posta">{c.email}</Row>
          <Row label="Telefon">{c.phone}</Row>
          <Row label="Kayıt tarihi">{formatDate(c.joined_at)}</Row>
          <Row label="Pazarlama izni">{c.marketing_consent ? "Var" : "Yok"}</Row>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Siparişler ({c.order_count})</h2>
        <DataTable
          data={c.orders}
          columns={columns}
          total={c.orders.length}
          search={{ page: 1, size: 100 }}
          onSearchChange={() => {}}
          emptyMessage="Henüz sipariş yok."
        />
      </section>
    </div>
  );
}
