import { queryOptions, useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import { csvDownload, reportQuery } from "./rules";
import type { ReportSearch } from "./search";

export type SalesReport = components["schemas"]["SalesReportOut"];
export type ProductsReport = components["schemas"]["ProductsReportOut"];

export const reportKeys = { all: ["admin", "reports"] as const };

/** The Sales report for what the URL asks. The API caches it for a minute, so a refetch is cheap. */
export const salesReportQuery = (s: ReportSearch) =>
  queryOptions({
    queryKey: [...reportKeys.all, "sales", reportQuery(s)],
    queryFn: async () => {
      const { data, error } = await adminApi.GET("/api/admin/reports/sales", {
        params: { query: reportQuery(s) },
      });
      if (!data) throw new Error(JSON.stringify(error));
      return data as SalesReport;
    },
  });

/** The Products ranking for what the URL asks. */
export const productsReportQuery = (s: ReportSearch) =>
  queryOptions({
    queryKey: [...reportKeys.all, "products", reportQuery(s)],
    queryFn: async () => {
      const { data, error } = await adminApi.GET("/api/admin/reports/products", {
        params: { query: reportQuery(s) },
      });
      if (!data) throw new Error(JSON.stringify(error));
      return data as ProductsReport;
    },
  });

/** Fetches the CSV of the report on screen and hands it to the browser as a file, as the accountant export does. */
export const useDownloadReportCsv = () =>
  useMutation({
    mutationFn: async ({
      search,
      range,
    }: {
      search: ReportSearch;
      range: { start: string; end: string };
    }) => {
      const { path, query, filename } = csvDownload(search, range);
      const { data, response } = await adminApi.GET(path, {
        params: { query: query },
        parseAs: "blob",
      });
      if (!response.ok) throw new Error("CSV indirilemedi.");
      const url = URL.createObjectURL(data as unknown as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
