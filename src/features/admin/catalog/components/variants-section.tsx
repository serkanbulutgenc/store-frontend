import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { can, type Me } from "@/lib/api/me";
import { formatTry } from "@/lib/format";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../../forms/field";
import {
  coloursQuery,
  type ProductOut,
  useCreateVariant,
  useUpdateVariant,
  type VariantOut,
} from "../queries";
import { toVariantBody, variantEditSchema, variantFormSchema } from "../schemas";
import { AdjustStockDialog, type AdjustTarget } from "./adjust-stock-dialog";
import { StockGridDialog } from "./stock-grid-dialog";
import { VariantMatrixDialog } from "./variant-matrix-dialog";

export function VariantsSection({ product, me }: { product: ProductOut; me: Me }) {
  const [adding, setAdding] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const [grid, setGrid] = useState(false);
  const [editing, setEditing] = useState<VariantOut | null>(null);
  const [adjusting, setAdjusting] = useState<AdjustTarget | null>(null);
  const canManage = can(me, "manage_products");
  const canAdjust = can(me, "adjust_stock");

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Varyantlar</h2>
        <div className="flex gap-2">
          {canAdjust && product.variants.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setGrid(true)}>
              Stok tablosu
            </Button>
          )}
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setMatrix(true)}>
              Toplu oluştur
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setAdding(true)}>
              Varyant ekle
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Renk</TableHead>
              <TableHead>Beden</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Barkod</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Henüz varyant yok. Yayınlamadan önce en az bir varyant ekleyin.
                </TableCell>
              </TableRow>
            ) : (
              product.variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-3 rounded-sm border border-border"
                        style={{ background: v.colour.hex_code }}
                      />
                      {v.colour.name}
                    </span>
                  </TableCell>
                  <TableCell>{v.size}</TableCell>
                  <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                  <TableCell className="font-mono text-xs">{v.barcode ?? "—"}</TableCell>
                  <TableCell>
                    {v.price_override ? (
                      formatTry(v.price_override)
                    ) : (
                      <span className="text-muted-foreground">Ürün fiyatı</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {v.stock.on_hand}
                    {v.stock.allocated > 0 && (
                      <span className="text-muted-foreground"> ({v.stock.allocated} ayrıldı)</span>
                    )}{" "}
                    {v.is_low_stock && <Badge tone="warn">Düşük</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canAdjust && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAdjusting({
                              id: v.id,
                              label: `${product.title} · ${v.colour.name} / ${v.size}`,
                              onHand: v.stock.on_hand,
                            })
                          }
                        >
                          Stok
                        </Button>
                      )}
                      {canManage && (
                        <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                          Düzenle
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={adding} onClose={() => setAdding(false)} title="Varyant ekle">
        {adding && <NewVariantForm product={product} onClose={() => setAdding(false)} />}
      </Dialog>
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Varyantı düzenle">
        {editing && <EditVariantForm variant={editing} onClose={() => setEditing(null)} />}
      </Dialog>
      <VariantMatrixDialog product={product} open={matrix} onClose={() => setMatrix(false)} />
      <StockGridDialog product={product} open={grid} onClose={() => setGrid(false)} />
      <AdjustStockDialog target={adjusting} onClose={() => setAdjusting(null)} />
    </section>
  );
}

function NewVariantForm({ product, onClose }: { product: ProductOut; onClose: () => void }) {
  const { data: colours } = useSuspenseQuery(coloursQuery);
  const create = useCreateVariant(product.id);
  const form = useForm({
    defaultValues: {
      colour_id: "",
      size: "",
      sku: "",
      barcode: "",
      price_override: "",
      stock: "0",
    },
    validators: {
      onSubmit: variantFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await create.mutateAsync(toVariantBody(variantFormSchema.parse(value)));
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success("Varyant eklendi.");
      onClose();
    },
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="colour_id">
        {(f) => (
          <Field field={f} label="Renk">
            <Select {...bind(f)} autoFocus>
              <option value="">Seçin…</option>
              {colours
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}
      </form.Field>
      <form.Field name="size">
        {(f) => (
          <Field
            field={f}
            label="Beden"
            hint={`${product.product_class.name} için: ${product.product_class.sizes.join(", ")}`}
          >
            <Select {...bind(f)}>
              <option value="">Seçin…</option>
              {product.product_class.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form.Field>
      <form.Field name="sku">
        {(f) => (
          <Field field={f} label="SKU" hint="Boş bırakılırsa otomatik üretilir.">
            <Input {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="barcode">
        {(f) => (
          <Field field={f} label="Barkod" hint="İsteğe bağlı.">
            <Input {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="price_override">
        {(f) => (
          <Field field={f} label="Varyant fiyatı" hint="Boşsa ürün fiyatı geçerli olur.">
            <Input inputMode="decimal" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="stock">
        {(f) => (
          <Field field={f} label="Açılış stoğu">
            <Input inputMode="numeric" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(sub) => <FormActions submitting={sub} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}

/** Colour and size are fixed once a Variant exists; only SKU, barcode and price can change. */
function EditVariantForm({ variant, onClose }: { variant: VariantOut; onClose: () => void }) {
  const update = useUpdateVariant();
  const form = useForm({
    defaultValues: {
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      price_override: variant.price_override ?? "",
    },
    validators: {
      onSubmit: variantEditSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const v = variantEditSchema.parse(value);
          await update.mutateAsync({
            id: variant.id,
            body: {
              sku: v.sku,
              barcode: v.barcode || null,
              price_override: v.price_override || null,
            },
          });
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success("Varyant güncellendi.");
      onClose();
    },
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-muted-foreground">
        {variant.colour.name} / {variant.size}
      </p>
      <form.Field name="sku">
        {(f) => (
          <Field field={f} label="SKU">
            <Input {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="barcode">
        {(f) => (
          <Field field={f} label="Barkod">
            <Input {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="price_override">
        {(f) => (
          <Field field={f} label="Varyant fiyatı" hint="Boşsa ürün fiyatı geçerli olur.">
            <Input inputMode="decimal" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(sub) => <FormActions submitting={sub} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}
