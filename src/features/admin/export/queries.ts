import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";

/** Fetches the accountant CSV and hands it to the browser as a file download. */
export const useDownloadAccountantCsv = () =>
  useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const { data } = await adminApi.GET("/api/admin/exports/accountant.csv", {
        params: { query: { date_from: from, date_to: to } },
        parseAs: "blob",
      });
      const url = URL.createObjectURL(data as unknown as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `muhasebe-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
