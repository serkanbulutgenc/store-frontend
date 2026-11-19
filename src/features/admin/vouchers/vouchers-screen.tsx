import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate, formatTry } from "@/lib/format";
import { useFlip, useStepBackWhenEmpty } from "../components/row-actions";
import { RowDeleteDialog, StatusFilter } from "../components/row-list";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import type { VoucherRow } from "./form";
import { useVoucherActions, vouchersQuery } from "./queries";
import {
  benefitText,
  expiryText,
  redemptionsText,
  VOUCHER_STATUSES,
  voucherStatusLabel,
  voucherStatusTone,
  voucherToggle,
} from "./rules";
import type { VoucherSearch } from "./search";
import { VoucherForm } from "./voucher-dialog";

const helper = columnHelper<VoucherRow>();

export function VouchersScreen({
  search,
  onSearchChange,
}: {
  search: VoucherSearch;
  onSearchChange: (patch: Partial<VoucherSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(vouchersQuery(search));
  const [editing, setEditing] = useState<VoucherRow | "new" | null>(null);
  const close = () => setEditing(null);
  const [deleting, setDeleting] = useState<VoucherRow | null>(null);
  const { toggle, remove } = useVoucherActions();
  useStepBackWhenEmpty(data, search.page, onSearchChange);
  const flip = useFlip<VoucherRow>(toggle, voucherToggle);
  const columns: Column<VoucherRow>[] = [
    helper.accessor("code", {
      header: "Kod",
      enableSorting: false,
      cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>,
    }),
    helper.display({
      id: "benefit",
      header: "İndirim",
      cell: ({ row: { original: v } }) => (
        <>
          {benefitText(v.kind, v.value)}
          {v.once_per_customer && (
            <span className="block text-xs text-muted-foreground">Müşteri başına bir kez</span>
          )}
        </>
      ),
    }),
    helper.display({
      id: "minimum",
      header: "Alt sınır",
      cell: ({ row: { original: v } }) => formatTry(v.minimum),
    }),
    helper.display({
      id: "validity",
      header: "Geçerlilik",
      cell: ({ row: { original: v } }) => (
        <>
          {formatDate(v.starts_at)} – {expiryText(v.ends_at)}
        </>
      ),
    }),
    helper.display({
      id: "status",
      header: "Durum",
      cell: ({ row: { original: v } }) => (
        <Badge tone={voucherStatusTone(v.status)}>{voucherStatusLabel(v.status)}</Badge>
      ),
    }),
    helper.display({
      id: "redemptions",
      header: "Kullanım",
      cell: ({ row: { original: v } }) => redemptionsText(v.redemptions, v.cap),
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: ({ row: { original: v } }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
            Düzenle
          </Button>
          <Button size="sm" variant="outline" onClick={() => void flip(v)}>
            {voucherToggle(v.status).label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${v.code} sil`}
            onClick={() => setDeleting(v)}
          >
            Sil
          </Button>
        </div>
      ),
    }),
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Kuponlar</h1>
        <Button size="sm" onClick={() => setEditing("new")}>
          Yeni kupon
        </Button>
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={{ ...search, q: undefined, ordering: undefined }}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        searchable={false}
        emptyMessage="Kupon yok."
        toolbar={
          <StatusFilter
            statuses={VOUCHER_STATUSES}
            label={voucherStatusLabel}
            value={search.status}
            onChange={(status) => onSearchChange({ status, page: 1 })}
          />
        }
      />
      <RowDeleteDialog
        row={deleting}
        name={deleting?.code}
        title="Kuponu sil"
        closedMessage="Kupon kapatıldı."
        toggle={toggle}
        remove={remove}
        onClose={() => setDeleting(null)}
      />
      <Dialog
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "Yeni kupon" : "Kuponu düzenle"}
      >
        {editing !== null && (
          <VoucherForm row={editing === "new" ? undefined : editing} onClose={close} />
        )}
      </Dialog>
    </div>
  );
}
