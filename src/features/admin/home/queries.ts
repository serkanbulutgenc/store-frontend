import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { type HomeData, homeKey } from "../returns/queries";

export type LayoutChange = {
  /** The Widgets that are on, in order. */
  widgets: string[];
  /** Which of them are folded; leave it out to keep what was folded. */
  collapsed?: string[];
};

/** What the page shows once `change` has been saved, when that needs no new data: only Widgets
 * whose lists are already here. Turning a Widget on needs the server's answer, so it is not
 * guessed. */
export function predict(page: HomeData, change: LayoutChange): HomeData | null {
  const known = change.widgets.every((k) => k in page && page[k as keyof HomeData] != null);
  if (!known) return null;
  const collapsed = (change.collapsed ?? page.collapsed).filter((k) => change.widgets.includes(k));
  return { ...page, layout: change.widgets, collapsed, is_default: false };
}

/** Saves the layout. The server answers with the whole page, which replaces the cache. A change
 * that needs no new data (order, folding, turning a Widget off) shows at once and is put back if
 * the save fails. Changes are sent one at a time, so a quick second drag cannot overtake the
 * first. */
export function useSaveHomeLayout() {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: "home-layout" },
    mutationFn: async (change: LayoutChange) =>
      (await adminApi.PUT("/api/admin/home/layout", { body: change })).data,
    onMutate: async (change) => {
      await qc.cancelQueries({ queryKey: homeKey });
      const before = qc.getQueryData<HomeData>(homeKey);
      const next = before && predict(before, change);
      if (next) qc.setQueryData(homeKey, next);
      return { before };
    },
    onError: (_e, _change, ctx) => {
      if (ctx?.before) qc.setQueryData(homeKey, ctx.before);
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(homeKey, data);
    },
  });
}

export function useResetHomeLayout() {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: "home-layout" },
    mutationFn: async (_: undefined) => (await adminApi.DELETE("/api/admin/home/layout")).data,
    onSuccess: (data) => {
      if (data) qc.setQueryData(homeKey, data);
    },
  });
}
