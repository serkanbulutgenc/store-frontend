import { queryOptions } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type Banners = components["schemas"]["BannersOut"];
export type PictureBanner = components["schemas"]["PictureBannerOut"];
export type Announcement = components["schemas"]["AnnouncementOut"];

export const NO_BANNERS: Banners = {
  announcement: [],
  home_hero: [],
  home_mid: [],
  category_top: [],
};

/** Active Banners per slot. `category_top` is only filled when a Category slug is given. */
export const bannersQuery = (category?: string) =>
  queryOptions({
    queryKey: ["store", "banners", category ?? null],
    staleTime: 60_000,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/banners", {
          params: { query: category ? { category } : {} },
        })
      ).data as Banners,
  });
