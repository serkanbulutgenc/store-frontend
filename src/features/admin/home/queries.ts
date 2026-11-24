import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { type HomeData, homeKey } from "../returns/queries";

/** The server answers a layout change with the whole page, so the cache is set, not refetched. */
function useLayoutMutation<V>(fn: (v: V) => Promise<HomeData | undefined>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (data) qc.setQueryData(homeKey, data);
    },
  });
}

export const useSaveHomeLayout = () =>
  useLayoutMutation(
    async (widgets: string[]) =>
      (await adminApi.PUT("/api/admin/home/layout", { body: { widgets } })).data,
  );

export const useResetHomeLayout = () =>
  useLayoutMutation(async (_: undefined) => (await adminApi.DELETE("/api/admin/home/layout")).data);
