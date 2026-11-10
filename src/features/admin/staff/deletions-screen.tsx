import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import type { ListSearch } from "../data-table/search";
import {
  type DeletionRequestOut,
  deletionsQuery,
  useCompleteDeletion,
  useDeclineDeletion,
} from "./queries";

const helper = columnHelper<DeletionRequestOut>();

export function DeletionsScreen({
  search,
  onSearchChange,
}: {
  search: Pick<ListSearch, "page" | "size">;
  onSearchChange: (patch: Partial<ListSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(
    deletionsQuery({ page: search.page, size: search.size }),
  );
  const complete = useCompleteDeletion();
  const decline = useDeclineDeletion();

  async function run(label: string, ok: string, fn: () => Promise<unknown>) {
    if (!window.confirm(label)) return;
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem yapılamadı.");
    }
  }

  const columns: Column<DeletionRequestOut>[] = [
    helper.accessor("email", { header: "E-posta", enableSorting: false }),
    helper.accessor("name", { header: "Ad", enableSorting: false }),
    helper.accessor((r) => formatDate(r.requested_at), {
      id: "requested_at",
      header: "Talep tarihi",
      enableSorting: false,
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: (c) => {
        const r = c.row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                run(
                  `${r.email} hesabı anonimleştirilsin mi? Kişisel veriler silinir; siparişler sipariş anındaki ad ve fatura adresiyle kalır. Bu işlem geri alınamaz.`,
                  "Hesap anonimleştirildi.",
                  () => complete.mutateAsync(r.id),
                )
              }
            >
              Anonimleştir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run(`${r.email} talebi reddedilsin mi?`, "Talep reddedildi.", () =>
                  decline.mutateAsync(r.id),
                )
              }
            >
              Reddet
            </Button>
          </div>
        );
      },
    }),
  ];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Hesap silme talepleri</h1>
        <p className="text-muted-foreground">
          Anonimleştirme işlemi denetim günlüğüne yazılır ve siparişleri korur.
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
        emptyMessage="Bekleyen talep yok."
      />
    </div>
  );
}
