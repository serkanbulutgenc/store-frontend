import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { ConfirmDeleteDialog } from "../components/delete-confirm";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import { CampaignDialogBody } from "./campaign-dialog";
import { type CampaignListRow, campaignsQuery, useCampaignActions } from "./queries";
import {
  CAMPAIGN_STATUSES,
  campaignStatusLabel,
  campaignStatusTone,
  campaignToggle,
  percentageText,
  scheduleText,
} from "./rules";
import type { CampaignSearch } from "./search";

const helper = columnHelper<CampaignListRow>();

export function CampaignsScreen({
  search,
  onSearchChange,
}: {
  search: CampaignSearch;
  onSearchChange: (patch: Partial<CampaignSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(campaignsQuery(search));
  const [editing, setEditing] = useState<CampaignListRow | "new" | null>(null);
  const close = () => setEditing(null);
  const [deleting, setDeleting] = useState<CampaignListRow | null>(null);
  const { toggle, remove } = useCampaignActions();
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  // Deleting the last Campaign of a later page leaves that page empty: step back.
  useEffect(() => {
    if (data.items.length === 0 && search.page > pages) onSearchChange({ page: pages });
  }, [data.items.length, search.page, pages, onSearchChange]);
  async function flip(c: CampaignListRow) {
    const next = campaignToggle(c.status);
    try {
      await toggle({ id: c.id, action: next.action });
      toast.success(next.success);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    }
  }
  const columns: Column<CampaignListRow>[] = [
    helper.accessor("name", { header: "Kampanya", enableSorting: false }),
    helper.display({
      id: "percentage",
      header: "İndirim",
      cell: ({ row: { original: c } }) => percentageText(c.percentage),
    }),
    helper.display({
      id: "schedule",
      header: "Geçerlilik",
      cell: ({ row: { original: c } }) => scheduleText(c.starts_at, c.ends_at),
    }),
    helper.display({
      id: "status",
      header: "Durum",
      cell: ({ row: { original: c } }) => (
        <Badge tone={campaignStatusTone(c.status)}>{campaignStatusLabel(c.status)}</Badge>
      ),
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: ({ row: { original: c } }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
            Düzenle
          </Button>
          <Button size="sm" variant="outline" onClick={() => void flip(c)}>
            {campaignToggle(c.status).label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${c.name} sil`}
            onClick={() => setDeleting(c)}
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
        <h1 className="text-lg font-semibold">Kampanyalar</h1>
        <Button size="sm" onClick={() => setEditing("new")}>
          Yeni kampanya
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
        emptyMessage="Kampanya yok."
        toolbar={
          <Select
            aria-label="Duruma göre filtrele"
            className="w-44"
            value={search.status ?? ""}
            onChange={(e) => onSearchChange({ status: e.target.value || undefined, page: 1 })}
          >
            <option value="">Tüm durumlar</option>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {campaignStatusLabel(s)}
              </option>
            ))}
          </Select>
        }
      />
      <ConfirmDeleteDialog
        target={deleting && { key: deleting.id, name: deleting.name }}
        title="Kampanyayı sil"
        touches={[]}
        run={() => (deleting ? remove(deleting.id) : Promise.resolve())}
        alternative={
          deleting && deleting.status !== "inactive"
            ? {
                label: "Kapat",
                run: () => toggle({ id: deleting.id, action: "deactivate" }),
                success: "Kampanya kapatıldı.",
              }
            : undefined
        }
        onClose={() => setDeleting(null)}
      />
      <Dialog
        open={editing !== null}
        onClose={close}
        size="lg"
        title={editing === "new" ? "Yeni kampanya" : "Kampanyayı düzenle"}
      >
        {editing !== null && (
          <CampaignDialogBody id={editing === "new" ? undefined : editing.id} onClose={close} />
        )}
      </Dialog>
    </div>
  );
}
