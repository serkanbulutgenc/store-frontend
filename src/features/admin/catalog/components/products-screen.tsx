import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { can, type Me } from "@/lib/api/me";
import { formatTry } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../../data-table/data-table";
import { categoryLabels, statusLabel, statusTone } from "../labels";
import {
  categoriesQuery,
  type ProductListOut,
  type ProductStatus,
  type ProductsSearch,
  productsQuery,
} from "../queries";

const helper = columnHelper<ProductListOut>();

const columns: Column<ProductListOut>[] = [
  helper.accessor("title", {
    header: "Ürün",
    cell: (c) => (
      <Link
        to="/admin/products/$productId"
        params={{ productId: String(c.row.original.id) }}
        className="font-medium underline-offset-2 hover:underline"
      >
        {c.getValue()}
      </Link>
    ),
  }),
  helper.accessor((r) => r.category?.name ?? "—", {
    id: "category",
    header: "Kategori",
    enableSorting: false,
  }),
  helper.accessor("shelf_price", { header: "Fiyat", cell: (c) => formatTry(c.getValue()) }),
  helper.accessor("stock_total", { header: "Stok", enableSorting: false }),
  helper.accessor("variant_count", { header: "Varyant", enableSorting: false }),
  helper.accessor("status", {
    header: "Durum",
    cell: (c) => {
      const status = c.getValue() as ProductStatus;
      return <Badge tone={statusTone[status]}>{statusLabel(status)}</Badge>;
    },
  }),
];

export function ProductsScreen({
  search,
  me,
  onSearchChange,
}: {
  search: ProductsSearch;
  me: Me;
  onSearchChange: (patch: Partial<ProductsSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(productsQuery(search));
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Ürünler</h1>
        {can(me, "manage_products") && (
          <Button size="sm" asChild>
            <Link to="/admin/products/new">
              <Plus aria-hidden className="size-4" />
              Yeni ürün
            </Link>
          </Button>
        )}
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={search}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        emptyMessage="Ürün bulunamadı."
        toolbar={
          <>
            <Select
              aria-label="Duruma göre filtrele"
              className="w-40"
              value={search.status ?? ""}
              onChange={(e) =>
                onSearchChange({
                  status: (e.target.value || undefined) as ProductStatus | undefined,
                  page: 1,
                })
              }
            >
              <option value="">Tüm durumlar</option>
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="archived">Arşivlenmiş</option>
            </Select>
            <Select
              aria-label="Kategoriye göre filtrele"
              className="w-56"
              value={search.category_id ?? ""}
              onChange={(e) =>
                onSearchChange({
                  category_id: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">Tüm kategoriler</option>
              {categoryLabels(categories).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </>
        }
      />
    </div>
  );
}
