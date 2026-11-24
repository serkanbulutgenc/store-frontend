import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_STATUSES,
  campaignStatusLabel,
  campaignStatusTone,
  campaignToggle,
  scheduleText,
} from "../campaigns/rules";
import type { CampaignSearch } from "../campaigns/search";
import { useFlip, useStepBackWhenEmpty } from "../components/row-actions";
import { RowDeleteDialog, StatusFilter } from "../components/row-list";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import { basketCampaignsQuery, useBasketCampaignActions } from "./queries";
import { type BasketCampaignRow, benefitLabel } from "./rules";

const helper = columnHelper<BasketCampaignRow>();

/** The Sepet kampanyaları tab of the Kampanyalar screen: automatic offers once the basket
 * reaches a minimum amount. Creating and editing happen on their own admin pages. */
export function BasketCampaignsTab({
  search,
  onSearchChange,
}: {
  search: CampaignSearch;
  onSearchChange: (patch: Partial<CampaignSearch>) => void;
}) {
  const query = { status: search.bstatus, page: search.page, size: search.size };
  const { data, isFetching } = useSuspenseQuery(basketCampaignsQuery(query));
  const [deleting, setDeleting] = useState<BasketCampaignRow | null>(null);
  const { toggle, remove } = useBasketCampaignActions();
  useStepBackWhenEmpty(data, search.page, onSearchChange);
  const flip = useFlip<BasketCampaignRow>(toggle, campaignToggle);
  const columns: Column<BasketCampaignRow>[] = [
    helper.accessor("name", { header: "Kampanya", enableSorting: false }),
    helper.display({
      id: "rule",
      header: "Kural",
      cell: ({ row: { original: c } }) => (
        <span className="flex flex-wrap items-center gap-1">
          {c.label}
          <Badge tone="neutral">{benefitLabel(c.benefit)}</Badge>
        </span>
      ),
    }),
    helper.display({
      id: "schedule",
      header: "Geçerlilik",
      cell: ({ row: { original: c } }) => scheduleText(c.starts_at, c.ends_at),
    }),
    helper.display({
      id: "orders",
      header: "Sipariş",
      cell: ({ row: { original: c } }) => c.orders,
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
              to="/admin/basket-campaigns/$campaignId"
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
      <p className="text-muted-foreground">
        Sepet tutarı bir eşiğe ulaşınca otomatik uygulanan indirim veya ücretsiz kargo. Sepete
        yalnızca en avantajlı olan uygulanır; kuponla birlikte kullanılabilir.
      </p>
      <div className="flex justify-end">
        <Button size="sm" asChild>
          <Link to="/admin/basket-campaigns/new">Yeni sepet kampanyası</Link>
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
        emptyMessage="Sepet kampanyası yok."
        toolbar={
          <StatusFilter
            statuses={CAMPAIGN_STATUSES}
            label={campaignStatusLabel}
            value={search.bstatus}
            onChange={(bstatus) => onSearchChange({ bstatus, page: 1 })}
          />
        }
      />
      <RowDeleteDialog
        row={deleting}
        name={deleting?.name}
        title="Sepet kampanyasını sil"
        closedMessage="Sepet kampanyası kapatıldı."
        toggle={toggle}
        remove={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
