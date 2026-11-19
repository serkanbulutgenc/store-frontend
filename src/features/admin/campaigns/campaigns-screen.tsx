import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useFlip, useStepBackWhenEmpty } from "../components/row-actions";
import { RowDeleteDialog, StatusFilter } from "../components/row-list";
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
  // The Campaign being edited, by id: an Order's link opens one through `?edit=`, and closing
  // the dialog takes the param off the address again.
  const [editing, setEditing] = useState<number | "new" | null>(search.edit ?? null);
  const close = () => {
    setEditing(null);
    if (search.edit !== undefined) onSearchChange({ edit: undefined });
  };
  const [deleting, setDeleting] = useState<CampaignListRow | null>(null);
  const { toggle, remove } = useCampaignActions();
  useStepBackWhenEmpty(data, search.page, onSearchChange);
  const flip = useFlip<CampaignListRow>(toggle, campaignToggle);
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
          <Button size="sm" variant="outline" onClick={() => setEditing(c.id)}>
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
          <StatusFilter
            statuses={CAMPAIGN_STATUSES}
            label={campaignStatusLabel}
            value={search.status}
            onChange={(status) => onSearchChange({ status, page: 1 })}
          />
        }
      />
      <RowDeleteDialog
        row={deleting}
        name={deleting?.name}
        title="Kampanyayı sil"
        closedMessage="Kampanya kapatıldı."
        toggle={toggle}
        remove={remove}
        onClose={() => setDeleting(null)}
      />
      <Dialog
        open={editing !== null}
        onClose={close}
        size="lg"
        title={editing === "new" ? "Yeni kampanya" : "Kampanyayı düzenle"}
      >
        {editing !== null && (
          <CampaignDialogBody id={editing === "new" ? undefined : editing} onClose={close} />
        )}
      </Dialog>
    </div>
  );
}
