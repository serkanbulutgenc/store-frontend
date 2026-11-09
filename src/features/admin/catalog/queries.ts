import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/clients";
import type { components } from "../../../../api/specs/openapi-admin";
import type { ListSearch } from "../data-table/search";
import type { ProductBody } from "./schemas";

export type ProductStatus = components["schemas"]["ProductStatus"];
export type ProductOut = components["schemas"]["ProductOut"];
export type ProductListOut = components["schemas"]["ProductListOut"];
export type VariantOut = components["schemas"]["VariantOut"];
export type LowStockOut = components["schemas"]["LowStockOut"];
export type CategoryOut = components["schemas"]["CategoryOut"];
export type ColourOut = components["schemas"]["ColourOut"];
export type SupplierOut = components["schemas"]["SupplierOut"];
export type NamedOut = components["schemas"]["NamedOut"];

export type ProductsSearch = ListSearch & { status?: ProductStatus; category_id?: number };

const ROOT = ["admin"] as const;
export const keys = {
  products: [...ROOT, "products"] as const,
  product: (id: number) => [...ROOT, "products", "detail", id] as const,
  stock: [...ROOT, "stock"] as const,
  images: (id: number) => [...ROOT, "products", "detail", id, "images"] as const,
  refs: [...ROOT, "refs"] as const,
};

export const productsQuery = (s: ProductsSearch) =>
  queryOptions({
    queryKey: [...keys.products, s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/products", {
          params: {
            query: {
              q: s.q,
              status: s.status,
              category_id: s.category_id,
              ordering: s.ordering,
              page: s.page,
              page_size: s.size,
            },
          },
        })
      ).data as components["schemas"]["PagedProductListOut"],
  });

export const productQuery = (id: number) =>
  queryOptions({
    queryKey: keys.product(id),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/products/{product_id}", {
          params: { path: { product_id: id } },
        })
      ).data as ProductOut,
  });

export const lowStockQuery = (s: Pick<ListSearch, "page" | "size">) =>
  queryOptions({
    queryKey: [...keys.stock, "low", s],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/stock/low", {
          params: { query: { page: s.page, page_size: s.size } },
        })
      ).data as components["schemas"]["PagedLowStockOut"],
  });

const ref = <const N extends string, T>(name: N, load: () => Promise<T>) =>
  queryOptions({ queryKey: [...keys.refs, name] as const, queryFn: load, staleTime: 5 * 60_000 });

export const categoriesQuery = ref(
  "categories",
  async () => (await adminApi.GET("/api/admin/categories")).data as CategoryOut[],
);
export const brandsQuery = ref(
  "brands",
  async () => (await adminApi.GET("/api/admin/brands")).data as NamedOut[],
);
export const coloursQuery = ref(
  "colours",
  async () => (await adminApi.GET("/api/admin/colours")).data as ColourOut[],
);
export const suppliersQuery = ref(
  "suppliers",
  async () => (await adminApi.GET("/api/admin/suppliers")).data as SupplierOut[],
);
export const productClassesQuery = ref(
  "product-classes",
  async () =>
    (await adminApi.GET("/api/admin/product-classes"))
      .data as components["schemas"]["ProductClassOut"][],
);

/** Mutation that refreshes whatever the change can affect. */
function useInvalidating<V, R>(
  fn: (v: V) => Promise<R>,
  extra: readonly (readonly unknown[])[] = [],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        [keys.products, keys.stock, ...extra].map((queryKey) => qc.invalidateQueries({ queryKey })),
      );
    },
  });
}

export const useCreateProduct = () =>
  useInvalidating(
    async (body: ProductBody) =>
      (
        await adminApi.POST("/api/admin/products", {
          body: body as components["schemas"]["ProductIn"],
        })
      ).data as ProductOut,
  );

export const useUpdateProduct = (id: number) =>
  useInvalidating(
    async (body: Partial<ProductBody>) =>
      (
        await adminApi.PATCH("/api/admin/products/{product_id}", {
          params: { path: { product_id: id } },
          body: body as components["schemas"]["ProductPatch"],
        })
      ).data as ProductOut,
  );

export const useSetStatus = (id: number) =>
  useInvalidating(
    async (status: ProductStatus) =>
      (
        await adminApi.POST("/api/admin/products/{product_id}/status", {
          params: { path: { product_id: id } },
          body: { status },
        })
      ).data as ProductOut,
  );

export const useCreateVariant = (productId: number) =>
  useInvalidating(
    async (body: components["schemas"]["VariantIn"]) =>
      (
        await adminApi.POST("/api/admin/products/{product_id}/variants", {
          params: { path: { product_id: productId } },
          body,
        })
      ).data as VariantOut,
  );

export const useUpdateVariant = () =>
  useInvalidating(
    async (v: { id: number; body: components["schemas"]["VariantPatch"] }) =>
      (
        await adminApi.PATCH("/api/admin/variants/{variant_id}", {
          params: { path: { variant_id: v.id } },
          body: v.body,
        })
      ).data as VariantOut,
  );

export const useAdjustStock = () =>
  useInvalidating(
    async (v: { id: number; delta: number; reason: string }) =>
      (
        await adminApi.POST("/api/admin/variants/{variant_id}/stock-adjustments", {
          params: { path: { variant_id: v.id } },
          body: { delta: v.delta, reason: v.reason },
        })
      ).data as VariantOut,
  );

export type ProductImageOut = components["schemas"]["ProductImageOut"];

export const imagesQuery = (productId: number) =>
  queryOptions({
    queryKey: keys.images(productId),
    // While any image is still being processed, poll until its derivatives exist.
    refetchInterval: (q) => (q.state.data?.some((i) => i.status === "processing") ? 2500 : false),
    queryFn: async () =>
      (
        await adminApi.GET("/api/admin/products/{product_id}/images", {
          params: { path: { product_id: productId } },
        })
      ).data as ProductImageOut[],
  });

function useImageMutation<V, R>(productId: number, fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        [keys.images(productId), keys.product(productId), keys.products].map((queryKey) =>
          qc.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}

export const useUpdateImage = (productId: number) =>
  useImageMutation(
    productId,
    async (v: { id: number; body: components["schemas"]["ProductImagePatch"] }) =>
      (
        await adminApi.PATCH("/api/admin/images/{image_id}", {
          params: { path: { image_id: v.id } },
          body: v.body,
        })
      ).data as ProductImageOut,
  );

export const useDeleteImage = (productId: number) =>
  useImageMutation(productId, async (id: number) => {
    await adminApi.DELETE("/api/admin/images/{image_id}", {
      params: { path: { image_id: id } },
    });
  });

export const useReorderImages = (productId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) =>
      (
        await adminApi.POST("/api/admin/products/{product_id}/images/order", {
          params: { path: { product_id: productId } },
          body: { ids },
        })
      ).data as ProductImageOut[],
    // Show the new order straight away; the response (or a refetch on error) settles it.
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: keys.images(productId) });
      const prev = qc.getQueryData<ProductImageOut[]>(keys.images(productId));
      if (prev)
        qc.setQueryData(
          keys.images(productId),
          ids.map((id) => prev.find((i) => i.id === id)).filter(Boolean),
        );
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.images(productId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.images(productId) }),
  });
};
