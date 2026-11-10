import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { can, type Me } from "@/lib/api/me";
import { formatDate, formatTry } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../../data-table/data-table";
import {
  type OrderRow,
  type OrdersSearch,
  ordersQuery,
  useMarkPaid,
  useShipOrder,
} from "../queries";
import {
  canBulkMarkPaid,
  canBulkShip,
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusTone,
  PAYMENT_STATUSES,
  type PaymentStatus,
  paymentLabel,
  paymentTone,
} from "../rules";
import { BulkShipDialog } from "./bulk-ship-dialog";

const helper = columnHelper<OrderRow>();

export function OrdersScreen({
  search,
  me,
  onSearchChange,
}: {
  search: OrdersSearch;
  me: Me;
  onSearchChange: (patch: Partial<OrdersSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(ordersQuery(search));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shipNumbers, setShipNumbers] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const markPaid = useMarkPaid();
  const ship = useShipOrder();

  const chosen = data.items.filter((r) => selected.has(r.number));
  const payable = chosen.filter((r) => canBulkMarkPaid(r));
  const shippable = chosen.filter(canBulkShip);
  const mayPay = can(me, "mark_paid");
  const mayShip = can(me, "manage_orders");
  const bulk = mayPay || mayShip;

  const toggle = (n: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(n)) next.add(n);
      return next;
    });
  const allOnPage = data.items.length > 0 && data.items.every((r) => selected.has(r.number));

  async function payAll() {
    if (!window.confirm(`${payable.length} sipariş tam tutarıyla ödendi olarak işaretlensin mi?`))
      return;
    setBusy(true);
    const failed: string[] = [];
    for (const r of payable) {
      try {
        await markPaid.mutateAsync({ number: r.number, body: { amount: r.total } });
      } catch {
        failed.push(r.number);
      }
    }
    setBusy(false);
    setSelected(new Set(failed));
    if (failed.length) toast.error(`Ödeme kaydedilemedi: ${failed.join(", ")}`);
    else toast.success(`${payable.length} sipariş ödendi olarak işaretlendi.`);
  }

  const columns: Column<OrderRow>[] = [
    ...(bulk
      ? [
          helper.display({
            id: "select",
            header: () => (
              <input
                type="checkbox"
                aria-label="Sayfadaki tümünü seç"
                checked={allOnPage}
                onChange={() =>
                  setSelected(allOnPage ? new Set() : new Set(data.items.map((r) => r.number)))
                }
              />
            ),
            cell: (c) => (
              <input
                type="checkbox"
                aria-label={`${c.row.original.number} seç`}
                checked={selected.has(c.row.original.number)}
                onChange={() => toggle(c.row.original.number)}
              />
            ),
          }),
        ]
      : []),
    helper.accessor("number", {
      header: "Sipariş",
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
    helper.accessor((r) => r.placed_at, {
      id: "date_placed",
      header: "Tarih",
      cell: (c) => formatDate(c.row.original.placed_at),
    }),
    helper.accessor("customer", { header: "Müşteri", enableSorting: false }),
    helper.accessor("item_count", { header: "Adet", enableSorting: false }),
    helper.accessor((r) => r.total, {
      id: "total_incl_tax",
      header: "Toplam",
      cell: (c) => formatTry(c.row.original.total),
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

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Siparişler</h1>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={search}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        emptyMessage="Sipariş bulunamadı."
        toolbar={
          <>
            <Select
              aria-label="Duruma göre filtrele"
              className="w-44"
              value={search.status ?? ""}
              onChange={(e) => onSearchChange({ status: e.target.value || undefined, page: 1 })}
            >
              <option value="">Tüm durumlar</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel(s)}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Ödeme durumuna göre filtrele"
              className="w-44"
              value={search.payment_status ?? ""}
              onChange={(e) =>
                onSearchChange({ payment_status: e.target.value || undefined, page: 1 })
              }
            >
              <option value="">Tüm ödemeler</option>
              {PAYMENT_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {paymentLabel(p)}
                </option>
              ))}
            </Select>
          </>
        }
      />
      {bulk && chosen.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2">
          <span>{chosen.length} sipariş seçili</span>
          {mayPay && (
            <Button size="sm" disabled={busy || payable.length === 0} onClick={payAll}>
              Ödendi işaretle ({payable.length})
            </Button>
          )}
          {mayShip && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy || shippable.length === 0}
              onClick={() => setShipNumbers(shippable.map((r) => r.number))}
            >
              Kargola ({shippable.length})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
            Seçimi temizle
          </Button>
        </div>
      )}
      <BulkShipDialog
        open={shipNumbers !== null}
        numbers={shipNumbers ?? []}
        ship={(number, body) => ship.mutateAsync({ number, body })}
        onDone={(failed) => {
          setShipNumbers(null);
          if (failed) setSelected(new Set(failed));
        }}
      />
    </div>
  );
}
