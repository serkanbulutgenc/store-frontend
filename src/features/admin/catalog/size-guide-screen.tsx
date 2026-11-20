import { useForm, useStore } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { FormMessage } from "../forms/field";
import { useDirtyGuard } from "../forms/use-dirty-guard";
import { DescriptionEditor } from "./components/description-editor";
import { classGuideQuery, productClassesQuery, useSetClassGuide } from "./queries";
import { classGuideSchema, toClassGuideBody } from "./size-guide-form";

/**
 * The Size guide of one Product class ("Beden tablosu"). Every Product of the class shows it
 * unless it has its own override; an edit applies to all of them at once, with no versions.
 */
export function ClassSizeGuideScreen({ classId, me }: { classId: number; me: Me }) {
  const { data: classes } = useSuspenseQuery(productClassesQuery);
  const { data: guide } = useSuspenseQuery(classGuideQuery(classId));
  const save = useSetClassGuide(classId);
  const productClass = classes.find((c) => c.id === classId);
  const canEdit = can(me, "manage_products");

  const form = useForm({
    defaultValues: { text: guide.text },
    validators: {
      onSubmit: classGuideSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const saved = await save.mutateAsync(toClassGuideBody(classGuideSchema.parse(value)));
          // Reset first so the dirty-leave guard does not block what follows.
          form.reset({ text: saved.text });
          toast.success("Beden tablosu kaydedildi.");
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
  });
  useDirtyGuard(useStore(form.store, (s) => s.isDirty && !s.isSubmitting));

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">
          Beden tablosu{productClass ? `: ${productClass.name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {productClass?.product_count ?? 0} ürün bu tabloyu gösterir; kendi tablosu olan ürünler
          hariç. Değişiklik hepsine hemen yansır. Tek ebatlı ürünlerde tablo gösterilmez.
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={!canEdit}>
          <form.Field name="text">
            {(f) => (
              <DescriptionEditor
                field={f}
                label="Tablo"
                canUpload={can(me, "manage_product_photos")}
                disabled={!canEdit}
              />
            )}
          </form.Field>
        </fieldset>
        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(err) => <FormMessage error={err} />}
        </form.Subscribe>
        <div className="flex gap-2">
          {canEdit && (
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" size="sm" disabled={submitting}>
                  <Save aria-hidden className="size-4" />
                  Kaydet
                </Button>
              )}
            </form.Subscribe>
          )}
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/admin/products">Ürünlere dön</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
