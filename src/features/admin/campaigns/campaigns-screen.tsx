import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { CampaignPagesTab } from "../campaign-pages/campaign-pages-screen";
import { useFlip, useStepBackWhenEmpty } from "../components/row-actions";
import { RowDeleteDialog, StatusFilter } from "../components/row-list";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
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

type Tab = "campaigns" | "pages";

/** Discount Campaigns and Campaign pages in one place. Staff may edit pages but not Campaigns, so
 * they see only the pages tab; creating and editing happen on their own admin pages. */
export function CampaignsScreen({
  search,
  onSearchChange,
  me,
}: {
  search: CampaignSearch;
  onSearchChange: (patch: Partial<CampaignSearch>) => void;
  me: Me;
}) {
  const tabs: { key: Tab; label: string }[] = [
    ...(can(me, "manage_campaigns") ? [{ key: "campaigns" as const, label: "Kampanyalar" }] : []),
    ...(can(me, "edit_campaign_pages")
      ? [{ key: "pages" as const, label: "Kampanya sayfaları" }]
      : []),
  ];
  const active = tabs.find((t) => t.key === search.tab)?.key ?? tabs[0]?.key;
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Kampanyalar</h1>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Kampanya türleri" className="flex gap-1 border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === active}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                t.key === active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSearchChange({ tab: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {active === "pages" ? (
        <CampaignPagesTab
          status={search.pstatus}
          onStatusChange={(pstatus) => onSearchChange({ pstatus })}
        />
      ) : active === "campaigns" ? (
        <CampaignsTab search={search} onSearchChange={onSearchChange} />
      ) : null}
    </div>
  );
}

function CampaignsTab({
  search,
  onSearchChange,
}: {
  search: CampaignSearch;
  onSearchChange: (patch: Partial<CampaignSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(campaignsQuery(search));
  const [deleting, setDeleting] = useState<CampaignListRow | null>(null);
  const { toggle, remove } = useCampaignActions();
  useStepBackWhenEmpty(data, search.page, onSearchChange);
  const flip = useFlip<CampaignListRow>(toggle, campaignToggle);
  const columns: Column<CampaignListRow>[] = [
    helper.display({
      id: "name",
      header: "Kampanya",
      cell: ({ row: { original: c } }) => (
        <span className="flex flex-wrap items-center gap-1">
          {c.name}
          {c.whole_store && <Badge tone="good">Tüm mağaza</Badge>}
        </span>
      ),
    }),
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
          <Button size="sm" variant="outline" asChild>
            <Link
              to="/admin/campaigns/$campaignId"
              params={{ campaignId: String(c.id) }}
              aria-label={`${c.name} düzenle`}
            >
              Düzenle
            </Link>
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
      <div className="flex justify-end">
        <Button size="sm" asChild>
          <Link to="/admin/campaigns/new">Yeni kampanya</Link>
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
    </div>
  );
}
