import {
  type ColumnDef,
  createColumnHelper,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  type TableOptions,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ListSearch,
  orderingToSorting,
  PAGE_SIZES,
  paginationToSearch,
  sortingToOrdering,
} from "./search";

export const features = tableFeatures({ rowPaginationFeature, rowSortingFeature });
export const columnHelper = <T extends RowData>() => createColumnHelper<typeof features, T>();
// A table mixes columns with different cell value types, so the value type is `any` here.
// biome-ignore lint/suspicious/noExplicitAny: heterogeneous column values
export type Column<T extends RowData> = ColumnDef<typeof features, T, any>;

/**
 * Table v9 in manual (server-side) mode. The URL search params are the only source of
 * truth: state is derived from `search`, and every change goes through `onSearchChange`,
 * which the route turns into a navigation. Exported separately so it can be tested
 * without a DOM.
 */
export function serverTableOptions<T extends RowData>(args: {
  data: T[];
  columns: Column<T>[];
  total: number;
  search: ListSearch;
  onSearchChange: (patch: Partial<ListSearch>) => void;
}): TableOptions<typeof features, T> {
  const { search, onSearchChange } = args;
  const pagination = { pageIndex: search.page - 1, pageSize: search.size };
  const sorting = orderingToSorting(search.ordering);
  return {
    features,
    data: args.data,
    columns: args.columns,
    rowCount: args.total,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: true,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      // A size change goes back to page 1; otherwise the page may no longer exist.
      onSearchChange(
        next.pageSize !== pagination.pageSize
          ? { page: 1, size: next.pageSize as ListSearch["size"] }
          : (paginationToSearch(next) as Pick<ListSearch, "page" | "size">),
      );
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSearchChange({ ordering: sortingToOrdering(next), page: 1 });
    },
  } as TableOptions<typeof features, T>;
}

export type DataTableProps<T extends RowData> = {
  data: T[];
  columns: Column<T>[];
  total: number;
  search: ListSearch;
  onSearchChange: (patch: Partial<ListSearch>) => void;
  isFetching?: boolean;
  emptyMessage?: string;
  /** Extra filter controls rendered next to the search box. */
  toolbar?: React.ReactNode;
  /** Show the `q` search box. Off for lists whose endpoint has no search. */
  searchable?: boolean;
};

export function DataTable<T extends RowData>({
  isFetching,
  searchable = true,
  emptyMessage = "Kayıt bulunamadı.",
  toolbar,
  ...args
}: DataTableProps<T>) {
  const table = useTable(serverTableOptions(args));
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="space-y-2" aria-busy={isFetching}>
      <div className="flex items-center gap-2">
        {searchable && (
          <Input
            key={args.search.q ?? ""}
            type="search"
            placeholder="Ara…"
            aria-label="Ara"
            className="max-w-64"
            defaultValue={args.search.q ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                args.onSearchChange({ q: e.currentTarget.value || undefined, page: 1 });
            }}
          />
        )}
        {toolbar}
      </div>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted ? (sorted === "desc" ? "descending" : "ascending") : undefined
                      }
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" && <ArrowUp className="size-3" />}
                          {sorted === "desc" && <ArrowDown className="size-3" />}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={args.columns.length}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{args.total} kayıt</span>
        <div className="flex items-center gap-2">
          <select
            aria-label="Sayfa boyutu"
            className="h-8 rounded-md border border-border bg-card px-1"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / sayfa
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Önceki
          </Button>
          <span>
            {pageIndex + 1} / {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
