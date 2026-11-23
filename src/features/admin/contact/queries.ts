import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, storeApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ContactSearch } from "./search";

export type ThreadSummary = components["schemas"]["ThreadSummary"];
export type PagedThreads = components["schemas"]["PagedThreadSummary"];
export type ThreadOut = components["schemas"]["ThreadOut"];
export type ReplyOut = components["schemas"]["ReplyOut"];
export type CategoryRow = components["schemas"]["ContactCategoryRow"];

export const contactKeys = { all: ["admin", "contact"] as const };

/** One page of threads, latest activity first. `meId` is what "assigned to me" asks the API for. */
export const threadsQuery = (s: ContactSearch, meId: number) =>
  queryOptions({
    queryKey: [...contactKeys.all, "list", s, meId],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/contact-threads", {
          params: {
            query: {
              q: s.q,
              status: s.status,
              category_id: s.category,
              assignee_id: s.mine ? meId : undefined,
              has_pending_reply: s.pending ? true : undefined,
              date_from: s.from,
              date_to: s.to,
              page: s.page,
              page_size: s.size,
            },
          },
        })
      ).data as PagedThreads,
  });

/** How many threads have a reply waiting for the Owner; undefined until known. For the nav badge. */
export const waitingRepliesQuery = () =>
  queryOptions({
    queryKey: [...contactKeys.all, "waiting"],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/contact-threads", {
          params: { query: { has_pending_reply: true, page: 1, page_size: 1 } },
        })
      ).data?.total ?? 0,
  });

export const threadQuery = (id: number) =>
  queryOptions({
    queryKey: [...contactKeys.all, "one", id],
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/contact-threads/{thread_id}", {
          params: { path: { thread_id: id } },
        })
      ).data as ThreadOut,
  });

/** Every category, inactive ones too. Owner only. */
export const categoriesQuery = () =>
  queryOptions({
    queryKey: [...contactKeys.all, "categories"],
    queryFn: async () =>
      (await adminApi.GET("/api/admin/contact-categories")).data as CategoryRow[],
  });

/** Runs one change, then refreshes everything the inbox shows. */
export function useContactMutation<T, R = unknown>(run: (input: T) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => qc.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

const reply = (id: number) => ({ params: { path: { reply_id: id } } });
const thread = (id: number) => ({ params: { path: { thread_id: id } } });

export const contactCalls = {
  setStatus: (id: number, status: string) =>
    adminApi.PATCH("/api/admin/contact-threads/{thread_id}", { ...thread(id), body: { status } }),
  /** `null` clears the assignee. */
  assign: (id: number, assigneeId: number | null) =>
    adminApi.PATCH("/api/admin/contact-threads/{thread_id}", {
      ...thread(id),
      body: { assignee_id: assigneeId },
    }),
  write: (id: number, body: string) =>
    adminApi.POST("/api/admin/contact-threads/{thread_id}/replies", {
      ...thread(id),
      body: { body },
    }),
  edit: (id: number, body: string) =>
    adminApi.PATCH("/api/admin/contact-replies/{reply_id}", { ...reply(id), body: { body } }),
  submit: (id: number) => adminApi.POST("/api/admin/contact-replies/{reply_id}/submit", reply(id)),
  /** `body` is the Owner's edited text; leave it out to send the draft as written. */
  approve: (id: number, body?: string) =>
    adminApi.POST("/api/admin/contact-replies/{reply_id}/approve", {
      ...reply(id),
      body: { body: body ?? null },
    }),
  reject: (id: number, note: string) =>
    adminApi.POST("/api/admin/contact-replies/{reply_id}/reject", {
      ...reply(id),
      body: { note: note.trim() },
    }),
  addCategory: (name: string) => adminApi.POST("/api/admin/contact-categories", { body: { name } }),
  patchCategory: (id: number, patch: { name?: string; is_active?: boolean; position?: number }) =>
    adminApi.PATCH("/api/admin/contact-categories/{category_id}", {
      params: { path: { category_id: id } },
      body: patch,
    }),
  removeCategory: (id: number) =>
    adminApi.DELETE("/api/admin/contact-categories/{category_id}", {
      params: { path: { category_id: id } },
    }),
};

/**
 * The categories to filter by. The Owner's list is Owner-only, so Staff get the active ones
 * from the public contact form's list; both give an id and a name.
 */
export const filterCategoriesQuery = (owner: boolean) =>
  queryOptions({
    queryKey: [...contactKeys.all, "filter-categories", owner],
    queryFn: async (): Promise<{ id: number; name: string }[]> =>
      owner
        ? ((await adminApi.GET("/api/admin/contact-categories")).data ?? [])
        : ((await storeApi.GET("/api/store/contact/categories")).data ?? []),
  });
