import { type TableOptions, useTable } from "@tanstack/react-table";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type Column, type features, serverTableOptions } from "./data-table";
import type { ListSearch } from "./search";

type Row = { id: number; name: string };
const columns: Column<Row>[] = [{ accessorKey: "name", header: "Ad" }];

type TableInstance = ReturnType<typeof useTable<typeof features, Row>>;

function Probe({
  options,
  out,
}: {
  options: TableOptions<typeof features, Row>;
  out: { table?: TableInstance };
}) {
  out.table = useTable(options);
  return null;
}

/** Build the table once in a render pass and hand back the instance. */
function build(search: ListSearch, total: number, onSearchChange = vi.fn()) {
  const out: { table?: TableInstance } = {};
  const options = serverTableOptions<Row>({
    data: [{ id: 1, name: "a" }],
    columns,
    total,
    search,
    onSearchChange,
  });
  renderToString(<Probe options={options} out={out} />);
  return { table: out.table as TableInstance, onSearchChange };
}

describe("serverTableOptions (Table v9 manual mode)", () => {
  it("derives paging and sorting state from the URL search, not from the data", () => {
    const { table } = build({ page: 3, size: 10, ordering: "-name" }, 95);
    expect(table.state.pagination).toEqual({ pageIndex: 2, pageSize: 10 });
    expect(table.state.sorting).toEqual([{ id: "name", desc: true }]);
    expect(table.getPageCount()).toBe(10);
    // Only the one row the server returned is in the model: no client-side slicing.
    expect(table.getRowModel().rows).toHaveLength(1);
  });

  it("turns next page into a search patch", () => {
    const { table, onSearchChange } = build({ page: 1, size: 25 }, 100);
    table.nextPage();
    expect(onSearchChange).toHaveBeenCalledWith({ page: 2, size: 25 });
  });

  it("resets to page 1 on a size change", () => {
    const { table, onSearchChange } = build({ page: 4, size: 25 }, 500);
    table.setPageSize(50);
    expect(onSearchChange).toHaveBeenCalledWith({ page: 1, size: 50 });
  });

  it("turns a sort click into ordering and resets the page", () => {
    const { table, onSearchChange } = build({ page: 4, size: 25 }, 500);
    table.setSorting([{ id: "name", desc: true }]);
    expect(onSearchChange).toHaveBeenCalledWith({ ordering: "-name", page: 1 });
  });
});
