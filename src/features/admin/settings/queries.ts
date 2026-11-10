import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";

export type SettingsOut = components["schemas"]["SettingsOut"];
const key = ["admin", "settings"] as const;

export const settingsQuery = queryOptions({
  queryKey: key,
  queryFn: async () => (await adminApi.GET("/api/admin/settings")).data as SettingsOut,
});

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["SettingsPatch"]) =>
      (await adminApi.PATCH("/api/admin/settings", { body })).data as SettingsOut,
    onSuccess: (data) => qc.setQueryData(key, data),
  });
};
