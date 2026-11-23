import { queryOptions, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";

export type ApprovalQueue = components["schemas"]["QueueOut"];
export type ApprovalDetail = components["schemas"]["QueueDetailOut"];

export const approvalKeys = { all: ["admin", "approvals"] as const };

/** Everything waiting for the Owner, oldest first, with the total. */
export const approvalsQuery = () =>
  queryOptions({
    queryKey: [...approvalKeys.all, "list"],
    queryFn: async () => {
      const { data, error } = await adminApi.GET("/api/admin/approvals");
      if (!data) throw new Error(JSON.stringify(error));
      return data as ApprovalQueue;
    },
  });

/** One waiting item with what differs from the live version. */
export const approvalDetailQuery = (type: string, id: number) =>
  queryOptions({
    queryKey: [...approvalKeys.all, "detail", type, id],
    queryFn: async () => {
      const { data, error } = await adminApi.GET("/api/admin/approvals/{kind}/{item_id}", {
        params: { path: { kind: type, item_id: id } },
      });
      if (!data) throw new Error(JSON.stringify(error));
      return data as ApprovalDetail;
    },
  });

/** How many items wait for the Owner; undefined until known. For the nav badge. */
export function useApprovalCount(enabled: boolean): number | undefined {
  return useQuery({ ...approvalsQuery(), enabled, refetchOnWindowFocus: true }).data?.count;
}

export type Decision = "approve" | "reject";

/** Approves or rejects one waiting item; the API answers with what still waits. */
export async function decide(
  type: string,
  id: number,
  decision: Decision,
  reason = "",
): Promise<number> {
  const path = { kind: type, item_id: id };
  if (decision === "approve") {
    const { data } = await adminApi.POST("/api/admin/approvals/{kind}/{item_id}/approve", {
      params: { path },
    });
    return data?.count ?? 0;
  }
  const { data } = await adminApi.POST("/api/admin/approvals/{kind}/{item_id}/reject", {
    params: { path },
    body: { reason: reason.trim() },
  });
  return data?.count ?? 0;
}
