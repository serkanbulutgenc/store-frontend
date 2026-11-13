import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";

export type AdminReview = components["schemas"]["AdminReviewOut"];
export type PagedAdminReviews = components["schemas"]["PagedAdminReviewOut"];

export type ReviewsSearch = { status: "pending" | "published" | "rejected"; page: number };

const ROOT = ["admin", "reviews"] as const;

export const adminReviewsQuery = (s: ReviewsSearch) =>
  queryOptions({
    queryKey: [...ROOT, s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/reviews", {
          params: { query: { status: s.status, page: s.page, page_size: 10 } },
        })
      ).data as PagedAdminReviews,
  });

function useReviewAction(run: (id: number) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ROOT }),
        qc.invalidateQueries({ queryKey: ["store", "reviews"] }),
        qc.invalidateQueries({ queryKey: ["store", "catalog"] }),
      ]),
  });
}

export const useApproveReview = () =>
  useReviewAction((id) =>
    adminApi.POST("/api/admin/reviews/{review_id}/approve", {
      params: { path: { review_id: id } },
    }),
  );

export const useRejectReview = () =>
  useReviewAction((id) =>
    adminApi.POST("/api/admin/reviews/{review_id}/reject", {
      params: { path: { review_id: id } },
    }),
  );

export const useDeleteAdminReview = () =>
  useReviewAction((id) =>
    adminApi.DELETE("/api/admin/reviews/{review_id}", { params: { path: { review_id: id } } }),
  );
