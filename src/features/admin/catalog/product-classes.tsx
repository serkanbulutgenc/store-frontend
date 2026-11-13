import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api/clients";
import { can, type Me } from "@/lib/api/me";
import { ReferenceScreen } from "./components/reference-screen";
import {
  CLASS_SCHEME_OPTIONS,
  classFormSchema,
  classLocks,
  type ProductClassForm,
  schemeLabel,
} from "./product-class-form";
import { keys, productClassesQuery } from "./queries";

export function ProductClassesScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(productClassesQuery);
  const qc = useQueryClient();
  // Product editors, imports and the shipping screen read classes too.
  const refresh = () =>
    Promise.all(
      [keys.refs, keys.products, ["admin", "shipping"]].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
  const save = useMutation({
    mutationFn: async ({ values, id }: { values: ProductClassForm; id?: number }) => {
      const body = {
        name: values.name,
        size_scheme: values.size_scheme,
        default_kdv_rate: values.default_kdv_rate,
        is_hygiene: values.is_hygiene === "true",
        default_desi: Number(values.default_desi),
      };
      return id === undefined
        ? adminApi.POST("/api/admin/product-classes", { body })
        : adminApi.PATCH("/api/admin/product-classes/{class_id}", {
            params: { path: { class_id: id } },
            body,
          });
    },
    onSuccess: refresh,
  }).mutateAsync;
  const remove = useMutation({
    mutationFn: async (id: number) =>
      adminApi.DELETE("/api/admin/product-classes/{class_id}", {
        params: { path: { class_id: id } },
      }),
    onSuccess: refresh,
  }).mutateAsync;

  return (
    <ReferenceScreen
      title="Ürün sınıfları"
      singular="sınıf"
      rows={data}
      canManage={can(me, "manage_product_classes")}
      columns={[
        { header: "Sınıf", cell: (r) => r.name },
        { header: "Beden düzeni", cell: (r) => schemeLabel(r.size_scheme) },
        { header: "KDV", cell: (r) => `%${Number(r.default_kdv_rate)}` },
        { header: "Hijyenik", cell: (r) => (r.is_hygiene ? "Evet" : "Hayır") },
        { header: "Desi", cell: (r) => r.default_desi },
        { header: "Ürün", cell: (r) => r.product_count ?? 0 },
      ]}
      fields={[
        { name: "name", label: "Ad" },
        {
          name: "size_scheme",
          label: "Beden düzeni",
          kind: "select",
          options: CLASS_SCHEME_OPTIONS,
        },
        {
          name: "default_kdv_rate",
          label: "KDV oranı (%)",
          hint: "Yeni ürünler bu oranı kullanır; mevcut ürünler eski oranında kalır.",
        },
        {
          name: "is_hygiene",
          label: "Hijyenik ürün",
          kind: "select",
          hint: "Açıldıktan sonra iade edilemez.",
          options: [
            { value: "false", label: "Hayır" },
            { value: "true", label: "Evet (iade edilemez)" },
          ],
        },
        { name: "default_desi", label: "Varsayılan desi" },
      ]}
      schema={classFormSchema as z.ZodType<Record<string, string>, Record<string, string>>}
      defaults={(r) => ({
        name: r?.name ?? "",
        size_scheme: r?.size_scheme ?? "letters",
        default_kdv_rate: r ? String(Number(r.default_kdv_rate)) : "20",
        is_hygiene: String(r?.is_hygiene ?? false),
        default_desi: String(r?.default_desi ?? 1),
      })}
      save={(values, row) => save({ values: values as ProductClassForm, id: row?.id })}
      rowActions={(r) => (
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/product-classes/$classId" params={{ classId: String(r.id) }}>
            Özellikler
          </Link>
        </Button>
      )}
      lockedFields={classLocks}
      remove={{
        blocked: (r) =>
          r.product_count ? `Bu sınıfta ${r.product_count} ürün var; silinemez.` : undefined,
        confirm: (r) => `"${r.name}" sınıfı silinsin mi? Bu işlem geri alınamaz.`,
        run: (r) => remove(r.id),
      }}
    />
  );
}
