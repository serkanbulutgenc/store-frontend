import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { adminApi } from "@/lib/api/clients";
import { can, type Me } from "@/lib/api/me";
import { ReferenceScreen } from "./components/reference-screen";
import { categoryLabels } from "./labels";
import {
  brandsQuery,
  type ColourOut,
  categoriesQuery,
  coloursQuery,
  keys,
  type NamedOut,
  type SupplierOut,
  suppliersQuery,
} from "./queries";

const name = z.string().trim().min(1, "Ad gerekli.");
const nameOnly = z.object({ name });

function useSave<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Products and stock rows embed category, brand, supplier and colour names.
    onSuccess: () =>
      Promise.all(
        [keys.refs, keys.products, keys.stock].map((queryKey) =>
          qc.invalidateQueries({ queryKey }),
        ),
      ),
  }).mutateAsync;
}

export function BrandsScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(brandsQuery);
  const save = useSave(async ({ values, row }: { values: { name: string }; row?: NamedOut }) =>
    row
      ? adminApi.PATCH("/api/admin/brands/{brand_id}", {
          params: { path: { brand_id: row.id } },
          body: values,
        })
      : adminApi.POST("/api/admin/brands", { body: values }),
  );
  return (
    <ReferenceScreen
      title="Markalar"
      singular="marka"
      rows={data}
      canManage={can(me, "manage_brands")}
      columns={[{ header: "Ad", cell: (r) => r.name }]}
      fields={[{ name: "name", label: "Ad" }]}
      schema={nameOnly}
      defaults={(r) => ({ name: r?.name ?? "" })}
      save={(values, row) => save({ values: values as { name: string }, row })}
    />
  );
}

export function CategoriesScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(categoriesQuery);
  const labels = new Map(categoryLabels(data).map((c) => [c.id, c.label]));
  const roots = data.filter((c) => c.parent_id == null);
  const save = useSave(
    async ({
      values,
      row,
    }: {
      values: { name: string; parent_id: string };
      row?: (typeof data)[number];
    }) =>
      row
        ? adminApi.PATCH("/api/admin/categories/{category_id}", {
            params: { path: { category_id: row.id } },
            body: { name: values.name },
          })
        : adminApi.POST("/api/admin/categories", {
            body: {
              name: values.name,
              parent_id: values.parent_id ? Number(values.parent_id) : null,
            },
          }),
  );
  return (
    <ReferenceScreen
      title="Kategoriler"
      singular="kategori"
      rows={[...data].sort((a, b) =>
        (labels.get(a.id) ?? "").localeCompare(labels.get(b.id) ?? "", "tr"),
      )}
      canManage={can(me, "manage_categories")}
      columns={[
        { header: "Ad", cell: (r) => labels.get(r.id) ?? r.name },
        { header: "Adres", cell: (r) => <span className="font-mono text-xs">{r.slug}</span> },
      ]}
      fields={[
        { name: "name", label: "Ad" },
        {
          name: "parent_id",
          label: "Üst kategori",
          kind: "select",
          createOnly: true,
          hint: "En fazla iki seviye.",
          options: [
            { value: "", label: "Ana kategori" },
            ...roots.map((c) => ({ value: String(c.id), label: c.name })),
          ],
        },
      ]}
      schema={z.object({ name, parent_id: z.string() })}
      defaults={(r) => ({ name: r?.name ?? "", parent_id: "" })}
      save={(values, row) => save({ values: values as { name: string; parent_id: string }, row })}
    />
  );
}

export function SuppliersScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(suppliersQuery);
  const save = useSave(
    async ({ values, row }: { values: { name: string; code: string }; row?: SupplierOut }) =>
      row
        ? adminApi.PATCH("/api/admin/suppliers/{supplier_id}", {
            params: { path: { supplier_id: row.id } },
            body: values,
          })
        : adminApi.POST("/api/admin/suppliers", { body: values }),
  );
  return (
    <ReferenceScreen
      title="Tedarikçiler"
      singular="tedarikçi"
      rows={data}
      canManage={can(me, "manage_suppliers")}
      columns={[
        { header: "Ad", cell: (r) => r.name },
        { header: "Kod", cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
      ]}
      fields={[
        { name: "name", label: "Ad" },
        { name: "code", label: "Kod" },
      ]}
      schema={z.object({ name, code: z.string().trim().min(1, "Kod gerekli.") })}
      defaults={(r) => ({ name: r?.name ?? "", code: r?.code ?? "" })}
      save={(values, row) => save({ values: values as { name: string; code: string }, row })}
    />
  );
}

export const hexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Renk kodu #RRGGBB biçiminde olmalı.");

export function ColoursScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(coloursQuery);
  const save = useSave(
    async ({
      values,
      row,
    }: {
      values: { name: string; hex_code: string; is_active: string };
      row?: ColourOut;
    }) =>
      row
        ? adminApi.PATCH("/api/admin/colours/{colour_id}", {
            params: { path: { colour_id: row.id } },
            body: {
              name: values.name,
              hex_code: values.hex_code,
              is_active: values.is_active === "true",
            },
          })
        : adminApi.POST("/api/admin/colours", {
            body: { name: values.name, hex_code: values.hex_code },
          }),
  );
  return (
    <ReferenceScreen
      title="Renkler"
      singular="renk"
      rows={data}
      canManage={can(me, "manage_colours")}
      columns={[
        {
          header: "Renk",
          cell: (r) => (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-3 rounded-sm border border-border"
                style={{ background: r.hex_code }}
              />
              {r.name}
            </span>
          ),
        },
        { header: "Kod", cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { header: "Durum", cell: (r) => (r.is_active ? "Aktif" : "Pasif") },
      ]}
      fields={[
        { name: "name", label: "Ad" },
        { name: "hex_code", label: "Renk kodu", hint: "Örn. #6b2d5c" },
        {
          name: "is_active",
          label: "Durum",
          kind: "select",
          editOnly: true,
          options: [
            { value: "true", label: "Aktif" },
            { value: "false", label: "Pasif" },
          ],
        },
      ]}
      schema={z.object({ name, hex_code: hexSchema, is_active: z.string() })}
      defaults={(r) => ({
        name: r?.name ?? "",
        hex_code: r?.hex_code ?? "#",
        is_active: String(r?.is_active ?? true),
      })}
      save={(values, row) =>
        save({ values: values as { name: string; hex_code: string; is_active: string }, row })
      }
    />
  );
}
