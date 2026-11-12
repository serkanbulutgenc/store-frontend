import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { keys } from "../catalog/queries";
import type { ImportPlan } from "./rules";

function formOf(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Dry run: the API writes nothing. Row errors come back in the plan, not as a failure. */
export const usePreviewImport = () =>
  useMutation({
    mutationFn: async (file: File): Promise<ImportPlan> => {
      const { data } = await adminApi.POST("/api/admin/catalog/import/preview", {
        body: { file: file as unknown as string },
        bodySerializer: () => formOf(file),
      });
      return data as ImportPlan;
    },
  });

/** Applies the same file, all rows or none; a 422 lists every row error. */
export const useConfirmImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ImportPlan> => {
      const { data } = await adminApi.POST("/api/admin/catalog/import/confirm", {
        body: { file: file as unknown as string },
        bodySerializer: () => formOf(file),
      });
      return data as ImportPlan;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.products });
      void queryClient.invalidateQueries({ queryKey: keys.stock });
      void queryClient.invalidateQueries({ queryKey: keys.refs });
    },
  });
};
