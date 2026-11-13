import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { components } from "../../../../api/specs/openapi-admin";
import { keys } from "./queries";

export type AttributeOut = components["schemas"]["AttributeOut"];
export type AttributeValueIO = components["schemas"]["AttributeValueIO"];

export const attributesQuery = (classId: number) =>
  queryOptions({
    queryKey: [...keys.refs, "attributes", classId] as const,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/product-classes/{class_id}/attributes", {
          params: { path: { class_id: classId } },
        })
      ).data as AttributeOut[],
  });

/** Definitions, the product lists that embed attribute values, and the storefront. */
function useDefinitionMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        [keys.refs, keys.products].map((queryKey) => qc.invalidateQueries({ queryKey })),
      );
    },
  });
}

export const useCreateAttribute = (classId: number) =>
  useDefinitionMutation(async (body: components["schemas"]["AttributeIn"]) =>
    adminApi.POST("/api/admin/product-classes/{class_id}/attributes", {
      params: { path: { class_id: classId } },
      body,
    }),
  );

export const useUpdateAttribute = () =>
  useDefinitionMutation(async (v: { id: number; body: components["schemas"]["AttributePatch"] }) =>
    adminApi.PATCH("/api/admin/attributes/{attribute_id}", {
      params: { path: { attribute_id: v.id } },
      body: v.body,
    }),
  );

export const useAddOption = () =>
  useDefinitionMutation(async (v: { attributeId: number; label: string }) =>
    adminApi.POST("/api/admin/attributes/{attribute_id}/options", {
      params: { path: { attribute_id: v.attributeId } },
      body: { label: v.label },
    }),
  );

export const useRenameOption = () =>
  useDefinitionMutation(async (v: { id: number; label: string }) =>
    adminApi.PATCH("/api/admin/attribute-options/{option_id}", {
      params: { path: { option_id: v.id } },
      body: { label: v.label },
    }),
  );

/**
 * Deleting something that Products use asks the server first. When the server answers
 * `confirmation_required`, `ask` shows its message (it names how many Products lose a
 * value); on a yes the delete is repeated with `confirm`.
 */
export async function deleteWithConfirmation(
  run: (confirm: boolean) => Promise<unknown>,
  ask: (message: string) => boolean,
): Promise<boolean> {
  try {
    await run(false);
    return true;
  } catch (e) {
    if (!(e instanceof ApiError) || e.code !== "confirmation_required") throw e;
    if (!ask(e.message)) return false;
    await run(true);
    return true;
  }
}

export const useDeleteAttribute = () =>
  useDefinitionMutation(async (v: { id: number; ask: (message: string) => boolean }) =>
    deleteWithConfirmation(
      (confirm) =>
        adminApi.DELETE("/api/admin/attributes/{attribute_id}", {
          params: { path: { attribute_id: v.id }, query: { confirm } },
        }),
      v.ask,
    ),
  );

export const useDeleteOption = () =>
  useDefinitionMutation(async (v: { id: number; ask: (message: string) => boolean }) =>
    deleteWithConfirmation(
      (confirm) =>
        adminApi.DELETE("/api/admin/attribute-options/{option_id}", {
          params: { path: { option_id: v.id }, query: { confirm } },
        }),
      v.ask,
    ),
  );

export const useSetProductAttributes = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: AttributeValueIO[]) =>
      (
        await adminApi.PUT("/api/admin/products/{product_id}/attributes", {
          params: { path: { product_id: productId } },
          body: { values },
        })
      ).data as AttributeValueIO[],
    onSuccess: async () => {
      await Promise.all(
        [keys.product(productId), keys.products].map((queryKey) =>
          qc.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
};
