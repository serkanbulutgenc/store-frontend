import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import { staffQuery } from "../staff/queries";
import { type AuditEntryOut, type AuditSearch, auditEntryQuery, auditQuery } from "./queries";
import { AUDIT_ACTIONS, auditActionLabel, formatSnapshot } from "./rules";

const helper = columnHelper<AuditEntryOut>();

function Snapshot({ title, value }: { title: string; value: unknown }) {
  const text = formatSnapshot(value);
  return (
    <section className="space-y-1">
      <h3 className="font-medium">{title}</h3>
      {text ? (
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted p-2 text-xs">
          {text}
        </pre>
      ) : (
        <p className="text-muted-foreground">Kayıt yok.</p>
      )}
    </section>
  );
}

function EntryDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isPending, isError } = useQuery({
    ...auditEntryQuery(id ?? 0),
    enabled: id !== null,
  });
  return (
    <Dialog open={id !== null} onClose={onClose} title="İşlem ayrıntısı">
      {isPending && <p>Yükleniyor…</p>}
      {isError && <p role="alert">Ayrıntı yüklenemedi.</p>}
      {data && (
        <div className="space-y-3">
          <dl className="space-y-1">
            <div>
              {auditActionLabel(data.action)} · {data.actor}
            </div>
            <div className="text-muted-foreground">
              {data.target_type} #{data.target_id}
            </div>
            {data.summary && <div>{data.summary}</div>}
          </dl>
          <Snapshot title="Önce" value={data.before} />
          <Snapshot title="Sonra" value={data.after} />
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Dialog>
  );
}

export function AuditScreen({
  search,
  onSearchChange,
}: {
  search: AuditSearch;
  onSearchChange: (patch: Partial<AuditSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(auditQuery(search));
  const { data: staff } = useSuspenseQuery(staffQuery({ page: 1, size: 100 }));
  const [open, setOpen] = useState<number | null>(null);

  const columns: Column<AuditEntryOut>[] = [
    helper.accessor("at", {
      header: "Zaman",
      enableSorting: false,
      cell: (c) => formatDate(c.getValue()),
    }),
    helper.accessor("actor", { header: "Kullanıcı", enableSorting: false }),
    helper.accessor("action", {
      header: "İşlem",
      enableSorting: false,
      cell: (c) => auditActionLabel(c.getValue()),
    }),
    helper.accessor("summary", {
      header: "Özet",
      enableSorting: false,
      cell: (c) => c.getValue() || "—",
    }),
    helper.display({
      id: "detail",
      header: "",
      cell: (c) => (
        <Button size="sm" variant="outline" onClick={() => setOpen(c.row.original.id)}>
          Ayrıntı
        </Button>
      ),
    }),
  ];

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Denetim günlüğü</h1>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={search}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        searchable={false}
        emptyMessage="Kayıt bulunamadı."
        toolbar={
          <>
            <Select
              aria-label="Kullanıcıya göre filtrele"
              className="w-48"
              value={search.actor ?? ""}
              onChange={(e) =>
                onSearchChange({
                  actor: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">Tüm kullanıcılar</option>
              {staff.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </Select>
            <Select
              aria-label="İşleme göre filtrele"
              className="w-48"
              value={search.action ?? ""}
              onChange={(e) => onSearchChange({ action: e.target.value || undefined, page: 1 })}
            >
              <option value="">Tüm işlemler</option>
              {Object.entries(AUDIT_ACTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              aria-label="Başlangıç tarihi"
              className="w-40"
              value={search.date_from ?? ""}
              max={search.date_to}
              onChange={(e) => onSearchChange({ date_from: e.target.value || undefined, page: 1 })}
            />
            <Input
              type="date"
              aria-label="Bitiş tarihi"
              className="w-40"
              value={search.date_to ?? ""}
              min={search.date_from}
              onChange={(e) => onSearchChange({ date_to: e.target.value || undefined, page: 1 })}
            />
          </>
        }
      />
      <EntryDialog id={open} onClose={() => setOpen(null)} />
    </div>
  );
}
