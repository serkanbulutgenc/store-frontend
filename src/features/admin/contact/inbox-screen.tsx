import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { isOwner, type Me } from "@/lib/api/me";
import { useStepBackWhenEmpty } from "../components/row-actions";
import { StatusFilter } from "../components/row-list";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import { CategoriesDialog } from "./categories-dialog";
import { filterCategoriesQuery, type ThreadSummary, threadsQuery } from "./queries";
import { THREAD_STATUSES, threadStatusLabel, threadStatusTone, waitingText } from "./rules";
import type { ContactSearch } from "./search";
import { formatWhen } from "./thread-parts";

const helper = columnHelper<ThreadSummary>();

const columns: Column<ThreadSummary>[] = [
  helper.display({
    id: "from",
    header: "Gönderen",
    cell: ({ row: { original: t } }) =>
      t.anonymised ? (
        <span className="text-muted-foreground">Anonimleştirildi</span>
      ) : (
        <>
          <span className="font-medium">{t.name}</span>
          <span className="block text-xs text-muted-foreground">{t.email}</span>
        </>
      ),
  }),
  helper.display({
    id: "subject",
    header: "Konu",
    cell: ({ row: { original: t } }) => (
      <Link
        to="/admin/contact/$threadId"
        params={{ threadId: String(t.id) }}
        className="block max-w-md hover:underline"
      >
        <span className="text-xs text-muted-foreground">
          {t.category}
          {t.order_number ? ` · ${t.order_number}` : ""}
        </span>
        <span className="block truncate">{t.snippet || "—"}</span>
      </Link>
    ),
  }),
  helper.display({
    id: "status",
    header: "Durum",
    cell: ({ row: { original: t } }) => (
      <div className="space-y-1">
        <Badge tone={threadStatusTone(t.status)}>{threadStatusLabel(t.status)}</Badge>
        {t.pending_reply_count > 0 && (
          <Badge tone="warn" className="ml-1">
            {waitingText(t.pending_reply_count)}
          </Badge>
        )}
      </div>
    ),
  }),
  helper.display({
    id: "assignee",
    header: "Atanan",
    cell: ({ row: { original: t } }) => t.assignee?.name ?? "—",
  }),
  helper.display({
    id: "activity",
    header: "Son hareket",
    cell: ({ row: { original: t } }) => formatWhen(t.last_activity_at),
  }),
];

export function InboxScreen({
  search,
  me,
  onSearchChange,
}: {
  search: ContactSearch;
  me: Me;
  onSearchChange: (patch: Partial<ContactSearch>) => void;
}) {
  const owner = isOwner(me);
  const { data, isFetching } = useSuspenseQuery(threadsQuery(search, me.id));
  const categories = useQuery(filterCategoriesQuery(owner));
  const [managing, setManaging] = useState(false);
  useStepBackWhenEmpty(data, search.page, onSearchChange);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">İletişim mesajları</h1>
        {owner && (
          <Button size="sm" variant="outline" onClick={() => setManaging(true)}>
            Kategoriler
          </Button>
        )}
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={{ ...search, ordering: undefined }}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        emptyMessage="Mesaj yok."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter
              statuses={[...THREAD_STATUSES]}
              label={threadStatusLabel}
              value={search.status}
              onChange={(status) => onSearchChange({ status, page: 1 })}
            />
            <Select
              aria-label="Kategoriye göre filtrele"
              className="w-44"
              value={search.category ?? ""}
              onChange={(e) =>
                onSearchChange({
                  category: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">Tüm kategoriler</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={!!search.pending}
                onChange={(e) =>
                  onSearchChange({ pending: e.target.checked || undefined, page: 1 })
                }
              />
              Onay bekleyen yanıt
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={!!search.mine}
                onChange={(e) => onSearchChange({ mine: e.target.checked || undefined, page: 1 })}
              />
              Bana atananlar
            </label>
            <Input
              type="date"
              aria-label="Başlangıç tarihi"
              className="w-40"
              value={search.from ?? ""}
              onChange={(e) => onSearchChange({ from: e.target.value || undefined, page: 1 })}
            />
            <Input
              type="date"
              aria-label="Bitiş tarihi"
              className="w-40"
              value={search.to ?? ""}
              onChange={(e) => onSearchChange({ to: e.target.value || undefined, page: 1 })}
            />
          </div>
        }
      />
      {owner && <CategoriesDialog open={managing} onClose={() => setManaging(false)} />}
    </div>
  );
}
