import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { ActionDialog } from "../forms/action-dialog";
import { createSchema, editSchema, kindLabel, optionSchema, parseOptions } from "./attribute-form";
import {
  type AttributeOut,
  attributesQuery,
  useAddOption,
  useCreateAttribute,
  useDeleteAttribute,
  useDeleteOption,
  useRenameOption,
  useUpdateAttribute,
} from "./attributes-queries";
import { productClassesQuery } from "./queries";

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; attribute: AttributeOut }
  | { kind: "add-option"; attribute: AttributeOut }
  | { kind: "rename-option"; id: number; label: string }
  | null;

const yesNo = [
  { value: "false", label: "Hayır" },
  { value: "true", label: "Evet" },
];

/** The Owner's attribute definitions for one Product class. */
export function AttributesScreen({ classId }: { classId: number }) {
  const { data: classes } = useSuspenseQuery(productClassesQuery);
  const { data: attributes } = useSuspenseQuery(attributesQuery(classId));
  const productClass = classes.find((c) => c.id === classId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  const create = useCreateAttribute(classId);
  const update = useUpdateAttribute();
  const addOption = useAddOption();
  const renameOption = useRenameOption();
  const deleteAttribute = useDeleteAttribute();
  const deleteOption = useDeleteOption();

  async function guarded(run: () => Promise<unknown>) {
    try {
      await run();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "İşlem tamamlanamadı.");
    }
  }

  const removeAttribute = (a: AttributeOut) =>
    guarded(async () => {
      const done = await deleteAttribute.mutateAsync({
        id: a.id,
        ask: (message) => window.confirm(`${message}\n\n“${a.name}” silinsin mi?`),
      });
      if (done) toast.success("Özellik silindi.");
    });
  const removeOption = (id: number, label: string) =>
    guarded(async () => {
      const done = await deleteOption.mutateAsync({
        id,
        ask: (message) => window.confirm(`${message}\n\n“${label}” silinsin mi?`),
      });
      if (done) toast.success("Seçenek silindi.");
    });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Link to="/admin/product-classes" className="text-primary underline">
            Ürün sınıfları
          </Link>
          <h1 className="text-lg font-semibold">{productClass?.name ?? "Sınıf"} · Özellikler</h1>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setDialog({ kind: "create" })}>
          Yeni özellik
        </Button>
      </div>
      <p className="text-muted-foreground">
        Özellikler ürün sayfasında “Ürün özellikleri” bölümünde görünür. Değerleri personel her
        ürünün “Özellikler” sekmesinde girer; boş değerler gösterilmez. Filtrelenebilir seçenek
        listeleri mağaza listelerinde süzgeç olur.
      </p>

      {attributes.length === 0 && (
        <p className="rounded-md border border-border bg-card p-3 text-muted-foreground">
          Bu sınıf için henüz özellik tanımlanmamış.
        </p>
      )}
      <ul className="space-y-3">
        {attributes.map((a) => (
          <li key={a.id} className="space-y-2 rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{a.name}</h2>
              <Badge tone="neutral">{kindLabel(a.kind)}</Badge>
              {a.kind === "option" && (
                <Badge tone="neutral">{a.is_multiple ? "Çoklu seçim" : "Tek seçim"}</Badge>
              )}
              {a.is_filterable && <Badge tone="good">Filtre</Badge>}
              <span className="text-muted-foreground">{a.product_count} üründe dolu</span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog({ kind: "edit", attribute: a })}
                >
                  Düzenle
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeAttribute(a)}>
                  Sil
                </Button>
              </div>
            </div>
            {a.kind === "option" && (
              <div className="space-y-1">
                <ul className="flex flex-wrap gap-2">
                  {a.options.map((o) => (
                    <li
                      key={o.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5"
                    >
                      {o.label}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() =>
                          setDialog({ kind: "rename-option", id: o.id, label: o.label })
                        }
                      >
                        Ad
                      </button>
                      <button
                        type="button"
                        className="text-red-700 underline"
                        aria-label={`${o.label} seçeneğini sil`}
                        onClick={() => removeOption(o.id, o.label)}
                      >
                        Sil
                      </button>
                    </li>
                  ))}
                </ul>
                {a.options.length === 0 && (
                  <p className="text-muted-foreground">Henüz seçenek yok.</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog({ kind: "add-option", attribute: a })}
                >
                  Seçenek ekle
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ActionDialog
        open={dialog?.kind === "create"}
        title="Yeni özellik"
        intro="Tür ve çoklu seçim sonradan değiştirilemez."
        fields={[
          { name: "name", label: "Ad" },
          {
            name: "kind",
            label: "Tür",
            options: [
              { value: "option", label: "Seçenek listesi" },
              { value: "text", label: "Metin" },
            ],
          },
          { name: "is_multiple", label: "Birden fazla seçilebilir", options: yesNo },
          { name: "is_filterable", label: "Mağazada filtre olsun", options: yesNo },
          {
            name: "options",
            label: "Seçenekler",
            hint: "Virgülle ayırın: Pamuk, Viskon, Keten. Sonradan eklenebilir.",
          },
        ]}
        defaults={{
          name: "",
          kind: "option",
          is_multiple: "false",
          is_filterable: "false",
          options: "",
        }}
        schema={createSchema}
        success="Özellik oluşturuldu."
        submit={(v) =>
          create.mutateAsync({
            name: v.name,
            kind: v.kind,
            is_multiple: v.is_multiple === "true",
            is_filterable: v.is_filterable === "true",
            options: parseOptions(v.options),
          })
        }
        onClose={close}
      />
      <ActionDialog
        open={dialog?.kind === "edit"}
        title="Özelliği düzenle"
        fields={[
          { name: "name", label: "Ad" },
          ...(dialog?.kind === "edit" && dialog.attribute.kind === "option"
            ? [{ name: "is_filterable", label: "Mağazada filtre olsun", options: yesNo }]
            : []),
        ]}
        defaults={
          dialog?.kind === "edit"
            ? {
                name: dialog.attribute.name,
                is_filterable: String(dialog.attribute.is_filterable),
              }
            : { name: "", is_filterable: "false" }
        }
        schema={editSchema}
        success="Kaydedildi."
        submit={(v) =>
          update.mutateAsync({
            id: (dialog as Extract<Dialog, { kind: "edit" }>).attribute.id,
            body: { name: v.name, is_filterable: v.is_filterable === "true" },
          })
        }
        onClose={close}
      />
      <ActionDialog
        open={dialog?.kind === "add-option"}
        title="Seçenek ekle"
        fields={[{ name: "label", label: "Seçenek" }]}
        defaults={{ label: "" }}
        schema={optionSchema}
        success="Seçenek eklendi."
        submit={(v) =>
          addOption.mutateAsync({
            attributeId: (dialog as Extract<Dialog, { kind: "add-option" }>).attribute.id,
            label: v.label,
          })
        }
        onClose={close}
      />
      <ActionDialog
        open={dialog?.kind === "rename-option"}
        title="Seçeneği yeniden adlandır"
        intro="Bu seçeneği kullanan ürünlerde yeni ad görünür."
        fields={[{ name: "label", label: "Seçenek" }]}
        defaults={{ label: dialog?.kind === "rename-option" ? dialog.label : "" }}
        schema={optionSchema}
        success="Kaydedildi."
        submit={(v) =>
          renameOption.mutateAsync({
            id: (dialog as Extract<Dialog, { kind: "rename-option" }>).id,
            label: v.label,
          })
        }
        onClose={close}
      />
    </div>
  );
}
