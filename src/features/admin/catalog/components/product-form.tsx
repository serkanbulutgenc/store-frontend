import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
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
import { FIT_NOTE_MAX, type ProductFormValues, productFormSchema, toProductBody } from "../schemas";
import { guideSource } from "../size-guide-form";
import { DescriptionEditor } from "./description-editor";

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
  desi: "",
  description: "",
  size_guide: "",
  fit_note: "",
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
    desi: p.desi == null ? "" : String(p.desi),
    description: p.description,
    size_guide: p.size_guide ?? "",
    fit_note: p.fit_note,
  };
}

/** Field names per editor tab, so a tab can show an error marker. */
export const GENERAL_FIELDS: (keyof ProductFormValues)[] = [
  "title",
  "category_id",
  "brand_id",
  "product_class_id",
  "low_stock_threshold",
  "slug",
];
export const DESCRIPTION_FIELDS: (keyof ProductFormValues)[] = ["description"];
export const SIZE_GUIDE_FIELDS: (keyof ProductFormValues)[] = ["size_guide", "fit_note"];
export const PRICE_FIELDS: (keyof ProductFormValues)[] = [
  "shelf_price",
  "old_price",
  "cost_price",
  "supplier_id",
  "supplier_code",
  "desi",
];

/**
 * Create and edit share this form state. Fields the user may not see (cost price, Supplier) are
 * not rendered and not sent: the API omits them from Staff responses and rejects them in requests.
 */
export function useProductForm({
  product,
  me,
  onSaved,
}: {
  product?: ProductOut;
  me: Me;
  onSaved?: (p: ProductOut) => void;
}) {
  const canSeeCost = can(me, "view_cost_prices");
  const canSeeSupplier = can(me, "manage_suppliers");
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
            { cost: canSeeCost, supplier: canSeeSupplier, desi: can(me, "manage_settings") },
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
  return form;
}
export type ProductFormApi = ReturnType<typeof useProductForm>;

type FieldsProps = { form: ProductFormApi; me: Me; product?: ProductOut };

/** Genel: name, category, brand, class, thresholds and slug. */
export function GeneralFields({ form, me, product }: FieldsProps) {
  const canEdit = can(me, "manage_products");
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: brands } = useSuspenseQuery(brandsQuery);
  const { data: classes } = useSuspenseQuery(productClassesQuery);
  return (
    <fieldset disabled={!canEdit} className="grid grid-cols-2 gap-3">
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
  );
}

/** Fiyat: sale and old price for everyone; cost price and Supplier only for those allowed. */
export function PriceFields({ form, me }: FieldsProps) {
  const canEdit = can(me, "manage_products");
  const canSeeCost = can(me, "view_cost_prices");
  const canSeeSupplier = can(me, "manage_suppliers");
  // Staff may not list Suppliers (the API answers 403), so only Owners ask.
  const suppliers = useQuery({ ...suppliersQuery, enabled: canSeeSupplier });
  const { data: classes } = useSuspenseQuery(productClassesQuery);
  const classId = useStore(form.store, (s) => s.values.product_class_id);
  const classDesi = classes.find((c) => String(c.id) === classId)?.default_desi;
  return (
    <fieldset disabled={!canEdit} className="grid grid-cols-2 gap-3">
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
      {can(me, "manage_settings") && (
        <form.Field name="desi">
          {(f) => (
            <Field
              field={f}
              label="Desi"
              hint={
                classDesi == null
                  ? "Kargo boyutu. Boş bırakılırsa sınıfın desisi kullanılır."
                  : `Kargo boyutu. Boş bırakılırsa sınıfın desisi (${classDesi}) kullanılır.`
              }
            >
              <Input inputMode="numeric" {...bind(f)} />
            </Field>
          )}
        </form.Field>
      )}
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
    </fieldset>
  );
}

/** Açıklama: the Markdown Description. Image upload needs the photo permission as well. */
export function DescriptionFields({ form, me }: FieldsProps) {
  return (
    <fieldset disabled={!can(me, "manage_products")}>
      <form.Field name="description">
        {(f) => (
          <DescriptionEditor
            field={f}
            canUpload={can(me, "manage_product_photos")}
            disabled={!can(me, "manage_products")}
          />
        )}
      </form.Field>
    </fieldset>
  );
}

/**
 * Beden tablosu: the Fit note and this Product's own Size guide. Without an override the
 * Product shows its class guide, which has its own editor; the reset puts it back to that.
 */
export function SizeGuideFields({ form, me, product }: FieldsProps) {
  const canEdit = can(me, "manage_products");
  return (
    <fieldset disabled={!canEdit} className="space-y-4">
      <form.Field name="fit_note">
        {(f) => (
          <Field
            field={f}
            label="Kalıp notu"
            hint="İsteğe bağlı, tek satır. Beden seçicinin altında görünür. Örn. Dar kalıp, bir beden büyük alın."
          >
            <Input {...bind(f)} maxLength={FIT_NOTE_MAX * 2} />
          </Field>
        )}
      </form.Field>
      <form.Field name="size_guide">
        {(f) => {
          const source = guideSource((f.state.value ?? "") as string);
          return (
            <div className="space-y-2">
              <DescriptionEditor
                field={f}
                label="Bu ürüne özel beden tablosu"
                canUpload={can(me, "manage_product_photos")}
                disabled={!canEdit}
              />
              <p className="text-sm text-muted-foreground" data-testid="guide-source">
                {source === "override"
                  ? "Bu ürün kendi tablosunu gösterir."
                  : `Boş: bu ürün ${product ? `“${product.product_class.name}” sınıfının` : "sınıfının"} tablosunu gösterir.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {source === "override" && canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => f.handleChange("")}
                  >
                    Sınıf tablosunu kullan
                  </Button>
                )}
                {product && (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link
                      to="/admin/product-classes/$classId/size-guide"
                      params={{ classId: String(product.product_class.id) }}
                    >
                      Sınıf tablosunu düzenle
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        }}
      </form.Field>
    </fieldset>
  );
}

/** Form message and Kaydet, shared by the create page and the editor tabs. */
export function ProductFormFooter({
  form,
  me,
  label,
}: {
  form: ProductFormApi;
  me: Me;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      {can(me, "manage_products") && (
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <Button type="submit" size="sm" disabled={submitting}>
              <Save aria-hidden className="size-4" />
              {label}
            </Button>
          )}
        </form.Subscribe>
      )}
    </div>
  );
}

/** The create page: every field on one screen. Editing uses the tabs in `ProductEditor`. */
export function ProductForm({ me, onSaved }: { me: Me; onSaved?: (p: ProductOut) => void }) {
  const form = useProductForm({ me, onSaved });
  return (
    <form
      className="max-w-3xl space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <GeneralFields form={form} me={me} />
      <PriceFields form={form} me={me} />
      <DescriptionFields form={form} me={me} />
      <ProductFormFooter form={form} me={me} label="Ürünü oluştur" />
    </form>
  );
}
