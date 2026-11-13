import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/lib/api/clients";
import type { components } from "../../../api/specs/openapi-store";

export type ReviewPage = components["schemas"]["ReviewPageOut"];
export type ReviewItem = components["schemas"]["ReviewOut"];
export type MyReviewState = components["schemas"]["MyReviewStateOut"];

const ROOT = ["store", "reviews"] as const;

export const reviewsQuery = (slug: string, page: number) =>
  queryOptions({
    queryKey: [...ROOT, slug, "list", page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/products/{slug}/reviews", {
          params: { path: { slug }, query: { page } },
        })
      ).data as ReviewPage,
  });

export const myReviewQuery = (slug: string) =>
  queryOptions({
    queryKey: [...ROOT, slug, "mine"],
    queryFn: async () =>
      (
        await storeApi.GET("/api/store/products/{slug}/my-review", {
          params: { path: { slug } },
        })
      ).data as MyReviewState,
  });

function useReviewMutation<V>(slug: string, run: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: [...ROOT, slug] }),
        // Cards and the product page carry the average and count.
        qc.invalidateQueries({ queryKey: ["store", "catalog"] }),
      ]),
  });
}

export const useSaveReview = (slug: string, productId: number) =>
  useReviewMutation(slug, async (v: { stars: number; body: string }) =>
    storeApi.PUT("/api/store/account/reviews/{product_id}", {
      params: { path: { product_id: productId } },
      body: v,
    }),
  );

export const useDeleteReview = (slug: string, productId: number) =>
  useReviewMutation(slug, async () =>
    storeApi.DELETE("/api/store/account/reviews/{product_id}", {
      params: { path: { product_id: productId } },
    }),
  );
