import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { type Column, columnHelper, DataTable } from "../../data-table/data-table";
import type { ListSearch } from "../../data-table/search";
import { type LowStockOut, lowStockQuery } from "../queries";
import { AdjustStockDialog, type AdjustTarget } from "./adjust-stock-dialog";

const helper = columnHelper<LowStockOut>();

export function StockScreen({
  search,
  me,
  onSearchChange,
}: {
  search: Pick<ListSearch, "page" | "size">;
  me: Me;
  onSearchChange: (patch: Partial<ListSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(lowStockQuery(search));
  const [target, setTarget] = useState<AdjustTarget | null>(null);
  const canAdjust = can(me, "adjust_stock");

  const columns: Column<LowStockOut>[] = [
    helper.accessor("product_title", { header: "Ürün", enableSorting: false }),
    helper.accessor((r) => `${r.colour} / ${r.size}`, {
      id: "variant",
      header: "Varyant",
      enableSorting: false,
    }),
    helper.accessor("sku", {
      header: "SKU",
      enableSorting: false,
      cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>,
    }),
    helper.accessor("on_hand", { header: "Stok", enableSorting: false }),
    helper.accessor("threshold", { header: "Eşik", enableSorting: false }),
    helper.display({
      id: "actions",
      header: "",
      cell: (c) =>
        canAdjust ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const r = c.row.original;
              setTarget({
                id: r.variant_id,
                label: `${r.product_title} · ${r.colour} / ${r.size}`,
                onHand: r.on_hand,
              });
            }}
          >
            Düzelt
          </Button>
        ) : null,
    }),
  ];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Stok</h1>
        <p className="text-muted-foreground">
          Eşiğin altına düşen varyantlar. Diğer varyantların stoğunu ürün sayfasından
          düzeltebilirsiniz.
        </p>
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={{ ...search }}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        searchable={false}
        emptyMessage="Düşük stoklu varyant yok."
      />
      <AdjustStockDialog target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
