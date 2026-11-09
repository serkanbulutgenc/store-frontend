import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { can, type Me } from "@/lib/api/me";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormMessage } from "../../forms/field";
import { useDirtyGuard } from "../../forms/use-dirty-guard";
import { categoryLabels } from "../labels";
import {
  brandsQuery,
  categoriesQuery,
  type ProductOut,
  productClassesQuery,
  suppliersQuery,
  useCreateProduct,
  useUpdateProduct,
} from "../queries";
import { type ProductFormValues, productFormSchema, toProductBody } from "../schemas";

const EMPTY: ProductFormValues = {
  title: "",
  slug: "",
  category_id: "",
  brand_id: "",
  product_class_id: "",
  shelf_price: "",
  old_price: "",
  cost_price: "",
  supplier_id: "",
  supplier_code: "",
  low_stock_threshold: "",
};

function toFormValues(p: ProductOut): ProductFormValues {
  return {
    title: p.title,
    slug: p.slug,
    category_id: p.category ? String(p.category.id) : "",
    brand_id: p.brand ? String(p.brand.id) : "",
    product_class_id: String(p.product_class.id),
    shelf_price: p.shelf_price,
    old_price: p.old_price ?? "",
    cost_price: p.cost_price ?? "",
    supplier_id: p.supplier ? String(p.supplier.id) : "",
    supplier_code: p.supplier_code ?? "",
    low_stock_threshold: String(p.low_stock_threshold),
  };
}

/**
 * Create and edit share this form. Fields the user may not see (cost price, Supplier) are
 * not rendered and not sent: the API omits them from Staff responses and rejects them in requests.
 */
export function ProductForm({
  product,
  me,
  onSaved,
}: {
  product?: ProductOut;
  me: Me;
  onSaved?: (p: ProductOut) => void;
}) {
  const canEdit = can(me, "manage_products");
  const canSeeCost = can(me, "view_cost_prices");
  const canSeeSupplier = can(me, "manage_suppliers");
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: brands } = useSuspenseQuery(brandsQuery);
  const { data: classes } = useSuspenseQuery(productClassesQuery);
  // Staff may not list Suppliers (the API answers 403), so only Owners ask.
  const suppliers = useQuery({ ...suppliersQuery, enabled: canSeeSupplier });

  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? 0);
  const initial = product ? toFormValues(product) : EMPTY;

  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: productFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const body = toProductBody(
            productFormSchema.parse(value),
            { cost: canSeeCost, supplier: canSeeSupplier },
            product ? "edit" : "create",
          );
          const saved = product ? await update.mutateAsync(body) : await create.mutateAsync(body);
          // Reset first so the dirty-leave guard does not block the navigation that follows.
          form.reset(toFormValues(saved));
          toast.success("Ürün kaydedildi.");
          onSaved?.(saved);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
  });
  useDirtyGuard(useStore(form.store, (s) => s.isDirty && !s.isSubmitting));

  return (
    <form
      className="grid max-w-3xl grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={!canEdit} className="col-span-2 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <form.Field name="title">
            {(f) => (
              <Field field={f} label="Ürün adı">
                <Input {...bind(f)} />
              </Field>
            )}
          </form.Field>
        </div>
        <form.Field name="category_id">
          {(f) => (
            <Field field={f} label="Kategori">
              <Select {...bind(f)}>
                <option value="">Seçin…</option>
                {categoryLabels(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </form.Field>
        <form.Field name="brand_id">
          {(f) => (
            <Field field={f} label="Marka">
              <Select {...bind(f)}>
                <option value="">Markasız</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </form.Field>
        <form.Field name="product_class_id">
          {(f) => (
            <Field
              field={f}
              label="Ürün sınıfı"
              hint={
                product
                  ? "Oluşturulduktan sonra değiştirilemez."
                  : "Beden listesini ve KDV oranını belirler."
              }
            >
              <Select {...bind(f)} disabled={!!product || !canEdit}>
                <option value="">Seçin…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </form.Field>
        <div className="space-y-1">
          <span className="block font-medium">KDV oranı</span>
          <p className="flex h-8 items-center text-muted-foreground">
            {product ? `%${Number(product.kdv_rate)}` : "Sınıfa göre belirlenir"}
          </p>
        </div>
        <form.Field name="shelf_price">
          {(f) => (
            <Field field={f} label="Satış fiyatı (KDV dahil)" hint="Örn. 199.90">
              <Input inputMode="decimal" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="old_price">
          {(f) => (
            <Field field={f} label="Eski fiyat" hint="İndirim göstermek için, isteğe bağlı.">
              <Input inputMode="decimal" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        {canSeeCost && (
          <form.Field name="cost_price">
            {(f) => (
              <Field field={f} label="Alış fiyatı">
                <Input inputMode="decimal" {...bind(f)} />
              </Field>
            )}
          </form.Field>
        )}
        {canSeeSupplier && (
          <>
            <form.Field name="supplier_id">
              {(f) => (
                <Field field={f} label="Tedarikçi">
                  <Select {...bind(f)}>
                    <option value="">Seçilmedi</option>
                    {suppliers.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </form.Field>
            <form.Field name="supplier_code">
              {(f) => (
                <Field field={f} label="Tedarikçi ürün kodu">
                  <Input {...bind(f)} />
                </Field>
              )}
            </form.Field>
          </>
        )}
        <form.Field name="low_stock_threshold">
          {(f) => (
            <Field
              field={f}
              label="Düşük stok eşiği"
              hint="Boş bırakılırsa mağaza varsayılanı kullanılır."
            >
              <Input inputMode="numeric" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="slug">
          {(f) => (
            <Field field={f} label="Adres (slug)" hint="Boş bırakılırsa addan üretilir.">
              <Input {...bind(f)} />
            </Field>
          )}
        </form.Field>
      </fieldset>
      <div className="col-span-2 space-y-2">
        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(err) => <FormMessage error={err} />}
        </form.Subscribe>
        {canEdit && (
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(submitting) => (
              <Button type="submit" size="sm" disabled={submitting}>
                {product ? "Kaydet" : "Ürünü oluştur"}
              </Button>
            )}
          </form.Subscribe>
        )}
      </div>
    </form>
  );
}
